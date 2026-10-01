import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
}) : null;

export type Person = { id: string; display_name: string; created_at: string; consent_at: string };
export type Event = {
  id: number;
  profile_id: string | null;
  similarity: number | null;
  detected_at: string;
  face_profiles: { display_name: string } | null;
};
export type ListResponse = { people: Person[]; history: Event[] };
export type RecognizeResponse = {
  recognized: boolean;
  name: string | null;
  similarity: number | null;
  reason: string;
};

export async function request<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  if (!supabase) throw Error('Supabase belum dihubungkan. Isi environment variables dan deploy ulang.');
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw Error('Silakan masuk sebagai pengajar.');
  const response = await fetch('/api/face', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ action, ...payload }),
    cache: 'no-store',
  });
  let result: Record<string, unknown>;
  try { result = await response.json() as Record<string, unknown>; }
  catch { throw Error('API tidak tersedia. Jalankan aplikasi di Vercel atau gunakan vercel dev.'); }
  if (!response.ok) throw Error(typeof result.error === 'string' ? result.error : 'Server tidak dapat memproses permintaan.');
  return result as T;
}
