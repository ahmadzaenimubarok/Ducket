# 🦆 Ducket - AI Smart Finance Tracker

A premium forecasting dashboard built with **React**, **Vite**, **Supabase**, and **Groq AI**.

## 🚀 Memulai (Getting Started)

1. **Install dependensi**:
   ```bash
   npm install
   ```
2. **Set up Environment Variables**:
   Buat file `.env` di root dan isi dengan API Key kamu (lihat `.env.example`):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GROQ_API_KEY=your_groq_api_key
   ```
3. **Database Setup**:
   Jalankan file `supabase_setup.sql` di SQL Editor Supabase kamu. (Lihat bagian Database Setup di bawah).
4. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```

## 🔐 Database Setup (PENTING)

Agar aplikasi **Ducket** berjalan dengan fitur multi-user yang aman, kamu **WAJIB** menjalankan script SQL di bawah ini di **Supabase SQL Editor** (ini akan menghapus tabel lama jika ada, jadi pastikan setup baru):

```sql
-- DUCKET DATABASE SETUP (Full Clean Install)
-- Jalankan script ini di SQL Editor Supabase

drop view if exists monthly_revenue_user;
drop view if exists monthly_revenue;
drop table if exists transactions;

-- 1. Tabel Utama (Isolated per User)
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  type text check (type in ('income', 'expense')) not null,
  amount decimal not null,
  description text,
  transaction_date date default now() not null,
  created_at timestamp with time zone default now()
);

-- 2. Aktifkan RLS (Row Level Security)
alter table transactions enable row level security;

-- 3. Policy Keamanan (User hanya akses miliknya)
create policy "Users can manage their own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. View Dashboard Grafik (Security Invoker)
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
```

## 🎯 Fitur Unggulan
- **🤖 AI Quick Entry**: Catat pengeluaran hanya dengan mengetik kalimat bahasa manusia (Beli kopi 20rb).
- **📝 AI Editor**: Ubah data transaksi kamu hanya dengan ngobrol ke AI di fitur mutasi.
- **🔐 Multi-User Auth**: Login aman & data terpisah untuk setiap pengguna.
- **📈 Forecasting Charts**: Prediksi keuangan berdasarkan pola historis.
- **📱 Premium Design**: Antarmuka *glassmorphism* yang mewah dan responsif.

## 🌐 Deployment
1. Jalankan `npm run build`.
2. Upload folder `dist` ke Vercel, Netlify, atau Cloudflare Pages.
