/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { InventoryList } from './components/InventoryList';
import { LoansList } from './components/LoansList';
import { RepairsList } from './components/RepairsList';
import { Reports } from './components/Reports';
import { UsersList } from './components/UsersList';
import { Login } from './components/Login';
import { LandingPage } from './components/LandingPage';
import { Monitor } from 'lucide-react';
import { ToastProvider } from './components/Toast';

function AppContent() {
  const [currentView, setCurrentView] = useState<'landing' | 'admin'>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'loans' | 'repairs' | 'reports' | 'users'>('dashboard');
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; isFallback: boolean; type: string } | null>(null);

  React.useEffect(() => {
    const fetchDbStatus = async () => {
      try {
        const res = await fetch('/api/db-status');
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setDbStatus(data);
        }
      } catch (err) {
        console.error("Failed to fetch database status:", err);
      }
    };
    fetchDbStatus();
    const interval = setInterval(fetchDbStatus, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (currentView === 'landing') {
    return <LandingPage onAdminClick={() => setCurrentView('admin')} />;
  }

  if (!isAuthenticated) {
    return (
      <div className="relative">
        <button 
          onClick={() => setCurrentView('landing')}
          className="absolute top-4 left-4 z-10 rounded-md bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          &larr; Kembali ke Portal
        </button>
        <Login onLogin={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col aurora-bg font-sans text-white overflow-hidden print:h-auto print:bg-white">
      {/* Top Navigation Bar */}
      <header className="flex h-16 w-full shrink-0 items-center justify-between glass-header px-8 z-10 print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-pink-500 to-violet-600 p-2 rounded-lg text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]">
            <Monitor className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white uppercase neon-text">SMKN 46 JAKARTA <span className="text-xs font-normal text-white/60 ml-2">Manajemen Inventaris</span></h1>
        </div>
        <nav className="flex gap-8 text-sm font-medium text-white/60">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={activeTab === 'dashboard' ? "text-pink-400 neon-text" : "hover:text-white transition-colors"}
          >
            Dasbor
          </button>
          <button 
            onClick={() => setActiveTab('inventory')} 
            className={activeTab === 'inventory' ? "text-pink-400 neon-text" : "hover:text-white transition-colors"}
          >
            Inventaris
          </button>
          <button 
            onClick={() => setActiveTab('loans')} 
            className={activeTab === 'loans' ? "text-pink-400 neon-text" : "hover:text-white transition-colors"}
          >
            Peminjaman
          </button>
          <button 
            onClick={() => setActiveTab('repairs')} 
            className={activeTab === 'repairs' ? "text-pink-400 neon-text" : "hover:text-white transition-colors"}
          >
            Perbaikan
          </button>
          <button 
            onClick={() => setActiveTab('reports')} 
            className={activeTab === 'reports' ? "text-pink-400 neon-text" : "hover:text-white transition-colors"}
          >
            Laporan
          </button>
        </nav>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-white/90">Admin Sistem</span>
            <span className="text-[10px] text-green-400 flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)]"></span> Backend Aktif
            </span>
          </div>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setCurrentView('landing');
            }}
            className="flex items-center justify-center gap-2 h-9 px-4 rounded-md glass-button text-xs font-semibold text-pink-400 hover:text-pink-300 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden print:overflow-visible">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-auto print:overflow-visible">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'inventory' && <InventoryList />}
          {activeTab === 'loans' && <LoansList />}
          {activeTab === 'repairs' && <RepairsList />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'users' && <UsersList />}
        </main>
      </div>

      {/* Status Footer Bar */}
      <footer className="h-8 w-full shrink-0 glass-header flex items-center px-8 justify-between text-[10px] text-white/50 uppercase tracking-widest font-bold z-10 print:hidden">
        <div className="flex gap-6 items-center">
          <span>Sesi: <span className="text-white/80 font-bold">Aktif</span></span>
          <span className="flex items-center gap-1.5">
            Database: {dbStatus?.connected ? (
              <span className="text-green-400 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)] animate-pulse"></span>
                NEON POSTGRESQL TERHUBUNG
              </span>
            ) : dbStatus?.isFallback ? (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)]"></span>
                LOCAL FALLBACK (MEMORI)
              </span>
            ) : (
              <span className="text-red-500 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse"></span>
                DATABASE ERROR
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {dbStatus?.type && <span className="text-white/40 lowercase normal-case font-normal italic">({dbStatus.type})</span>}
          <span>Status Server: <span className="text-pink-400 font-bold">Online</span></span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

