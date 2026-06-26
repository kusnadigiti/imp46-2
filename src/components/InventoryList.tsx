import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Item } from '../types';
import { Search, Plus, Edit2, Trash2, X, Camera, Upload, Download } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { useToast } from './Toast';
import { QRScanner } from './QRScanner';

import { QRCodeSVG } from 'qrcode.react';

export function InventoryList() {
  const toast = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/inventory');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        setItems(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const itemToDelete = items.find(item => item.id === id);
    const itemName = itemToDelete ? itemToDelete.name : 'Barang';

    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Anda tidak akan dapat mengembalikan data ${itemName}!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      fetchItems();
      toast.success(`Barang "${itemName}" berhasil dihapus dari inventaris.`, 'Hapus Inventaris');
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast.error(`Gagal menghapus data barang "${itemName}".`, 'Hapus Inventaris');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;
    const itemsCount = selectedItems.size;
    
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Anda akan menghapus ${itemsCount} barang terpilih!`,
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
        Array.from(selectedItems).map(id => 
          fetch(`/api/inventory/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedItems(new Set());
      fetchItems();
      toast.success(`${itemsCount} barang terpilih berhasil dihapus dari inventaris.`, 'Hapus Massal');
    } catch (error) {
      console.error("Failed to delete selected items:", error);
      toast.error('Gagal menghapus beberapa barang terpilih.', 'Hapus Massal');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSave = async (itemData: Partial<Item>) => {
    try {
      if (editingItem) {
        const res = await fetch(`/api/inventory/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        });
        if (res.ok) {
          toast.success(`Data barang "${itemData.name}" berhasil diperbarui.`, 'Edit Inventaris');
        } else {
          const contentType = res.headers.get('content-type');
          const isJson = contentType && contentType.includes('application/json');
          let errorMessage = 'Gagal memperbarui barang';
          if (!isJson) {
            const errText = await res.text();
            console.error("Non-JSON error response from server:", errText);
            if (res.status === 504 || res.status === 502) {
              errorMessage = 'Server timeout atau sedang offline (Cold Start). Silakan coba lagi dalam beberapa detik.';
            }
          } else {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
          }
          throw new Error(errorMessage);
        }
      } else {
        const res = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        });
        if (res.ok) {
          toast.success(`Barang "${itemData.name}" berhasil ditambahkan ke inventaris.`, 'Tambah Inventaris');
        } else {
          const contentType = res.headers.get('content-type');
          const isJson = contentType && contentType.includes('application/json');
          let errorMessage = 'Gagal menambahkan barang';
          if (!isJson) {
            const errText = await res.text();
            console.error("Non-JSON error response from server:", errText);
            if (res.status === 504 || res.status === 502) {
              errorMessage = 'Server timeout atau sedang offline (Cold Start). Silakan coba lagi dalam beberapa detik.';
            }
          } else {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
          }
          throw new Error(errorMessage);
        }
      }
      setIsModalOpen(false);
      setEditingItem(null);
      fetchItems();
    } catch (error: any) {
      console.error("Failed to save item:", error);
      toast.error(error.message || `Gagal menyimpan data barang "${itemData.name || ''}".`, 'Simpan Inventaris');
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleScanSuccess = (decodedText: string) => {
    const cleanCode = decodedText.trim();
    setSearch(cleanCode);
    setCategoryFilter(''); // reset category filter so scanned item displays correctly
    
    // Check if item exists in current list
    const foundItem = items.find(item => 
      item.kodeBarang.toLowerCase() === cleanCode.toLowerCase() || 
      item.name.toLowerCase().includes(cleanCode.toLowerCase())
    );

    if (foundItem) {
      toast.success(
        `Barang "${foundItem.name}" (${foundItem.kodeBarang}) berhasil diidentifikasi!`,
        'Scanner Sukses'
      );
    } else {
      toast.info(
        `Hasil pemindaian "${cleanCode}" dimasukkan ke filter pencarian.`,
        'Pencarian Scanner'
      );
    }
    
    setIsScannerOpen(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        let successCount = 0;
        let errorCount = 0;

        // Show loading toast
        toast.info(`Memproses ${data.length} data...`, 'Import Data');

        for (const row of data) {
          try {
            // Mapping CSV/Excel header to Item model
            const itemData: Partial<Item> = {
              name: row.NamaBarang || row.name || row['Nama Barang'] || '',
              kodeBarang: row.KodeBarang || row.kodeBarang || row['Kode Barang'] || '',
              category: row.Kategori || row.category || row.Category || '',
              location: row.Lokasi || row.location || row.Location || '',
              quantity: parseInt(row.Jumlah || row.quantity || row.Quantity || '0', 10),
              price: parseFloat(row.Harga || row.price || row.Price || '0') || null
            };

            if (!itemData.name || !itemData.kodeBarang) {
              errorCount++;
              continue;
            }

            const res = await fetch('/api/inventory', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(itemData)
            });

            if (res.ok) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (err) {
            errorCount++;
          }
        }

        fetchItems();
        
        if (successCount > 0) {
          toast.success(`Berhasil mengimpor ${successCount} barang.`, 'Import Selesai');
        }
        if (errorCount > 0) {
          toast.error(`Gagal mengimpor ${errorCount} baris data (format tidak valid atau duplikat).`, 'Import Peringatan');
        }
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        toast.error(`Gagal membaca file CSV: ${error.message}`, 'Error Import');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Kode Barang': 'KB-CONTOH',
        'Nama Barang': 'Laptop Lenovo Thinkpad',
        'Kategori': 'Elektronik',
        'Lokasi': 'Lab Komputer 1',
        'Jumlah': 15,
        'Harga': 15000000
      }
    ];
    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'template_import_barang.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uniqueCategories: string[] = Array.from(new Set(items.map(item => item.category || '')));

  const filteredItems = items.filter(item => {
    const safeName = item.name || '';
    const safeKode = item.kodeBarang || '';
    const safeCat = item.category || '';
    
    const matchesSearch = safeName.toLowerCase().includes(search.toLowerCase()) || 
                          safeKode.toLowerCase().includes(search.toLowerCase()) ||
                          safeCat.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === '' || safeCat === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const isAllSelected = filteredItems.length > 0 && selectedItems.size === filteredItems.length;
  const isSomeSelected = selectedItems.size > 0 && selectedItems.size < filteredItems.length;

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when searching/filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white neon-text">Katalog Barang</h1>
          <p className="text-white/70 mt-2">Kelola informasi produk, kategori, dan jumlah stok.</p>
        </div>
        <div className="flex gap-2">
          {selectedItems.size > 0 && (
            <button 
              onClick={handleDeleteSelected}
              className="rounded-md bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-red-500/30 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Terpilih ({selectedItems.size})
            </button>
          )}
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md glass-button px-4 py-2 text-sm font-semibold flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="rounded-md glass-button px-4 py-2 text-sm font-semibold flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Scan QR
          </button>
          <button 
            onClick={openAddModal}
            className="rounded-md glass-button-primary px-4 py-2 text-sm font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Barang
          </button>
        </div>
      </div>

      <div className="rounded-xl glass-panel flex flex-col h-[calc(100vh-220px)] overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 p-5 glass-header gap-4">
          <div className="flex w-full sm:max-w-md gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
              <input 
                type="text" 
                placeholder="Cari nama, kode barang..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm rounded-md glass-input"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-md glass-input [&>option]:text-slate-900"
            >
              <option value="">Semua Kategori</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownloadTemplate} className="rounded-md glass-button px-3 py-1.5 text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
              <Download className="w-3.5 h-3.5" />
              Template CSV
            </button>
            <button className="rounded-md glass-button px-3 py-1.5 text-xs font-semibold whitespace-nowrap">Ekspor CSV</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] font-bold uppercase text-white/60 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-3 w-12">
                  <input 
                    type="checkbox" 
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    className="rounded border-white/30 bg-white/10 text-pink-500 focus:ring-pink-500/50"
                  />
                </th>
                <th className="px-6 py-3">Kode Barang</th>
                <th className="px-6 py-3">Nama Barang</th>
                <th className="px-6 py-3">Kategori</th>
                <th className="px-6 py-3">Posisi Barang</th>
                <th className="px-6 py-3 text-center">Jumlah</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-xs font-mono">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-white/50 font-sans">Memuat inventaris...</td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-white/50 font-sans">
                    Tidak ada barang yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className={clsx("hover:bg-white/5 transition-colors text-white/90", selectedItems.has(item.id) && "bg-white/10")}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                        className="rounded border-white/30 bg-white/10 text-pink-500 focus:ring-pink-500/50"
                      />
                    </td>
                    <td className={clsx("px-6 py-4", item.quantity === 0 && "text-red-400")}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.kodeBarang}</span>
                        <button 
                          onClick={() => setQrCodeData(item.kodeBarang)}
                          className="text-white/40 hover:text-pink-400 transition-colors"
                          title="Lihat QR Code"
                        >
                          <QRCodeSVG value={item.kodeBarang} size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-sans font-medium text-white italic">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 font-sans text-white/70">{item.category}</td>
                    <td className="px-6 py-4 font-sans text-white/90">{item.location || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={clsx(
                        "rounded-full px-2 py-0.5 font-semibold",
                        item.quantity > 15 && "bg-blue-500/20 text-blue-300 border border-blue-500/30",
                        item.quantity > 0 && item.quantity <= 15 && "bg-orange-500/20 text-orange-300 border border-orange-500/30",
                        item.quantity === 0 && "bg-red-500/20 text-red-300 border border-red-500/30"
                      )}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 font-sans">
                      <button 
                        onClick={() => openEditModal(item)}
                        className="p-1 text-white/40 hover:text-blue-400 transition-colors"
                        title="Edit Item"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-white/40 hover:text-red-400 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between glass-header">
          <span className="text-sm text-white/60">
            Halaman <span className="font-medium text-white">{currentPage}</span> dari <span className="font-medium text-white">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium glass-button rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium glass-button rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ItemModal 
          item={editingItem} 
          categories={uniqueCategories}
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
        />
      )}

      {/* QR Code Modal */}
      {qrCodeData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold uppercase tracking-tight text-slate-900 mb-6">QR Code Barang</h3>
            <div className="p-4 border-2 border-slate-100 rounded-lg bg-white mb-4">
              <QRCodeSVG value={qrCodeData} size={200} />
            </div>
            <p className="font-mono text-lg font-bold text-slate-700 mb-6">{qrCodeData}</p>
            <button 
              onClick={() => setQrCodeData(null)}
              className="rounded-md bg-slate-100 px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Camera QR/Barcode Scanner Modal */}
      {isScannerOpen && (
        <QRScanner 
          onScanSuccess={handleScanSuccess} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}
    </div>
  );
}

function ItemModal({ item, categories, onClose, onSave }: { item: Item | null, categories: string[], onClose: () => void, onSave: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    kodeBarang: item?.kodeBarang || `KB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    category: item?.category || '',
    location: item?.location || '',
    price: item?.price || 0,
    quantity: item?.quantity || 0,
  });

  const [isNewCategory, setIsNewCategory] = useState(false);

  const generateNewCode = () => {
    setFormData(prev => ({
      ...prev,
      kodeBarang: `KB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      price: Number(formData.price),
      quantity: Number(formData.quantity)
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 glass-header flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-tight text-white neon-text">
            {item ? 'Edit Barang' : 'Tambah Barang Baru'}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Nama Produk</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 text-sm rounded-md glass-input font-sans italic"
              placeholder="Contoh: Wireless Mouse"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Kode Barang</label>
              <div className="flex gap-2">
                <input 
                  required
                  type="text" 
                  value={formData.kodeBarang}
                  onChange={e => setFormData({...formData, kodeBarang: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-md glass-input font-mono bg-white/5"
                  readOnly
                />
                {!item && (
                  <button 
                    type="button"
                    onClick={generateNewCode}
                    className="px-3 rounded-md glass-button text-xs font-semibold"
                  >
                    Generate
                  </button>
                )}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50">Kategori</label>
                {categories.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsNewCategory(!isNewCategory);
                      setFormData({...formData, category: ''});
                    }} 
                    className="text-[10px] text-pink-400 font-medium hover:underline"
                  >
                    {isNewCategory ? 'Pilih Kategori' : 'Kategori Baru'}
                  </button>
                )}
              </div>
              {isNewCategory || categories.length === 0 ? (
                <input 
                  required
                  type="text" 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-md glass-input font-sans"
                  placeholder="Kategori Baru..."
                />
              ) : (
                <select
                  required
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-md glass-input font-sans [&>option]:text-slate-900"
                >
                  <option value="" disabled>Pilih Kategori</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Posisi Barang</label>
              <input 
                required
                type="text" 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 text-sm rounded-md glass-input font-sans"
                placeholder="Rak A1"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Jumlah</label>
              <input 
                required
                type="number" 
                min="0"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
                className="w-full px-3 py-2 text-sm rounded-md glass-input font-mono"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Harga (Rp)</label>
            <input 
              required
              type="number" 
              min="0"
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
              className="w-full px-3 py-2 text-sm rounded-md glass-input font-mono"
              placeholder="0"
            />
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="rounded-md glass-button px-3 py-1.5 text-xs font-semibold"
            >
              Batal
            </button>
            <button 
              type="submit"
              className="rounded-md glass-button-primary px-4 py-1.5 text-xs font-semibold"
            >
              {item ? 'Simpan' : 'Tambah Barang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
