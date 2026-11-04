-- GenZTradeSphere MVP schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  description text not null default '',
  price integer not null check (price > 0),
  mrp integer not null default 0,
  moq integer not null default 1 check (moq > 0),
  unit text not null default 'piece',
  image text not null,
  badge text,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  company_name text,
  shipping_address text not null,
  payment_provider text not null default 'razorpay',
  payment_id text not null unique,
  razorpay_order_id text not null,
  total_amount integer not null check (total_amount > 0),
  currency text not null default 'INR',
  payment_status text not null default 'paid',
  order_status text not null default 'confirmed',
  items jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

create policy "Users can read their own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Anyone can view active products" on public.products for select using (is_active = true);
create policy "Admins can manage products" on public.products for all to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "Admins can view orders" on public.orders for select to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
-- Order inserts are performed only by the server using the Supabase service-role key.

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')) on conflict(id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

insert into public.products (id,name,category,description,price,mrp,moq,unit,image,badge,sizes,colors,stock) values
('gst-001','Premium Oversized Cotton T-Shirt','Men','240 GSM heavyweight cotton, relaxed fit, ideal for retail and private labels.',299,599,10,'piece','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=85','BESTSELLER',array['S','M','L','XL','XXL'],array['Black','White','Olive'],480),
('gst-002','Women’s Everyday Co-ord Set','Women','Soft-touch fabric co-ord set with a contemporary silhouette.',649,1299,6,'set','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&q=85','TRENDING',array['S','M','L','XL'],array['Sage','Black','Beige'],160),
('gst-003','Classic Unisex Hoodie','Unisex','Fleece-lined everyday hoodie with durable ribbed cuffs.',549,999,8,'piece','https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&q=85',null,array['S','M','L','XL','XXL'],array['Charcoal','Cream','Navy'],230),
('gst-004','Women’s Ribbed Basic Top','Women','Stretch ribbed knit top designed for everyday collections.',189,399,12,'piece','https://images.unsplash.com/photo-1564257577-6a2b7e3b7f4a?w=900&q=85',null,array['XS','S','M','L','XL'],array['White','Black','Rose'],520),
('gst-005','Relaxed Fit Cargo Trousers','Men','Utility-inspired cargo trousers with multiple functional pockets.',499,999,6,'piece','https://images.unsplash.com/photo-1517438476312-10d79c077509?w=900&q=85',null,array['28','30','32','34','36'],array['Olive','Black','Stone'],140),
('gst-006','Minimal Everyday Tote Bag','Accessories','Reusable canvas tote for lifestyle and fashion retail stores.',119,249,25,'piece','https://images.unsplash.com/photo-1544816155-12df9643f363?w=900&q=85',null,array['One size'],array['Natural','Black'],900)
on conflict (id) do nothing;

-- After creating your own account, promote it to store admin by running:
-- update public.profiles set role='admin' where id=(select id from auth.users where email='YOUR_LOGIN_EMAIL');
