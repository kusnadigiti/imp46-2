import React, { useState, useEffect } from 'react';
import { Repair, Item } from '../types';
import { Search, Plus, X, Wrench, CheckCircle, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow, format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { useToast } from './Toast';

export function RepairsList() {
  const toast = useToast();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRepairs, setSelectedRepairs] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [repairsRes, itemsRes] = await Promise.all([
        fetch('/api/repairs'),
        fetch('/api/inventory')
      ]);
      if (repairsRes.ok && itemsRes.ok) {
        setRepairs(await repairsRes.json());
        setItems(await itemsRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const repair = repairs.find(r => r.id === id);
    const itemName = repair ? repair.itemName : 'Barang';
    
    let nextStatus = 'Menunggu';
    if (currentStatus === 'Menunggu') nextStatus = 'Proses';
    else if (currentStatus === 'Proses') nextStatus = 'Selesai';
    
    try {
      const res = await fetch(`/api/repairs/${id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        toast.success(`Status perbaikan barang "${itemName}" diperbarui ke "${nextStatus}".`, 'Update Status Perbaikan');
        fetchData();
      } else {
        toast.error('Gagal memperbarui status perbaikan.', 'Update Status Perbaikan');
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error('Gagal menghubungi server untuk memperbarui status.', 'Update Status Perbaikan');
    }
  };

  const handleDelete = async (id: string) => {
    const repair = repairs.find(r => r.id === id);
    const itemName = repair ? repair.itemName : 'Barang';

    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Data laporan perbaikan ${itemName} ini akan dihapus permanen!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      await fetch(`/api/repairs/${id}`, { method: 'DELETE' });
      setSelectedRepairs(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      fetchData();
      toast.success(`Data laporan perbaikan "${itemName}" berhasil dihapus.`, 'Hapus Laporan Perbaikan');
    } catch (error) {
      console.error("Failed to delete repair:", error);
      toast.error(`Gagal menghapus laporan perbaikan untuk "${itemName}".`, 'Hapus Laporan Perbaikan');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRepairs.size === 0) return;
    const repairsCount = selectedRepairs.size;
    
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Anda akan menghapus ${repairsCount} data perbaikan terpilih!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      await Promise.all(
        Array.from(selectedRepairs).map(id => 
          fetch(`/api/repairs/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedRepairs(new Set());
      fetchData();
      toast.success(`${repairsCount} data perbaikan terpilih berhasil dihapus.`, 'Hapus Massal');
    } catch (error) {
      console.error("Failed to delete selected repairs:", error);
      toast.error('Gagal menghapus beberapa data perbaikan terpilih.', 'Hapus Massal');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRepairs(new Set(filteredRepairs.map(repair => repair.id)));
    } else {
      setSelectedRepairs(new Set());
    }
  };

  const handleSelectRepair = (id: string, checked: boolean) => {
    setSelectedRepairs(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSave = async (repairData: any) => {
    const selectedItem = items.find(i => i.id === repairData.itemId);
    const itemName = selectedItem ? selectedItem.name : 'Barang';
    try {
      const res = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repairData)
      });
      if (res.ok) {
        toast.success(`Laporan kerusakan barang "${itemName}" berhasil didaftarkan.`, 'Laporkan Kerusakan');
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error('Gagal mengirimkan laporan kerusakan.', 'Laporkan Kerusakan');
      }
    } catch (error) {
      console.error("Failed to save repair:", error);
      toast.error('Gagal menghubungi server untuk mendaftarkan laporan kerusakan.', 'Laporkan Kerusakan');
    }
  };

  const filteredRepairs = repairs.filter(repair => 
    repair.itemName.toLowerCase().includes(search.toLowerCase()) || 
    repair.description.toLowerCase().includes(search.toLowerCase())
  );

  const isAllSelected = filteredRepairs.length > 0 && selectedRepairs.size === filteredRepairs.length;
  const isSomeSelected = selectedRepairs.size > 0 && selectedRepairs.size < filteredRepairs.length;

  const totalPages = Math.ceil(filteredRepairs.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRepairs = filteredRepairs.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Perbaikan Barang</h1>
          <p className="text-slate-500 mt-2">Lacak status pemeliharaan dan perbaikan aset inventaris.</p>
        </div>
        <div className="flex gap-2">
          {selectedRepairs.size > 0 && (
            <button 
              onClick={handleDeleteSelected}
              className="rounded-md bg-red-50 text-red-600 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Terpilih ({selectedRepairs.size})
            </button>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" /> Buat Laporan Perbaikan
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white flex flex-col h-[calc(100vh-220px)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-white">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari berdasarkan nama barang atau deskripsi masalah..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <button className="rounded-md bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 ml-4 whitespace-nowrap">Ekspor CSV</button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 w-12">
                  <input 
                    type="checkbox" 
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">ID Tiket</th>
                <th className="px-6 py-3">Barang Terkait</th>
                <th className="px-6 py-3">Deskripsi Masalah</th>
                <th className="px-6 py-3">Tgl Lapor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 font-sans">Memuat data perbaikan...</td>
                </tr>
              ) : paginatedRepairs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 font-sans">
                    Tidak ada data yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                paginatedRepairs.map((repair) => (
                  <tr key={repair.id} className={clsx("hover:bg-slate-50 transition-colors", selectedRepairs.has(repair.id) && "bg-blue-50/50")}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedRepairs.has(repair.id)}
                        onChange={(e) => handleSelectRepair(repair.id, e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-slate-500">RP-{repair.id.toUpperCase()}</td>
                    <td className="px-6 py-4 font-sans font-medium text-slate-900 italic">
                      {repair.itemName}
                    </td>
                    <td className="px-6 py-4 font-sans text-slate-600 max-w-xs truncate" title={repair.description}>
                      {repair.description}
                    </td>
                    <td className="px-6 py-4 font-sans text-slate-500">
                      {formatDistanceToNow(new Date(repair.reportedDate), { addSuffix: true, locale: idLocale })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "rounded-full px-2 py-0.5",
                        repair.status === 'Menunggu' && "bg-red-100 text-red-700",
                        repair.status === 'Proses' && "bg-blue-100 text-blue-700",
                        repair.status === 'Selesai' && "bg-emerald-100 text-emerald-700"
                      )}>
                        {repair.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        {repair.status !== 'Selesai' ? (
                          <button 
                            onClick={() => handleUpdateStatus(repair.id, repair.status)}
                            className="rounded-md bg-white border border-slate-200 px-3 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                          >
                            Tandai {repair.status === 'Menunggu' ? 'Proses' : 'Selesai'}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic flex items-center justify-end gap-1 mr-2">
                             <CheckCircle className="w-3 h-3 text-emerald-500" /> Tuntas
                          </span>
                        )}
                        <button 
                          onClick={() => handleDelete(repair.id)}
                          className="rounded-md bg-white border border-slate-200 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
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
      </div>

      {isModalOpen && (
        <RepairModal 
          items={items}
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}

function RepairModal({ items, onClose, onSave }: { items: Item[], onClose: () => void, onSave: (data: any) => void }) {
  const [formData, setFormData] = useState({
    itemId: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900">
            Form Laporan Perbaikan
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Pilih Barang yang Rusak</label>
            <select 
              required
              value={formData.itemId}
              onChange={e => setFormData({...formData, itemId: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-slate-900 font-sans"
            >
              <option value="" disabled>-- Pilih Barang --</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.kodeBarang})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Deskripsi Kerusakan</label>
            <textarea 
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans text-slate-900 resize-none"
              placeholder="Jelaskan masalah secara detail..."
            ></textarea>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="rounded-md bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors flex items-center gap-1"
            >
              <Wrench className="w-3 h-3" /> Laporkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
