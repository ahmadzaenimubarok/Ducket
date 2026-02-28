import React, { useState } from 'react';
import { Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import { groq } from '../lib/groq';

interface AIInsightsProps {
  data: any[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ data }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    try {
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a professional financial analyst AI. Analyze the provided data in Indonesian Rupiah (IDR) and give a concise forecasting insight in Indonesian language. Include potential risks and opportunities. Keep it under 100 words.'
          },
          {
            role: 'user',
            content: `Analyze this revenue data for forecasting: ${JSON.stringify(data)}`
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <BrainCircuit className="gradient-text" size={24} />
        <h3 style={{ margin: 0 }}>AI Forecast Analysis</h3>
      </div>
      
      {!insight && !loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Get deep insights and trend analysis powered by Groq Llama 3.
          </p>
          <button onClick={generateInsight} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
            <Sparkles size={18} />
            Generate Insights
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Loader2 className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
          <p>Analyzing trends...</p>
        </div>
      )}

      {insight && (
        <div className="fade-in">
          <p style={{ lineHeight: '1.6', color: 'var(--text)' }}>{insight}</p>
          <button 
            onClick={() => setInsight(null)} 
            style={{ marginTop: '1.5rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
