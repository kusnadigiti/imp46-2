import React from 'react';
import clsx from 'clsx';

interface SidebarProps {
  activeTab: 'dashboard' | 'inventory' | 'loans' | 'repairs' | 'reports' | 'users';
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'loans' | 'repairs' | 'reports' | 'users') => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside className="w-64 shrink-0 glass-header border-r-0 p-6 overflow-y-auto hidden md:block print:hidden shadow-[4px_0_24px_rgba(0,0,0,0.1)] relative z-20">
      <div className="mb-8">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-white/50">Menu Utama</h2>
        <ul className="mt-4 space-y-3">
          <li>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={clsx(
                "flex w-full items-center gap-3 text-sm transition-colors",
                activeTab === 'dashboard' ? "font-medium text-pink-400 neon-text" : "text-white/60 hover:text-white"
              )}
            >
              <div className={clsx("h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]", activeTab === 'dashboard' ? "bg-pink-400" : "bg-transparent")}></div>
              Dasbor Ringkasan
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('inventory')}
              className={clsx(
                "flex w-full items-center gap-3 text-sm transition-colors",
                activeTab === 'inventory' ? "font-medium text-pink-400 neon-text" : "text-white/60 hover:text-white"
              )}
            >
              <div className={clsx("h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]", activeTab === 'inventory' ? "bg-pink-400" : "bg-transparent")}></div>
              Katalog Barang
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('loans')}
              className={clsx(
                "flex w-full items-center gap-3 text-sm transition-colors",
                activeTab === 'loans' ? "font-medium text-pink-400 neon-text" : "text-white/60 hover:text-white"
              )}
            >
              <div className={clsx("h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]", activeTab === 'loans' ? "bg-pink-400" : "bg-transparent")}></div>
              Sistem Peminjaman
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('repairs')}
              className={clsx(
                "flex w-full items-center gap-3 text-sm transition-colors",
                activeTab === 'repairs' ? "font-medium text-pink-400 neon-text" : "text-white/60 hover:text-white"
              )}
            >
              <div className={clsx("h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]", activeTab === 'repairs' ? "bg-pink-400" : "bg-transparent")}></div>
              Status Perbaikan
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('reports')}
              className={clsx(
                "flex w-full items-center gap-3 text-sm transition-colors",
                activeTab === 'reports' ? "font-medium text-pink-400 neon-text" : "text-white/60 hover:text-white"
              )}
            >
              <div className={clsx("h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]", activeTab === 'reports' ? "bg-pink-400" : "bg-transparent")}></div>
              Laporan Sistem
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('users')}
              className={clsx(
                "flex w-full items-center gap-3 text-sm transition-colors",
                activeTab === 'users' ? "font-medium text-pink-400 neon-text" : "text-white/60 hover:text-white"
              )}
            >
              <div className={clsx("h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]", activeTab === 'users' ? "bg-pink-400" : "bg-transparent")}></div>
              Manajemen Pengguna
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}
