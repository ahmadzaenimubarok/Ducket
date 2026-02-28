
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  transaction_date: string;
  created_at: string;
}

export interface MonthlyData {
  date: string;
  actual: number;
  forecast?: number;
}
