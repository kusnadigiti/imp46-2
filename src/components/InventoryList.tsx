import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import { Search, Plus, Edit2, Trash2, X, Camera } from 'lucide-react';
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
      if (res.ok) {
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
          throw new Error('Gagal memperbarui barang');
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
          throw new Error('Gagal menambahkan barang');
        }
      }
      setIsModalOpen(false);
      setEditingItem(null);
      fetchItems();
    } catch (error) {
      console.error("Failed to save item:", error);
      toast.error(`Gagal menyimpan data barang "${itemData.name || ''}".`, 'Simpan Inventaris');
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

  const uniqueCategories: string[] = Array.from(new Set(items.map(item => item.category)));

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.kodeBarang.toLowerCase().includes(search.toLowerCase()) ||
                          item.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === '' || item.category === categoryFilter;
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Katalog Barang</h1>
          <p className="text-slate-500 mt-2">Kelola informasi produk, kategori, dan jumlah stok.</p>
        </div>
        <div className="flex gap-2">
          {selectedItems.size > 0 && (
            <button 
              onClick={handleDeleteSelected}
              className="rounded-md bg-red-50 text-red-600 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Terpilih ({selectedItems.size})
            </button>
          )}
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="rounded-md bg-slate-50 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            <Camera className="w-4 h-4 text-slate-500" />
            Scan QR / Barcode
          </button>
          <button 
            onClick={openAddModal}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
          >
            Tambah Barang
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white flex flex-col h-[calc(100vh-220px)] overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 p-5 bg-white gap-4">
          <div className="flex w-full sm:max-w-md gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama, kode barang..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all bg-white"
            >
              <option value="">Semua Kategori</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <button className="rounded-md bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 whitespace-nowrap">Ekspor CSV</button>
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
                <th className="px-6 py-3">Kode Barang</th>
                <th className="px-6 py-3">Nama Barang</th>
                <th className="px-6 py-3">Kategori</th>
                <th className="px-6 py-3">Posisi Barang</th>
                <th className="px-6 py-3 text-center">Jumlah</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 font-sans">Memuat inventaris...</td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 font-sans">
                    Tidak ada barang yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className={clsx("hover:bg-slate-50 transition-colors", selectedItems.has(item.id) && "bg-blue-50/50")}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className={clsx("px-6 py-4", item.quantity === 0 && "text-red-500")}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.kodeBarang}</span>
                        <button 
                          onClick={() => setQrCodeData(item.kodeBarang)}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                          title="Lihat QR Code"
                        >
                          <QRCodeSVG value={item.kodeBarang} size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-sans font-medium text-slate-900 italic">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 font-sans text-slate-600">{item.category}</td>
                    <td className="px-6 py-4 font-sans text-slate-900">{item.location || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={clsx(
                        "rounded-full px-2 py-0.5",
                        item.quantity > 15 && "bg-blue-100 text-blue-700",
                        item.quantity > 0 && item.quantity <= 15 && "bg-orange-100 text-orange-700",
                        item.quantity === 0 && "bg-red-100 text-red-700"
                      )}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 font-sans">
                      <button 
                        onClick={() => openEditModal(item)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Edit Item"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900">
            {item ? 'Edit Barang' : 'Tambah Barang Baru'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Nama Produk</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans italic text-slate-900"
              placeholder="Contoh: Wireless Mouse"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Kode Barang</label>
              <div className="flex gap-2">
                <input 
                  required
                  type="text" 
                  value={formData.kodeBarang}
                  onChange={e => setFormData({...formData, kodeBarang: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-all text-slate-900 bg-slate-50"
                  readOnly
                />
                {!item && (
                  <button 
                    type="button"
                    onClick={generateNewCode}
                    className="px-3 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Generate
                  </button>
                )}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Kategori</label>
                {categories.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsNewCategory(!isNewCategory);
                      setFormData({...formData, category: ''});
                    }} 
                    className="text-[10px] text-blue-600 font-medium hover:underline"
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
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-slate-900 font-sans"
                  placeholder="Kategori Baru..."
                />
              ) : (
                <select
                  required
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-slate-900 font-sans bg-white"
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
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Posisi Barang</label>
              <input 
                required
                type="text" 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans text-slate-900"
                placeholder="Rak A1"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Jumlah</label>
              <input 
                required
                type="number" 
                min="0"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono text-slate-900"
              />
            </div>
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
              {item ? 'Simpan' : 'Tambah Barang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
