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

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'admin'>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'loans' | 'repairs' | 'reports' | 'users'>('dashboard');
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; isFallback: boolean; type: string } | null>(null);

  React.useEffect(() => {
    const fetchDbStatus = async () => {
      try {
        const res = await fetch('/api/db-status');
        if (res.ok) {
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
    <div className="flex h-screen w-full flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden print:h-auto print:bg-white">
      {/* Top Navigation Bar */}
      <header className="flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 z-10 print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Monitor className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 uppercase">SMKN 46 JAKARTA <span className="text-xs font-normal text-slate-400 ml-2">Manajemen Inventaris</span></h1>
        </div>
        <nav className="flex gap-8 text-sm font-medium text-slate-500">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={activeTab === 'dashboard' ? "text-blue-600" : "hover:text-slate-900"}
          >
            Dasbor
          </button>
          <button 
            onClick={() => setActiveTab('inventory')} 
            className={activeTab === 'inventory' ? "text-blue-600" : "hover:text-slate-900"}
          >
            Inventaris
          </button>
          <button 
            onClick={() => setActiveTab('loans')} 
            className={activeTab === 'loans' ? "text-blue-600" : "hover:text-slate-900"}
          >
            Peminjaman
          </button>
          <button 
            onClick={() => setActiveTab('repairs')} 
            className={activeTab === 'repairs' ? "text-blue-600" : "hover:text-slate-900"}
          >
            Perbaikan
          </button>
          <button 
            onClick={() => setActiveTab('reports')} 
            className={activeTab === 'reports' ? "text-blue-600" : "hover:text-slate-900"}
          >
            Laporan
          </button>
        </nav>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold">Admin Sistem</span>
            <span className="text-[10px] text-green-500 flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-green-500"></span> Backend Aktif
            </span>
          </div>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setCurrentView('landing');
            }}
            className="flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-slate-200 bg-white text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors"
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
      <footer className="h-8 w-full shrink-0 bg-white border-t border-slate-200 flex items-center px-8 justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold z-10 print:hidden">
        <div className="flex gap-6 items-center">
          <span>Sesi: <span className="text-slate-600 font-bold">Aktif</span></span>
          <span className="flex items-center gap-1.5">
            Database: {dbStatus?.connected ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                NEON POSTGRESQL TERHUBUNG
              </span>
            ) : (
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                LOCAL FALLBACK (MEMORI)
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {dbStatus?.type && <span className="text-slate-500 lowercase normal-case font-normal italic">({dbStatus.type})</span>}
          <span>Status Server: <span className="text-blue-600 font-bold">Online</span></span>
        </div>
      </footer>
    </div>
  );
}

