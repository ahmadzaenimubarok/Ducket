import React, { useState } from 'react';
import { Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import { groq } from '../lib/groq';

interface AIInsightsProps {
  data: any;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ data }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    try {
      const { budgets, history } = data;
      const budgetContext = budgets && budgets.length > 0
        ? `Current Monthly Budgets: ${budgets.map((b: any) => `${b.category}: IDR ${b.amount}`).join(', ')}.` 
        : "No budgets set for this month.";

      const response = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a professional financial analyst AI. 
            Analyze the provided transaction history and budget context. 
            Indonesian Rupiah (IDR) is used. 
            If the user is over budget or close to it (80%+), give a warning and tips to save.
            Provide analysis in English. Keep it under 100 words.`
          },
          {
            role: 'user',
            content: `${budgetContext} Transaction history: ${JSON.stringify(history)}`
          }
        ],
        model: 'llama-3.3-70b-versatile',
      });

      setInsight(response.choices[0]?.message?.content || 'No insights generated.');
    } catch (error) {
      console.error('Error fetching Groq insights:', error);
      setInsight('Failed to generate insights. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel">
      <div className="flex items-center gap-1 mb-2">
        <BrainCircuit className="text-primary" size={24} />
        <h3 style={{ fontSize: '1.1rem' }}>AI Forecast Analysis</h3>
      </div>
      
      {!insight && !loading && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
            Get deep insights and trend analysis powered by Groq Llama 3.
          </p>
          <button onClick={generateInsight} className="mt-1" style={{ margin: '0 auto' }}>
            <Sparkles size={18} />
            Generate Insights
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <Loader2 className="animate-spin mb-1" style={{ margin: '0 auto' }} />
          <p style={{ fontSize: '0.9rem' }}>Analyzing trends...</p>
        </div>
      )}

      {insight && (
        <div className="fade-in">
          <p style={{ lineHeight: '1.6', color: 'var(--text)', fontSize: '0.95rem' }}>{insight}</p>
          <button 
            onClick={() => setInsight(null)} 
            className="mt-2"
            style={{ 
              background: 'transparent', 
              border: '1px solid var(--border)', 
              color: 'var(--text-muted)',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              width: 'auto'
            }}
          >
            Clear Analysis
          </button>
        </div>
      )}
    </div>
  );
};
