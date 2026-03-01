-- DUCKET DATABASE SETUP (Master Clean Install)
-- This script sets up the entire database for Ducket: Transactions, Budgets, RLS Policies, and Views.

-- 1. CLEANUP (Warning: This will drop existing data)
drop view if exists monthly_revenue_user;
drop table if exists budgets;
drop table if exists transactions;

-- 2. TRANSACTIONS TABLE
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  type text check (type in ('income', 'expense')) not null,
  amount decimal not null,
  description text,
  category text not null default 'General',
  transaction_date date default now() not null,
  created_at timestamp with time zone default now()
);

-- 3. BUDGETS TABLE
create table budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  category text not null default 'General',
  amount decimal not null,
  month_year text not null, -- Format: 'YYYY-MM'
  created_at timestamp with time zone default now(),
  unique(user_id, month_year, category)
);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
alter table transactions enable row level security;
alter table budgets enable row level security;

-- 5. ACCESS POLICIES (Privacy Control)
create policy "Users can only manage their own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can only manage their own budgets"
  on budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. DASHBOARD ANALYTICS VIEW
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

-- DONE. Ducket Database is now ready with AI Budgeting & Categorization.
