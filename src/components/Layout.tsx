import { TrendingUp, Database, LogOut, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  userEmail?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, userEmail }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  return (
    <div className="app-container">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem' }}>Ducket</h1>
          <p style={{ color: 'var(--text-muted)' }}>Next-gen data forecasting powered by Groq & Supabase</p>
        </div>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <TrendingUp size={20} />
            <span>Forecasting</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <Database size={20} />
            <span>Supabase</span>
          </div>
          {userEmail && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <User size={16} />
                <span>{userEmail}</span>
              </div>
              <button 
                onClick={handleLogout}
                style={{ 
                  background: 'rgba(236, 72, 153, 0.1)', 
                  color: 'var(--secondary)', 
                  padding: '0.4rem 0.8rem', 
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  border: '1px solid var(--secondary)',
                  borderRadius: '0.4rem'
                }}
              >
                <LogOut size={14} />
                Keluar
              </button>
            </div>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <footer style={{ marginTop: '5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <p>&copy; {new Date().getFullYear()} Ducket. All rights reserved.</p>
      </footer>
    </div>
  );
};
