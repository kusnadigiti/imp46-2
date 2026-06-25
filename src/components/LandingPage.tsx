import React, { useState, useEffect, useMemo } from 'react';
import { Wrench, RefreshCcw, LogIn, Search, Box, BarChart2, Monitor } from 'lucide-react';
import { Item, Loan, Repair } from '../types';
import { formatDistanceToNow, format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import clsx from 'clsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface LandingPageProps {
  onAdminClick: () => void;
}

export function LandingPage({ onAdminClick }: LandingPageProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'katalog' | 'peminjaman' | 'perbaikan' | 'grafik'>('grafik');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      const [itemsRes, loansRes, repairsRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/loans'),
        fetch('/api/repairs')
      ]);
      if (itemsRes.ok) setItems(await itemsRes.json());
      if (loansRes.ok) setLoans(await loansRes.json());
      if (repairsRes.ok) setRepairs(await repairsRes.json());
    } catch (error) {
      console.error('Gagal mengambil data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Polling setiap 5 detik untuk realtime
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab]);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.kodeBarang.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLoans = loans.filter(loan => 
    loan.itemName.toLowerCase().includes(search.toLowerCase()) || 
    loan.borrowerName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRepairs = repairs.filter(repair => 
    repair.itemName.toLowerCase().includes(search.toLowerCase()) || 
    repair.description.toLowerCase().includes(search.toLowerCase())
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedItems = filteredItems.slice(startIndex, endIndex);
  const paginatedLoans = filteredLoans.slice(startIndex, endIndex);
  const paginatedRepairs = filteredRepairs.slice(startIndex, endIndex);

  const totalPages = Math.ceil(
    (activeTab === 'katalog' ? filteredItems.length : 
     activeTab === 'peminjaman' ? filteredLoans.length : 
     activeTab === 'perbaikan' ? filteredRepairs.length : 1) / itemsPerPage
  ) || 1;

  // Chart data
  const categoryData = useMemo(() => {
    const counts = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .map(([name, count]) => ({ name, value: count as number }))
      .sort((a, b) => Number(b.value) - Number(a.value));
  }, [items]);

  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Monitor className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">SMKN 46 Jakarta</span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Kepala Laboratorium Komputer</span>
            </div>
          </div>
          <button 
            onClick={onAdminClick}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Login Admin
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-blue-600 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Portal Informasi Inventaris
          </h1>
          <p className="mt-4 text-lg leading-8 text-blue-100 max-w-2xl mx-auto">
            Pantau ketersediaan barang, status peminjaman, dan riwayat perbaikan secara real-time.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-12">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto">
            <button
              onClick={() => setActiveTab('grafik')}
              className={clsx(
                "flex-1 px-6 py-4 text-sm font-semibold border-b-2 whitespace-nowrap flex items-center justify-center gap-2 transition-colors",
                activeTab === 'grafik' ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <BarChart2 className="w-4 h-4" />
              Grafik Inventaris
            </button>
            <button
              onClick={() => setActiveTab('katalog')}
              className={clsx(
                "flex-1 px-6 py-4 text-sm font-semibold border-b-2 whitespace-nowrap flex items-center justify-center gap-2 transition-colors",
                activeTab === 'katalog' ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Box className="w-4 h-4" />
              Katalog Barang
            </button>
            <button
              onClick={() => setActiveTab('peminjaman')}
              className={clsx(
                "flex-1 px-6 py-4 text-sm font-semibold border-b-2 whitespace-nowrap flex items-center justify-center gap-2 transition-colors",
                activeTab === 'peminjaman' ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <RefreshCcw className="w-4 h-4" />
              Status Peminjaman
            </button>
            <button
              onClick={() => setActiveTab('perbaikan')}
              className={clsx(
                "flex-1 px-6 py-4 text-sm font-semibold border-b-2 whitespace-nowrap flex items-center justify-center gap-2 transition-colors",
                activeTab === 'perbaikan' ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Wrench className="w-4 h-4" />
              Status Perbaikan
            </button>
          </div>

          {/* Search Bar */}
          {activeTab !== 'grafik' && (
            <div className="p-6 border-b border-slate-100">
              <div className="relative max-w-2xl mx-auto">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari berdasarkan nama, kode, atau kategori..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="p-0 sm:p-6 overflow-x-auto">
            {activeTab === 'grafik' && (
              <div className="p-6 h-[400px]">
                <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">Distribusi Kuantitas Barang per Kategori</h3>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    Belum ada data barang untuk ditampilkan grafiknya.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'katalog' && (
              <table className="w-full text-left whitespace-nowrap sm:whitespace-normal">
                <thead className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Kode Barang</th>
                    <th className="px-6 py-4">Nama Barang</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Posisi</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Tidak ada barang ditemukan.</td>
                    </tr>
                  ) : (
                    paginatedItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.kodeBarang}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                        <td className="px-6 py-4 text-slate-600">{item.category}</td>
                        <td className="px-6 py-4 text-slate-600">{item.location || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={clsx(
                            "rounded-full px-3 py-1 text-xs font-medium",
                            item.quantity > 15 && "bg-emerald-100 text-emerald-700",
                            item.quantity > 0 && item.quantity <= 15 && "bg-amber-100 text-amber-700",
                            item.quantity === 0 && "bg-red-100 text-red-700"
                          )}>
                            {item.quantity > 0 ? `Tersedia (${item.quantity})` : 'Habis'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'peminjaman' && (
              <table className="w-full text-left whitespace-nowrap sm:whitespace-normal">
                <thead className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">ID Pinjam</th>
                    <th className="px-6 py-4">Nama Barang</th>
                    <th className="px-6 py-4">Peminjam</th>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedLoans.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Tidak ada data peminjaman.</td>
                    </tr>
                  ) : (
                    paginatedLoans.map(loan => (
                      <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">LN-{loan.id.toUpperCase()}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{loan.itemName}</td>
                        <td className="px-6 py-4 text-slate-600">{loan.borrowerName} <span className="text-xs text-slate-400">({loan.quantity} unit)</span></td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {format(new Date(loan.borrowDate), 'dd MMM yyyy', { locale: idLocale })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={clsx(
                            "rounded-full px-3 py-1 text-xs font-medium",
                            loan.status === 'Dipinjam' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          )}>
                            {loan.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'perbaikan' && (
              <table className="w-full text-left whitespace-nowrap sm:whitespace-normal">
                <thead className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">ID Tiket</th>
                    <th className="px-6 py-4">Nama Barang</th>
                    <th className="px-6 py-4">Kendala</th>
                    <th className="px-6 py-4">Dilaporkan</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedRepairs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Tidak ada data perbaikan.</td>
                    </tr>
                  ) : (
                    paginatedRepairs.map(repair => (
                      <tr key={repair.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">RP-{repair.id.toUpperCase()}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{repair.itemName}</td>
                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{repair.description}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {formatDistanceToNow(new Date(repair.reportedDate), { addSuffix: true, locale: idLocale })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={clsx(
                            "rounded-full px-3 py-1 text-xs font-medium",
                            repair.status === 'Menunggu' && "bg-red-100 text-red-700",
                            repair.status === 'Proses' && "bg-blue-100 text-blue-700",
                            repair.status === 'Selesai' && "bg-emerald-100 text-emerald-700"
                          )}>
                            {repair.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {activeTab !== 'grafik' && (
            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
              <span className="text-sm text-slate-500">
                Halaman <span className="font-medium text-slate-900">{currentPage}</span> dari <span className="font-medium text-slate-900">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
