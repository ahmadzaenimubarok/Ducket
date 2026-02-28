# Ducket - Forecasting Project

A premium forecasting dashboard built with **React**, **Vite**, **Supabase**, and **Groq AI**.

## 🚀 Getting Started

1. **Clone the repository** (if applicable)
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up Environment Variables**:
   Create a `.env` file in the root directory (use `.env.example` as a template):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GROQ_API_KEY=your_groq_api_key
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🛠 Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Vanilla CSS (Modern Glassmorphism Design)
- **Database**: Supabase
- **AI**: Groq (Llama 3) for trend analysis and forecasting
- **Charts**: Recharts
- **Icons**: Lucide React

## 📈 Fitur

- **Pemasukan & Pengeluaran**: Catat data keuangan harian dengan mudah.
- **Dynamic Forecasting**: Visualisasi data historis dan prediksi masa depan dalam Rupiah (IDR).
- **AI Insights**: Analisis otomatis tren keuangan menggunakan Groq Llama 3.
- **AI Quick Entry**: Catat transaksi hanya dengan mengetik kalimat natural.
- **Premium UI**: Desain modern dengan glassmorphism dan animasi halus.

## 📝 Supabase Table Setup (Suggested)

Untuk menyimpan transaksi keuangan, disarankan menggunakan skema berikut. Jalankan script ini di SQL Editor Supabase:

```sql
-- Hapus jika sudah ada (urutannya: view dulu baru table)
drop view if exists monthly_revenue;
drop table if exists transactions;

-- 1. Tabel untuk transaksi
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  type text check (type in ('income', 'expense')) not null,
  amount decimal not null,
  description text,
  transaction_date date default now() not null,
  created_at timestamp with time zone default now()
);

-- 2. Query untuk agregasi bulanan (digunakan untuk forecasting)
create view monthly_revenue as
select 
  to_char(transaction_date, 'Mon') as date,
  sum(case when type = 'income' then amount else -amount end) as actual
from transactions
group by to_char(transaction_date, 'Mon'), date_trunc('month', transaction_date)
order by date_trunc('month', transaction_date);
```

## 🌐 Deployment

This project can be deployed as a static site.
1. Run `npm run build`.
2. Upload the `dist` folder to your favorite hosting provider (Netlify, Vercel, etc.).
