
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  transaction_date: string;
  created_at: string;
}

export interface MonthlyData {
  date: string;
  actual: number;
  forecast?: number;
}

export interface Budget {
  id: string;
  amount: number;
  month_year: string;
  category: string;
  user_id: string;
}
