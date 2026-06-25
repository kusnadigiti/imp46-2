import React from 'react';
import clsx from 'clsx';

interface SidebarProps {
  activeTab: 'dashboard' | 'inventory' | 'loans' | 'repairs' | 'reports' | 'users';
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'loans' | 'repairs' | 'reports' | 'users') => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-6 overflow-y-auto hidden md:block print:hidden">
      <div className="mb-8">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Menu Utama</h2>
        <ul className="mt-4 space-y-3">
          <li>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={clsx(
                "flex w-full items-center gap-3 text-sm transition-colors",
                activeTab === 'dashboard' ? "font-medium text-blue-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <div className={clsx("h-2 w-2 rounded-full", activeTab === 'dashboard' ? "bg-blue-600" : "bg-transparent")}></div>
              Dasbor Ringkasan
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('inventory')}
              className={clsx(
                "flex w-full items-center gap-3 text-sm transition-colors",
                activeTab === 'inventory' ? "font-medium text-blue-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <div className={clsx("h-2 w-2 rounded-full", activeTab === 'inventory' ? "bg-blue-600" : "bg-transparent")}></div>
              Katalog Barang
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('loans')}
              className={clsx(
                "flex w-full items-center gap-3 text-sm transition-colors",
                activeTab === 'loans' ? "font-medium text-blue-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <div className={clsx("h-2 w-2 rounded-full", activeTab === 'loans' ? "bg-blue-600" : "bg-transparent")}></div>
              Sistem Peminjaman
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('repairs')}
              className={clsx(
                "flex w-full items-center gap-3 text-sm transition-colors",
                activeTab === 'repairs' ? "font-medium text-blue-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <div className={clsx("h-2 w-2 rounded-full", activeTab === 'repairs' ? "bg-blue-600" : "bg-transparent")}></div>
              Status Perbaikan
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('reports')}
              className={clsx(
                "flex w-full items-center gap-3 text-sm transition-colors",
                activeTab === 'reports' ? "font-medium text-blue-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <div className={clsx("h-2 w-2 rounded-full", activeTab === 'reports' ? "bg-blue-600" : "bg-transparent")}></div>
              Laporan Sistem
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('users')}
              className={clsx(
                "flex w-full items-center gap-3 text-sm transition-colors",
                activeTab === 'users' ? "font-medium text-blue-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <div className={clsx("h-2 w-2 rounded-full", activeTab === 'users' ? "bg-blue-600" : "bg-transparent")}></div>
              Manajemen Pengguna
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}
