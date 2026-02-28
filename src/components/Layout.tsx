import React from 'react';
import { TrendingUp, Database } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app-container">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem' }}>Ducket</h1>
          <p style={{ color: 'var(--text-muted)' }}>Next-gen data forecasting powered by Groq & Supabase</p>
        </div>
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <TrendingUp size={20} />
            <span>Forecasting</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <Database size={20} />
            <span>Supabase</span>
          </div>
        </nav>
      </header>
      <main>{children}</main>
      <footer style={{ marginTop: '5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <p>&copy; {new Date().getFullYear()} Ducket. All rights reserved.</p>
      </footer>
    </div>
  );
};
