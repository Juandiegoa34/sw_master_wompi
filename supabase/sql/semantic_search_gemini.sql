-- Semantic search setup for SW Mujeres
-- Run this in Supabase SQL Editor.

create extension if not exists vector;

alter table public.business_profiles
add column if not exists embedding halfvec(3072);

create or replace function public.match_businesses_gemini(
  query_embedding halfvec(3072),
  similarity_threshold float default 0.5,
  match_count int default 10
)
returns table (
  id uuid,
  entrepreneur_id uuid,
  business_name text,
  description text,
  category text,
  city text,
  business_phone text,
  instagram_handle text,
  website_url text,
  other_socials text,
  directory_image_path text,
  offers_discount boolean,
  discount_details text,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    bp.id,
    bp.entrepreneur_id,
    bp.business_name,
    bp.description,
    bp.category,
    bp.city,
    bp.business_phone,
    bp.instagram_handle,
    bp.website_url,
    bp.other_socials,
    bp.directory_image_path,
    bp.offers_discount,
    bp.discount_details,
    (1 - (bp.embedding::halfvec(3072) <=> query_embedding))::float as similarity
  from public.business_profiles bp
  where bp.embedding is not null
    and exists (
      select 1
      from public.memberships m
      where m.entrepreneur_id = bp.entrepreneur_id
        and m.status = 'active'
        and m.end_at > now()
    )
    and exists (
      select 1
      from public.applications a
      where a.entrepreneur_id = bp.entrepreneur_id
        and a.status = 'aprobado'
    )
    and (1 - (bp.embedding::halfvec(3072) <=> query_embedding)) >= similarity_threshold
  order by bp.embedding::halfvec(3072) <=> query_embedding
  limit match_count;
$$;
