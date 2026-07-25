-- ============================================================
-- Esquema de Supabase para "Dulce Registro" (gestor de productos)
-- Ejecuta este archivo completo en: Supabase > SQL Editor > New query
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Tabla de categorías ----------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- ---------- Tabla de productos ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  quantity integer not null default 0,
  image_url text,
  category_id uuid references categories(id) on delete set null,
  created_at timestamptz default now()
);

-- ---------- Seguridad a nivel de fila ----------
alter table categories enable row level security;
alter table products enable row level security;

create policy "categories_select_auth" on categories
  for select using (auth.role() = 'authenticated');

create policy "categories_write_auth" on categories
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "products_select_auth" on products
  for select using (auth.role() = 'authenticated');

create policy "products_write_auth" on products
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ---------- Categorías iniciales pedidas ----------
insert into categories (name) values
  ('Tortas'),
  ('Bocaditos dulces'),
  ('Bocaditos salados'),
  ('Panes'),
  ('Kekes'),
  ('Pies'),
  ('Cheesecakes')
on conflict (name) do nothing;

-- ============================================================
-- Storage: bucket para las fotos de los productos
-- Créalo desde el panel si el insert de abajo no tiene permisos:
--   Supabase > Storage > New bucket > nombre: product-images > Public: SI
-- ============================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product_images_auth_write"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "product_images_auth_update"
  on storage.objects for update
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "product_images_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');
