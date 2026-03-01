import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { BrainCircuit, Loader2, Sparkles } from 'lucide-react';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('demo@email.com');
  const [password, setPassword] = useState('password');
  const [isRegister, setIsRegister] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for verification!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background)',
      padding: '1rem'
    }}>
      <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <BrainCircuit className="gradient-text" size={48} style={{ margin: '0 auto 1rem auto' }} />
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Ducket</h1>
          <p className="text-muted">Sign in to manage your smart finance</p>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ textAlign: 'left' }}>
            <label className="mb-1 block" style={{ fontSize: '0.875rem' }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>
          <div style={{ textAlign: 'left' }}>
            <label className="mb-1 block" style={{ fontSize: '0.875rem' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-muted mt-2" style={{ fontSize: '0.875rem' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              color: 'var(--primary)',
              textDecoration: 'underline',
              fontSize: 'inherit',
              cursor: 'pointer',
              width: 'auto',
              display: 'inline'
            }}
          >
            {isRegister ? 'Sign In' : 'Register Now'}
          </button>
        </p>
      </div>
    </div>
  );
};
