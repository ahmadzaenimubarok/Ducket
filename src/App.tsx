import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { ForecastingChart } from './components/ForecastingChart'
import { AIInsights } from './components/AIInsights'
import { TrendingUp, DollarSign, Activity, Loader2, BrainCircuit, Sparkles, Pencil, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { groq } from './lib/groq'
import { supabase } from './lib/supabase'
import type { Transaction, MonthlyData } from './types'
import './App.css'

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

function App() {
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
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });
      
      if (!countError) setTotalCount(count || 0);

      // Fetch paginated transactions
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .range(from, to);

      if (transError) throw transError;
      setTransactions(transData || []);

      // Calculate monthly stats (Income vs Expense for current month)
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: currentStats, error: statsError } = await supabase
        .from('transactions')
        .select('type, amount')
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
        .from('monthly_revenue')
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
    if (!amount || !description) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('transactions')
        .insert([
          { 
            type, 
            amount: parseFloat(amount), 
            description,
            transaction_date: new Date().toISOString().split('T')[0]
          }
        ]);

      if (error) throw error;
      setAmount('');
      setDescription('');
      fetchData();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Gagal menyimpan transaksi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiQuickEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    try {
      setIsAiProcessing(true);
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a financial transaction extractor. Extract details and return ONLY a JSON object: {"type": "income" | "expense", "amount": number, "description": string}.`
          },
          { role: 'user', content: aiPrompt }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      if (result.error) {
        alert("AI tidak dapat mengenali rincian tersebut.");
        return;
      }

      await supabase.from('transactions').insert([{ ...result, transaction_date: new Date().toISOString().split('T')[0] }]);
      setAiPrompt('');
      fetchData();
    } catch (error) {
      console.error('AI Processing Error:', error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAiEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction || !aiEditPrompt.trim()) return;

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
      await supabase.from('transactions').update(updatedData).eq('id', editingTransaction.id);
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
    if (!confirm('Hapus transaksi ini?')) return;
    await supabase.from('transactions').delete().eq('id', id);
    fetchData();
  };

  const totalBalance = monthlyData.reduce((acc, curr) => acc + (curr.actual || 0), 0);

  return (
    <Layout>
      <div className="dashboard-grid">
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Saldo</p>
            <h3 style={{ fontSize: '1.5rem' }}>{loading ? '...' : formatIDR(totalBalance)}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pemasukan (Bulan Ini)</p>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{loading ? '...' : formatIDR(currentMonthStats.income)}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(236, 72, 153, 0.1)', color: 'var(--secondary)' }}>
            <TrendingUp size={24} style={{ transform: 'rotate(180deg)' }} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pengeluaran (Bulan Ini)</p>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--secondary)' }}>{loading ? '...' : formatIDR(currentMonthStats.expense)}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text)' }}>
            <Activity size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Status Sync</p>
            <h3 style={{ fontSize: '1.5rem' }}>{loading ? 'Syncing...' : 'Live'}</h3>
          </div>
        </div>

        <div className="full-width">
          <div className="glass-panel" style={{ border: '2px dashed var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <BrainCircuit className="gradient-text" size={28} />
              <h3 style={{ margin: 0 }}>AI Quick Entry (Input Cerdas)</h3>
            </div>
            <form onSubmit={handleAiQuickEntry} style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Contoh: 'Tadi makan siang habis 35 ribu'..."
                style={{ flex: 1, background: '#0f172a', border: '1px solid var(--border)', padding: '1rem', borderRadius: '0.6rem', color: 'white' }}
              />
              <button type="submit" disabled={isAiProcessing} style={{ minWidth: '180px' }}>
                {isAiProcessing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />} Catat AI
              </button>
            </form>
          </div>
        </div>

        <div className="full-width">
          {loading ? (
            <div className="glass-panel" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 className="animate-spin" size={40} />
            </div>
          ) : (
            <ForecastingChart data={monthlyData} title="Analisis Pemasukan & Pengeluaran" />
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', gridColumn: '1 / -1' }}>
          <AIInsights data={monthlyData} />
          <div className="glass-panel">
            <h3>Catat Manual</h3>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }} onSubmit={handleSubmit}>
              <select value={type} onChange={(e) => setType(e.target.value as 'income' | 'expense')} style={{ width: '100%', background: '#0f172a', border: '1px solid var(--border)', padding: '0.5rem', color: 'white' }}>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Nominal" required style={{ width: '100%', background: '#0f172a', border: '1px solid var(--border)', padding: '0.5rem', color: 'white' }} />
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Keterangan" required style={{ width: '100%', background: '#0f172a', border: '1px solid var(--border)', padding: '0.5rem', color: 'white' }} />
              <button type="submit" disabled={submitting}>{submitting ? '...' : 'Simpan'}</button>
            </form>
          </div>
        </div>

        <div className="full-width">
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem' }}>Mutasi Keuangan</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '1rem' }}>Tanggal</th>
                    <th style={{ padding: '1rem' }}>Keterangan</th>
                    <th style={{ padding: '1rem' }}>Nominal</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem' }}>{new Date(t.transaction_date).toLocaleDateString('id-ID')}</td>
                      <td style={{ padding: '1rem' }}>{t.description}</td>
                      <td style={{ padding: '1rem', color: t.type === 'income' ? 'var(--success)' : 'var(--secondary)' }}>
                        {t.type === 'income' ? '+' : '-'} {formatIDR(t.amount)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => setEditingTransaction(t)} style={{ padding: '0.4rem', background: '#312e81' }}><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(t.id)} style={{ padding: '0.4rem', background: '#7f1d1d' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalCount > itemsPerPage && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '0 1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Menampilkan {Math.min(totalCount, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(totalCount, currentPage * itemsPerPage)} dari {totalCount} transaksi
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
                    {currentPage} / {Math.ceil(totalCount / itemsPerPage)}
                  </div>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / itemsPerPage), p + 1))}
                    disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                    style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingTransaction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', border: '1px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 className="gradient-text">Edit via AI</h3>
              <X onClick={() => setEditingTransaction(null)} style={{ cursor: 'pointer' }} />
            </div>
            <textarea 
              value={aiEditPrompt} 
              onChange={(e) => setAiEditPrompt(e.target.value)} 
              placeholder="Contoh: 'Ubah nominalnya jadi 100 ribu'..." 
              style={{ width: '100%', background: '#0f172a', border: '1px solid var(--border)', padding: '1rem', color: 'white', minHeight: '100px' }}
            />
            <button onClick={handleAiEdit} disabled={isAiEditing} style={{ width: '100%', marginTop: '1rem' }}>
              {isAiEditing ? 'Proses...' : 'Update via AI'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default App
