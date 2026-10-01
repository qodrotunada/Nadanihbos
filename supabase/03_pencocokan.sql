-- Query 3/3: cari satu kandidat terbaik per orang. Akses hanya dari server.
create or replace function public.find_face_candidates(
  p_owner uuid,
  p_embedding extensions.vector(1024),
  p_limit integer default 3
)
returns table (profile_id uuid, display_name text, similarity double precision)
language sql stable security invoker set search_path = '' as $$
  select p.id, p.display_name,
    max(1.0 - (s.embedding OPERATOR(extensions.<=>) p_embedding))::double precision as similarity
  from public.face_profiles p
  join public.face_samples s on s.profile_id = p.id
  where p.owner_id = p_owner
  group by p.id, p.display_name
  order by similarity desc
  limit greatest(1, least(coalesce(p_limit, 3), 10));
$$;
revoke all on function public.find_face_candidates(uuid, extensions.vector, integer)
  from public, anon, authenticated;
grant execute on function public.find_face_candidates(uuid, extensions.vector, integer)
  to service_role;
