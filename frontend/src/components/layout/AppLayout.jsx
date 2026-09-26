import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout({ userRole, onLogout }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentView = location.pathname.substring(1).replace(/\//g, '-') || 'dashboard';
  const isAIAssistant = location.pathname === '/ai-assistant';

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell font-sans bg-slate-50 text-slate-900">
      <Sidebar 
        userRole={userRole} 
        onLogout={onLogout} 
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="app-main">
        <Header
          title={currentView}
          userRole={userRole}
          currentView={currentView}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        />

        <main className={`page-content bg-slate-50 ${isAIAssistant ? 'p-0 overflow-hidden' : 'p-3 sm:p-4 md:p-6'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
