-- Query 2/3: browser tidak dapat membaca tabel biometrik secara langsung.
alter table public.face_profiles enable row level security;
alter table public.face_samples enable row level security;
alter table public.face_events enable row level security;

revoke all on public.face_profiles, public.face_samples, public.face_events from public, anon, authenticated;
grant select, insert, update, delete on public.face_profiles, public.face_samples, public.face_events to service_role;
grant usage, select on sequence public.face_samples_id_seq, public.face_events_id_seq to service_role;

-- Semua akses aplikasi melalui /api/face, yang memeriksa token Auth dan email pengajar.
