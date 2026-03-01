import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { ForecastingChart } from './components/ForecastingChart'
import { AIInsights } from './components/AIInsights'
import { Auth } from './components/Auth'
import { TrendingUp, DollarSign, Activity, Loader2, BrainCircuit, Sparkles, Pencil, Trash2, X, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { groq } from './lib/groq'
import { supabase } from './lib/supabase'
import type { Transaction, MonthlyData } from './types'
import type { User } from '@supabase/supabase-js'
import './App.css'

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isStatsVisible, setIsStatsVisible] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [currentMonthStats, setCurrentMonthStats] = useState({ income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // AI Entry State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  // AI Edit State
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [aiEditPrompt, setAiEditPrompt] = useState('');
  const [isAiEditing, setIsAiEditing] = useState(false);

  // Form State
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, currentPage]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (!countError) setTotalCount(count || 0);

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (transError) throw transError;
      setTransactions(transData || []);

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: currentStats, error: statsError } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id)
        .gte('transaction_date', firstDay)
        .lte('transaction_date', lastDay);

      if (!statsError && currentStats) {
        const stats = currentStats.reduce((acc, curr) => {
          if (curr.type === 'income') acc.income += Number(curr.amount);
          else acc.expense += Number(curr.amount);
          return acc;
        }, { income: 0, expense: 0 });
        setCurrentMonthStats(stats);
      }

      const { data: mData, error: mError } = await supabase
        .from('monthly_revenue_user')
        .select('*');

      if (!mError && mData) {
        setMonthlyData(mData);
      } else {
        setMonthlyData([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !description) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('transactions')
        .insert([
          { 
            type, 
            amount: parseFloat(amount), 
            description,
            user_id: user.id,
            transaction_date: new Date().toISOString().split('T')[0]
          }
        ]);

      if (error) throw error;
      setAmount('');
      setDescription('');
      setIsManualEntryOpen(false); // Close modal after success
      fetchData();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiQuickEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !aiPrompt.trim()) return;

    try {
      setIsAiProcessing(true);
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Extract financial details from the prompt. 
            RULES:
            1. Return JSON: {"type": "income" | "expense", "amount": number, "description": string}.
            2. "amount" MUST be a positive number. If not found, return 0.
            3. "description" should be concise. If not found, return empty string.
            4. If the prompt is not a financial transaction, return all fields as null/0.`
          },
          { role: 'user', content: aiPrompt }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      // FALLBACK VALIDATION
      if (!result.amount || result.amount <= 0 || !result.description) {
        alert('❌ AI failed to extract valid data. Please include a specific amount (e.g., "50k") and a clear description.');
        return;
      }

      const { error } = await supabase.from('transactions').insert([{ 
        ...result, 
        user_id: user.id, 
        transaction_date: new Date().toISOString().split('T')[0] 
      }]);

      if (error) throw error;
      
      setAiPrompt('');
      fetchData();
    } catch (error) {
      console.error('AI Processing Error:', error);
      alert('AI error occurred. Please try again with simple text like "Lunch 20k".');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAiEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingTransaction || !aiEditPrompt.trim()) return;

    try {
      setIsAiEditing(true);
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Update transaction. Current: ${JSON.stringify(editingTransaction)}. Prompt: "${aiEditPrompt}". Return JSON: {"type": string, "amount": number, "description": string}.`
          },
          { role: 'user', content: aiEditPrompt }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });

      const updatedData = JSON.parse(response.choices[0]?.message?.content || '{}');
      await supabase.from('transactions').update(updatedData).eq('id', editingTransaction.id).eq('user_id', user.id);
      setEditingTransaction(null);
      setAiEditPrompt('');
      fetchData();
    } catch (error) {
      console.error('AI Edit Error:', error);
    } finally {
      setIsAiEditing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this transaction?')) return;
    await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
    fetchData();
  };

  const totalBalance = monthlyData.reduce((acc, curr) => acc + (curr.actual || 0), 0);

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout userEmail={user.email}>
      <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
        <h2 style={{ fontSize: '1.25rem' }}>Dashboard Overview</h2>
        <button 
          onClick={() => setIsStatsVisible(!isStatsVisible)}
          style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            border: '1px solid var(--border)', 
            padding: '0.4rem 0.8rem', 
            fontSize: '0.85rem',
            width: 'auto'
          }}
        >
          {isStatsVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          {isStatsVisible ? 'Hide Values' : 'Show Values'}
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Stats Section */}
        <div className="glass-panel flex items-center gap-2">
          <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', flexShrink: 0 }}>
            <DollarSign size={24} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Total Balance</p>
            <h3 style={{ fontSize: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {loading ? '...' : (isStatsVisible ? formatIDR(totalBalance) : 'IDR ••••••')}
            </h3>
          </div>
        </div>

        <div className="glass-panel flex items-center gap-2">
          <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', flexShrink: 0 }}>
            <TrendingUp size={24} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Income (Month)</p>
            <h3 className="text-success" style={{ fontSize: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {loading ? '...' : (isStatsVisible ? formatIDR(currentMonthStats.income) : 'IDR ••••••')}
            </h3>
          </div>
        </div>

        <div className="glass-panel flex items-center gap-2">
          <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(236, 72, 153, 0.1)', color: 'var(--secondary)', flexShrink: 0 }}>
            <TrendingUp size={24} style={{ transform: 'rotate(180deg)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Expenses (Month)</p>
            <h3 className="text-secondary" style={{ fontSize: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {loading ? '...' : (isStatsVisible ? formatIDR(currentMonthStats.expense) : 'IDR ••••••')}
            </h3>
          </div>
        </div>

        <div className="glass-panel flex items-center gap-2">
          <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text)', flexShrink: 0 }}>
            <Activity size={24} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Live Status</p>
            <h3 style={{ fontSize: '1.25rem' }}>{loading ? 'Syncing' : 'Live'}</h3>
          </div>
        </div>

        {/* AI Quick Entry */}
        <div className="full-width">
          <div className="glass-panel" style={{ border: '2px dashed var(--primary)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BrainCircuit className="text-primary" size={24} />
                <h3 style={{ fontSize: '1.1rem' }}>AI Smart Input</h3>
              </div>
              <button 
                onClick={() => setIsManualEntryOpen(true)}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid var(--border)', 
                  padding: '0.4rem 0.8rem', 
                  fontSize: '0.75rem',
                  width: 'auto'
                }}
              >
                + Manual Entry
              </button>
            </div>
            <form onSubmit={handleAiQuickEntry} className="flex flex-col gap-2 w-full" style={{ width: '100%' }}>
              <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Example: 'Lunch 35k' or 'Salary 5m'..."
                style={{ minHeight: '100px', width: '100%', resize: 'vertical' }}
              />
              <button 
                type="submit" 
                disabled={isAiProcessing} 
                className="w-full" 
                style={{ width: '100%' }}
              >
                {isAiProcessing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />} 
                AI Entry
              </button>
            </form>
          </div>
        </div>

        {/* Charts Section */}
        <div className="full-width">
          {loading ? (
            <div className="glass-panel" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 className="animate-spin" size={40} />
            </div>
          ) : (
            <ForecastingChart data={monthlyData} title="Financial Overview" />
          )}
        </div>

        {/* Features Split */}
        <div className="full-width" style={{ minWidth: 0 }}>
          <AIInsights data={monthlyData} />
        </div>

        {/* History Section */}
        <div className="full-width">
          <div className="glass-panel">
            <h3 className="mb-2">Recent Transactions</h3>
            
            <div className="transaction-list mt-2">
              {transactions.map((t) => (
                <div key={t.id} className="transaction-card fade-in">
                  <div className="flex items-center" style={{ flex: 1, minWidth: 0 }}>
                    <div className="transaction-icon" style={{ 
                      background: t.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(236, 72, 153, 0.1)',
                      color: t.type === 'income' ? 'var(--success)' : 'var(--secondary)'
                    }}>
                      {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingUp size={20} style={{ transform: 'rotate(180deg)' }} />}
                    </div>
                    
                    <div className="transaction-info">
                      <div className="transaction-desc">{t.description}</div>
                      <div className="transaction-date">{new Date(t.transaction_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>

                  <div className="transaction-amount-actions">
                    <div className="transaction-amount" style={{ color: t.type === 'income' ? 'var(--success)' : 'var(--secondary)' }}>
                      {t.type === 'income' ? '+' : '-'} {formatIDR(t.amount)}
                    </div>
                    <div className="transaction-actions">
                      <button onClick={() => setEditingTransaction(t)} style={{ padding: '0.4rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', width: 'auto', borderRadius: '0.4rem' }}>
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} style={{ padding: '0.4rem', background: 'rgba(236, 72, 153, 0.1)', color: 'var(--secondary)', width: 'auto', borderRadius: '0.4rem' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {transactions.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No transactions yet. Start by adding one above!
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalCount > itemsPerPage && (
              <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                  Page {currentPage} of {Math.ceil(totalCount / itemsPerPage)}
                </p>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', width: 'auto' }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / itemsPerPage), p + 1))}
                    disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                    style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', width: 'auto' }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {isManualEntryOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '400px', border: '1px solid var(--primary)' }}>
            <div className="flex justify-between mb-2">
              <h3 className="gradient-text">Manual Entry</h3>
              <button 
                onClick={() => setIsManualEntryOpen(false)} 
                style={{ background: 'transparent', width: 'auto', padding: '0.25rem' }}
              >
                <X size={20} className="text-muted" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
              <div className="flex flex-col gap-1">
                <label className="text-muted" style={{ fontSize: '0.85rem' }}>Transaction Type</label>
                <select value={type} onChange={(e) => setType(e.target.value as 'income' | 'expense')}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-muted" style={{ fontSize: '0.85rem' }}>Amount (IDR)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100000" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-muted" style={{ fontSize: '0.85rem' }}>Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Salary, Rent, Food..." required />
              </div>
              <button type="submit" disabled={submitting} className="w-full mt-2">
                {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Save Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Edit Modal */}
      {editingTransaction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '400px', border: '1px solid var(--primary)' }}>
            <div className="flex justify-between mb-2">
              <h3 className="gradient-text">Edit via AI</h3>
              <button 
                onClick={() => setEditingTransaction(null)} 
                style={{ background: 'transparent', width: 'auto', padding: '0.25rem' }}
              >
                <X size={20} className="text-muted" />
              </button>
            </div>
            <textarea 
              value={aiEditPrompt} 
              onChange={(e) => setAiEditPrompt(e.target.value)} 
              placeholder="Example: 'Change amount to 50k'..." 
              style={{ minHeight: '120px' }}
            />
            <button onClick={handleAiEdit} disabled={isAiEditing} className="w-full mt-2">
              {isAiEditing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              Update via AI
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default App
