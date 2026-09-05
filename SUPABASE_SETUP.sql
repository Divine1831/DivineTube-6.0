-- DivineTube Advanced database + RLS + Storage
create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null default 'Creator',
 avatar_url text,
 bio text default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.videos (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 title text not null,
 description text default '',
 category text not null default 'General',
 video_url text not null,
 thumbnail_url text,
 duration text,
 views bigint not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.likes (
 user_id uuid not null references auth.users(id) on delete cascade,
 video_id uuid not null references public.videos(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_id,video_id)
);

create table if not exists public.comments (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 video_id uuid not null references public.videos(id) on delete cascade,
 content text not null,
 created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
 subscriber_id uuid not null references auth.users(id) on delete cascade,
 channel_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(subscriber_id,channel_id),
 check(subscriber_id<>channel_id)
);

create table if not exists public.saved_videos (
 user_id uuid not null references auth.users(id) on delete cascade,
 video_id uuid not null references public.videos(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_id,video_id)
);

create table if not exists public.watch_history (
 user_id uuid not null references auth.users(id) on delete cascade,
 video_id uuid not null references public.videos(id) on delete cascade,
 watched_at timestamptz not null default now(),
 primary key(user_id,video_id)
);

create index if not exists videos_owner_idx on public.videos(owner_id);
create index if not exists videos_created_idx on public.videos(created_at desc);
create index if not exists videos_views_idx on public.videos(views desc);
create index if not exists comments_video_idx on public.comments(video_id,created_at desc);
create index if not exists history_user_idx on public.watch_history(user_id,watched_at desc);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,username)
 values(new.id,coalesce(new.raw_user_meta_data->>'username',split_part(new.email,'@',1),'Creator'))
 on conflict(id) do nothing;
 return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.increment_view(video_uuid uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 update public.videos set views=views+1,updated_at=now() where id=video_uuid;
end $$;

revoke all on function public.increment_view(uuid) from public;
grant execute on function public.increment_view(uuid) to anon,authenticated;

alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.saved_videos enable row level security;
alter table public.watch_history enable row level security;

drop policy if exists profiles_public_read on public.profiles;
create policy profiles_public_read on public.profiles for select using(true);
drop policy if exists profiles_owner_insert on public.profiles;
create policy profiles_owner_insert on public.profiles for insert to authenticated with check(id=auth.uid());
drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());

drop policy if exists videos_public_read on public.videos;
create policy videos_public_read on public.videos for select using(true);
drop policy if exists videos_owner_insert on public.videos;
create policy videos_owner_insert on public.videos for insert to authenticated with check(owner_id=auth.uid());
drop policy if exists videos_owner_update on public.videos;
create policy videos_owner_update on public.videos for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists videos_owner_delete on public.videos;
create policy videos_owner_delete on public.videos for delete to authenticated using(owner_id=auth.uid());

drop policy if exists likes_read on public.likes;
create policy likes_read on public.likes for select using(true);
drop policy if exists likes_insert on public.likes;
create policy likes_insert on public.likes for insert to authenticated with check(user_id=auth.uid());
drop policy if exists likes_delete on public.likes;
create policy likes_delete on public.likes for delete to authenticated using(user_id=auth.uid());

drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select using(true);
drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert to authenticated with check(user_id=auth.uid());
drop policy if exists comments_update on public.comments;
create policy comments_update on public.comments for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments for delete to authenticated using(user_id=auth.uid());

drop policy if exists subscriptions_read on public.subscriptions;
create policy subscriptions_read on public.subscriptions for select using(true);
drop policy if exists subscriptions_insert on public.subscriptions;
create policy subscriptions_insert on public.subscriptions for insert to authenticated with check(subscriber_id=auth.uid());
drop policy if exists subscriptions_delete on public.subscriptions;
create policy subscriptions_delete on public.subscriptions for delete to authenticated using(subscriber_id=auth.uid());

drop policy if exists saved_read on public.saved_videos;
create policy saved_read on public.saved_videos for select to authenticated using(user_id=auth.uid());
drop policy if exists saved_insert on public.saved_videos;
create policy saved_insert on public.saved_videos for insert to authenticated with check(user_id=auth.uid());
drop policy if exists saved_delete on public.saved_videos;
create policy saved_delete on public.saved_videos for delete to authenticated using(user_id=auth.uid());

drop policy if exists history_read on public.watch_history;
create policy history_read on public.watch_history for select to authenticated using(user_id=auth.uid());
drop policy if exists history_insert on public.watch_history;
create policy history_insert on public.watch_history for insert to authenticated with check(user_id=auth.uid());
drop policy if exists history_update on public.watch_history;
create policy history_update on public.watch_history for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists history_delete on public.watch_history;
create policy history_delete on public.watch_history for delete to authenticated using(user_id=auth.uid());

grant usage on schema public to anon,authenticated;
grant select on public.profiles,public.videos,public.likes,public.comments,public.subscriptions to anon,authenticated;
grant select,insert,update,delete on public.profiles,public.videos,public.likes,public.comments,public.subscriptions,public.saved_videos,public.watch_history to authenticated;

insert into storage.buckets(id,name,public)
values('videos','videos',true),('thumbnails','thumbnails',true)
on conflict(id) do update set public=excluded.public;

drop policy if exists video_objects_read on storage.objects;
create policy video_objects_read on storage.objects for select using(bucket_id='videos');
drop policy if exists video_objects_insert on storage.objects;
create policy video_objects_insert on storage.objects for insert to authenticated
with check(bucket_id='videos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists video_objects_update on storage.objects;
create policy video_objects_update on storage.objects for update to authenticated
using(bucket_id='videos' and (storage.foldername(name))[1]=auth.uid()::text)
with check(bucket_id='videos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists video_objects_delete on storage.objects;
create policy video_objects_delete on storage.objects for delete to authenticated
using(bucket_id='videos' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists thumb_objects_read on storage.objects;
create policy thumb_objects_read on storage.objects for select using(bucket_id='thumbnails');
drop policy if exists thumb_objects_insert on storage.objects;
create policy thumb_objects_insert on storage.objects for insert to authenticated
with check(bucket_id='thumbnails' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists thumb_objects_update on storage.objects;
create policy thumb_objects_update on storage.objects for update to authenticated
using(bucket_id='thumbnails' and (storage.foldername(name))[1]=auth.uid()::text)
with check(bucket_id='thumbnails' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists thumb_objects_delete on storage.objects;
create policy thumb_objects_delete on storage.objects for delete to authenticated
using(bucket_id='thumbnails' and (storage.foldername(name))[1]=auth.uid()::text);

notify pgrst,'reload schema';
