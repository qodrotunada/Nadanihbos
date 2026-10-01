import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

type Payload = Record<string, unknown>;
type Vector = number[];
const ok = (res: VercelResponse, status: number, value: Payload) => res.status(status).json(value);

function vector(value: unknown): Vector | null {
  if (!Array.isArray(value) || value.length !== 1024) return null;
  const data: number[] = [];
  let sum = 0;
  for (const item of value) {
    if (typeof item !== 'number' || !Number.isFinite(item) || Math.abs(item) > 100) return null;
    data.push(item);
    sum += item * item;
  }
  return sum > 0.00001 ? data : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return ok(res, 405, { error: 'Gunakan metode POST.' });
  const url = process.env.SUPABASE_URL;
  const publishable = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const teacherEmail = process.env.INSTRUCTOR_EMAIL?.trim().toLowerCase();
  if (!url || !publishable || !secret || !teacherEmail) return ok(res, 503, { error: 'Konfigurasi server belum lengkap. Periksa variabel Vercel.' });
  const token = /^Bearer (\S+)$/.exec(String(req.headers.authorization || ''))?.[1];
  if (!token) return ok(res, 401, { error: 'Silakan masuk sebagai pengajar.' });
  try {
    const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user || !user.email_confirmed_at || user.email?.toLowerCase() !== teacherEmail) {
      return ok(res, 403, { error: 'Hanya akun pengajar yang sudah dikonfirmasi yang dapat mengakses data wajah.' });
    }
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Payload;
    const action = body.action;

    if (action === 'enroll') {
      const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
      if (name.length < 2 || name.length > 70 || body.consent !== true) {
        return ok(res, 400, { error: 'Isi nama dan minta persetujuan peserta terlebih dahulu.' });
      }
      const samples = Array.isArray(body.samples) ? body.samples.map(vector) : [];
      if (samples.length !== 3 || samples.some(item => item === null)) {
        return ok(res, 400, { error: 'Diperlukan tiga sampel wajah yang valid.' });
      }
      const { data: profile, error: createError } = await admin.from('face_profiles')
        .insert({ owner_id: user.id, display_name: name }).select('id').single();
      if (createError || !profile) return ok(res, 409, { error: createError?.code === '23505' ? 'Nama ini sudah terdaftar. Gunakan nama pembeda.' : createError?.message || 'Gagal mendaftarkan wajah.' });
      const rows = (samples as Vector[]).map(item => ({ profile_id: profile.id, embedding: `[${item.join(',')}]` }));
      const { error: samplesError } = await admin.from('face_samples').insert(rows);
      if (samplesError) {
        await admin.from('face_profiles').delete().eq('id', profile.id).eq('owner_id', user.id);
        return ok(res, 500, { error: `Penyimpanan sampel gagal: ${samplesError.message}` });
      }
      return ok(res, 201, { id: profile.id, name });
    }

    if (action === 'recognize') {
      const embedding = vector(body.embedding);
      if (!embedding) return ok(res, 400, { error: 'Sampel wajah tidak valid.' });
      const { data, error } = await admin.rpc('find_face_candidates', {
        p_owner: user.id, p_embedding: `[${embedding.join(',')}]`, p_limit: 2,
      });
      if (error) return ok(res, 500, { error: `Fungsi pencocokan gagal: ${error.message}` });
      const candidates = (data || []) as Array<{ profile_id: string; display_name: string; similarity: number }>;
      const first = candidates[0];
      const second = candidates[1];
      const threshold = typeof body.threshold === 'number' && Number.isFinite(body.threshold)
        ? Math.max(0.55, Math.min(0.90, body.threshold)) : 0.74;
      const score = first ? Number(first.similarity) : null;
      const recognized = Boolean(first && score !== null && score >= threshold && (!second || score - Number(second.similarity) >= 0.035));
      const profileId = recognized ? first.profile_id : null;
      const { error: logError } = await admin.from('face_events').insert({
        owner_id: user.id, profile_id: profileId,
        similarity: score === null || !Number.isFinite(score) ? null : Number(score.toFixed(4)),
      });
      if (logError) return ok(res, 500, { error: `Hasil tidak tersimpan: ${logError.message}` });
      return ok(res, 200, {
        recognized, name: recognized ? first.display_name : null,
        similarity: score === null || !Number.isFinite(score) ? null : score,
        reason: first && second && score !== null && score - Number(second.similarity) < 0.035 ? 'ambigu' : 'tidak_cocok',
      });
    }

    if (action === 'list') {
      const [people, history] = await Promise.all([
        admin.from('face_profiles').select('id,display_name,created_at,consent_at').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(100),
        admin.from('face_events').select('id,profile_id,similarity,detected_at,face_profiles(display_name)').eq('owner_id', user.id).order('detected_at', { ascending: false }).limit(30),
      ]);
      if (people.error || history.error) return ok(res, 500, { error: people.error?.message || history.error?.message || 'Data tidak tersedia.' });
      return ok(res, 200, { people: people.data || [], history: history.data || [] });
    }

    if (action === 'delete') {
      if (typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.id)) return ok(res, 400, { error: 'ID tidak valid.' });
      const { data, error } = await admin.from('face_profiles').delete().eq('id', body.id).eq('owner_id', user.id).select('id');
      if (error) return ok(res, 500, { error: error.message });
      if (!data?.length) return ok(res, 404, { error: 'Profil tidak ditemukan.' });
      return ok(res, 200, { deleted: true });
    }

    if (action === 'clear_history') {
      const { error } = await admin.from('face_events').delete().eq('owner_id', user.id);
      if (error) return ok(res, 500, { error: error.message });
      return ok(res, 200, { cleared: true });
    }

    return ok(res, 400, { error: 'Aksi tidak dikenal.' });
  } catch (cause) {
    console.error('Face API error', cause);
    return ok(res, 500, { error: 'Terjadi masalah pada server. Periksa log Vercel Function.' });
  }
}
