import React, { useState, useEffect } from 'react';
import { Loan, Item } from '../types';
import { Search, Plus, CheckCircle, RefreshCcw, X, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow, format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { useToast } from './Toast';

export function LoansList() {
  const toast = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoans, setSelectedLoans] = useState<Set<string>>(new Set());

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
      const [loansRes, itemsRes] = await Promise.all([
        fetch('/api/loans'),
        fetch('/api/inventory')
      ]);
      const isJson = (res: Response) => {
        const contentType = res.headers.get('content-type');
        return !!(contentType && contentType.includes('application/json'));
      };
      if (loansRes.ok && itemsRes.ok && isJson(loansRes) && isJson(itemsRes)) {
        setLoans(await loansRes.json());
        setItems(await itemsRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (id: string) => {
    const loan = loans.find(l => l.id === id);
    const itemName = loan ? loan.itemName : 'Barang';
    try {
      const res = await fetch(`/api/loans/${id}/return`, { method: 'PUT' });
      if (res.ok) {
        toast.success(`Barang "${itemName}" berhasil dikembalikan.`, 'Pengembalian Barang');
        fetchData();
      } else {
        const contentType = res.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        const errorData = isJson ? await res.json() : { error: 'Gagal memproses pengembalian.' };
        toast.error(errorData.error || 'Gagal memproses pengembalian.', 'Pengembalian Barang');
      }
    } catch (error) {
      console.error("Failed to return item:", error);
      toast.error('Gagal menghubungi server untuk memproses pengembalian.', 'Pengembalian Barang');
    }
  };

  const handleDelete = async (id: string) => {
    const loan = loans.find(l => l.id === id);
    const itemName = loan ? loan.itemName : 'Barang';

    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data peminjaman ini akan dihapus dan stok akan dikembalikan jika masih dipinjam!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      await fetch(`/api/loans/${id}`, { method: 'DELETE' });
      setSelectedLoans(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      fetchData();
      toast.success(`Data peminjaman untuk "${itemName}" berhasil dihapus.`, 'Hapus Peminjaman');
    } catch (error) {
      console.error("Failed to delete loan:", error);
      toast.error(`Gagal menghapus data peminjaman untuk "${itemName}".`, 'Hapus Peminjaman');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLoans.size === 0) return;
    const loansCount = selectedLoans.size;
    
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Anda akan menghapus ${loansCount} data peminjaman terpilih!`,
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
        Array.from(selectedLoans).map(id => 
          fetch(`/api/loans/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedLoans(new Set());
      fetchData();
      toast.success(`${loansCount} data peminjaman terpilih berhasil dihapus.`, 'Hapus Massal');
    } catch (error) {
      console.error("Failed to delete selected loans:", error);
      toast.error('Gagal menghapus beberapa data peminjaman terpilih.', 'Hapus Massal');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLoans(new Set(filteredLoans.map(loan => loan.id)));
    } else {
      setSelectedLoans(new Set());
    }
  };

  const handleSelectLoan = (id: string, checked: boolean) => {
    setSelectedLoans(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSave = async (loanData: any) => {
    const selectedItem = items.find(i => i.id === loanData.itemId);
    const itemName = selectedItem ? selectedItem.name : 'Barang';
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanData)
      });
      if (res.ok) {
        toast.success(`Berhasil meminjamkan "${itemName}" kepada ${loanData.borrowerName}.`, 'Tambah Peminjaman');
        setIsModalOpen(false);
        fetchData();
      } else {
        const contentType = res.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        const errorData = isJson ? await res.json() : { error: 'Gagal memproses peminjaman barang.' };
        toast.error(errorData.error || 'Gagal memproses peminjaman barang.', 'Tambah Peminjaman');
      }
    } catch (error) {
      console.error("Failed to save loan:", error);
      toast.error('Gagal menghubungi server untuk memproses peminjaman.', 'Tambah Peminjaman');
    }
  };

  const filteredLoans = loans.filter(loan => 
    loan.itemName.toLowerCase().includes(search.toLowerCase()) || 
    loan.borrowerName.toLowerCase().includes(search.toLowerCase())
  );

  const isAllSelected = filteredLoans.length > 0 && selectedLoans.size === filteredLoans.length;
  const isSomeSelected = selectedLoans.size > 0 && selectedLoans.size < filteredLoans.length;

  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLoans = filteredLoans.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Peminjaman Barang</h1>
          <p className="text-slate-500 mt-2">Kelola riwayat dan status peminjaman inventaris.</p>
        </div>
        <div className="flex gap-2">
          {selectedLoans.size > 0 && (
            <button 
              onClick={handleDeleteSelected}
              className="rounded-md bg-red-50 text-red-600 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Terpilih ({selectedLoans.size})
            </button>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
          >
            Buat Peminjaman
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white flex flex-col h-[calc(100vh-220px)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-white">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari berdasarkan nama barang atau peminjam..." 
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
                <th className="px-6 py-3">ID Pinjam</th>
                <th className="px-6 py-3">Nama Barang</th>
                <th className="px-6 py-3">Peminjam</th>
                <th className="px-6 py-3 text-center">Jumlah</th>
                <th className="px-6 py-3">Tanggal Pinjam</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500 font-sans">Memuat data peminjaman...</td>
                </tr>
              ) : paginatedLoans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500 font-sans">
                    Tidak ada data yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                paginatedLoans.map((loan) => (
                  <tr key={loan.id} className={clsx("hover:bg-slate-50 transition-colors", selectedLoans.has(loan.id) && "bg-blue-50/50")}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedLoans.has(loan.id)}
                        onChange={(e) => handleSelectLoan(loan.id, e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-slate-500">LN-{loan.id.toUpperCase()}</td>
                    <td className="px-6 py-4 font-sans font-medium text-slate-900 italic">
                      {loan.itemName}
                    </td>
                    <td className="px-6 py-4 font-sans text-slate-600">{loan.borrowerName}</td>
                    <td className="px-6 py-4 text-center">{loan.quantity}</td>
                    <td className="px-6 py-4 font-sans text-slate-500">
                      {format(new Date(loan.borrowDate), 'dd MMM yyyy', { locale: idLocale })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "rounded-full px-2 py-0.5",
                        loan.status === 'Dipinjam' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        {loan.status === 'Dipinjam' ? (
                          <button 
                            onClick={() => handleReturn(loan.id)}
                            className="rounded-md bg-white border border-slate-200 px-3 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                          >
                            <RefreshCcw className="w-3 h-3" /> Kembalikan
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic flex items-center gap-1 mr-2">
                             <CheckCircle className="w-3 h-3 text-emerald-500" /> Selesai
                          </span>
                        )}
                        <button 
                          onClick={() => handleDelete(loan.id)}
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
        <LoanModal 
          items={items}
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}

function LoanModal({ items, onClose, onSave }: { items: Item[], onClose: () => void, onSave: (data: any) => void }) {
  const [formData, setFormData] = useState({
    itemId: '',
    borrowerName: '',
    quantity: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      quantity: Number(formData.quantity)
    });
  };

  const selectedItem = items.find(i => i.id === formData.itemId);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900">
            Form Peminjaman Baru
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Pilih Barang</label>
            <select 
              required
              value={formData.itemId}
              onChange={e => setFormData({...formData, itemId: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-slate-900 font-sans"
            >
              <option value="" disabled>-- Pilih Barang --</option>
              {items.map(item => (
                <option key={item.id} value={item.id} disabled={item.quantity === 0}>
                  {item.name} (Sisa: {item.quantity})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Nama Peminjam</label>
            <input 
              required
              type="text" 
              value={formData.borrowerName}
              onChange={e => setFormData({...formData, borrowerName: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans text-slate-900"
              placeholder="Contoh: Budi Santoso"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Jumlah</label>
            <input 
              required
              type="number" 
              min="1"
              max={selectedItem?.quantity || 1}
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono text-slate-900"
            />
            {selectedItem && (
               <p className="text-[10px] text-slate-400 mt-1">Maksimal yang dapat dipinjam: {selectedItem.quantity}</p>
            )}
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
              className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
            >
              Simpan Pinjaman
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
