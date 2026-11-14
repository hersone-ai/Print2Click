-- Persistent per-user protection for the Gemini extraction endpoint.
create table if not exists public.extraction_rate_limits (
  user_id uuid primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0)
);

alter table public.extraction_rate_limits enable row level security;
revoke all on table public.extraction_rate_limits from public, anon, authenticated;

create or replace function public.consume_extraction_quota()
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_started_at timestamptz;
  v_request_count integer;
  v_user_id uuid := auth.uid();
  v_window interval := interval '1 hour';
  v_limit integer := 10;
begin
  if v_user_id is null then
    raise exception 'An authenticated user is required';
  end if;

  insert into public.extraction_rate_limits as limits (user_id, window_started_at, request_count)
  values (v_user_id, v_now, 1)
  on conflict (user_id) do update
    set window_started_at = case
          when limits.window_started_at <= v_now - v_window then v_now
          else limits.window_started_at
        end,
        request_count = case
          when limits.window_started_at <= v_now - v_window then 1
          else limits.request_count + 1
        end
  returning window_started_at, request_count
    into v_window_started_at, v_request_count;

  delete from public.extraction_rate_limits
  where window_started_at < v_now - interval '24 hours';

  return query select
    v_request_count <= v_limit,
    greatest(v_limit - v_request_count, 0),
    v_window_started_at + v_window;
end;
$$;

revoke all on function public.consume_extraction_quota() from public, anon, authenticated;
grant execute on function public.consume_extraction_quota() to authenticated;
