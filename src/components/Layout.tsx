import React from 'react';
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
    <div className="app-container" style={{ overflowX: 'hidden' }}>
      <header className="app-header">
        <div style={{ maxWidth: '100%' }}>
          <h1 className="gradient-text" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', wordBreak: 'break-all' }}>Ducket</h1>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>Next-gen data forecasting powered by Groq & Supabase</p>
        </div>
        
        <nav className="app-nav" style={{ maxWidth: '100%' }}>
          <div className="flex items-center gap-1 text-muted">
            <TrendingUp size={20} />
            <span style={{ fontSize: '0.875rem' }}>Forecasting</span>
          </div>
          <div className="flex items-center gap-1 text-muted">
            <Database size={20} />
            <span style={{ fontSize: '0.875rem' }}>Supabase</span>
          </div>

          {userEmail && (
            <div className="user-badge" style={{ gap: '0.5rem' }}>
              <div className="flex items-center gap-1 text-muted" style={{ fontSize: '0.875rem' }}>
                <User size={16} />
                <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userEmail}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                style={{ 
                  background: 'rgba(236, 72, 153, 0.1)', 
                  color: 'var(--secondary)', 
                  padding: '0.4rem 0.6rem', 
                  fontSize: '0.75rem',
                  border: '1px solid var(--secondary)',
                  borderRadius: '0.4rem',
                  width: 'auto'
                }}
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </nav>
      </header>
      
      <main style={{ maxWidth: '100%' }}>{children}</main>
      
      <footer style={{ marginTop: '5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', paddingBottom: '2rem' }}>
        <p>&copy; {new Date().getFullYear()} Ducket. All rights reserved.</p>
      </footer>
    </div>
  );
};
