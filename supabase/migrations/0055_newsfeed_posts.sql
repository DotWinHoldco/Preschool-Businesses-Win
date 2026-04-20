-- Newsfeed posts table for school-wide and classroom announcements
-- @anchor: cca.newsfeed.migration

create table if not exists newsfeed_posts (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  author_id   uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  body        text,
  audience    text not null default 'all_parents'
    check (audience in ('all_parents', 'classroom', 'staff')),
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for tenant-scoped queries ordered by newest first
create index idx_newsfeed_posts_tenant_created
  on newsfeed_posts (tenant_id, created_at desc);

-- Index for pinned posts
create index idx_newsfeed_posts_pinned
  on newsfeed_posts (tenant_id, pinned)
  where pinned = true;

-- RLS
alter table newsfeed_posts enable row level security;

create policy "Tenant isolation" on newsfeed_posts
  using (tenant_id = current_setting('app.tenant_id', true)::uuid);

create policy "Staff can insert" on newsfeed_posts
  for insert
  with check (tenant_id = current_setting('app.tenant_id', true)::uuid);

create policy "Author or admin can update" on newsfeed_posts
  for update
  using (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    and (
      author_id = auth.uid()
      or exists (
        select 1 from user_tenant_memberships
        where user_id = auth.uid()
          and tenant_id = newsfeed_posts.tenant_id
          and role in ('owner', 'admin', 'director')
          and status = 'active'
      )
    )
  );
