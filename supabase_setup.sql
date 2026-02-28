-- DUCKET DATABASE SETUP (Full Clean Install)
-- Jalankan script ini di SQL Editor Supabase (https://supabase.com/dashboard/project/_/sql)

-- 1. BERSIHKAN LAMA (Clean Install)
drop view if exists monthly_revenue_user;
drop view if exists monthly_revenue;
drop table if exists transactions;

-- 2. TABEL TRANSAKSI
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(), -- Pemilik data
  type text check (type in ('income', 'expense')) not null,
  amount decimal not null,
  description text,
  transaction_date date default now() not null,
  created_at timestamp with time zone default now()
);

-- 3. KEAMANAN (RLS)
-- Mengaktifkan pengamanan baris agar user tidak bisa mengintip data user lain.
alter table transactions enable row level security;

-- 4. POLICIES (Hak Akses)
-- Memberikan akses penuh kepada pemilik data (CRUD)
create policy "Users can only manage their own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. VIEW GRAFIK (Per User)
-- View ini digunakan untuk menampilkan data histori di halaman dashboard.
-- Menggunakan 'security invoker' agar menghormati RLS tabel transaksi.
create view monthly_revenue_user 
with (security_invoker = on)
as
select 
  user_id,
  to_char(transaction_date, 'Mon') as date,
  sum(case when type = 'income' then amount else -amount end) as actual
from transactions
group by user_id, to_char(transaction_date, 'Mon'), date_trunc('month', transaction_date)
order by date_trunc('month', transaction_date);

-- SELESAI. Dashboard Ducket siap digunakan secara personal!
