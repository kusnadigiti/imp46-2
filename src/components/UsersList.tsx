import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Search, Plus, Edit2, Trash2, Shield, Mail, CheckCircle, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import clsx from 'clsx';
import { useToast } from './Toast';

export function UsersList() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua');
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Staff',
    status: 'Aktif'
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || 
                          user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'Semua' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
       const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
       const method = editingUser ? 'PUT' : 'POST';
       
       const response = await fetch(url, {
         method,
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(formData),
       });
 
       if (response.ok) {
         toast.success(
           editingUser ? `Data pengguna "${formData.name}" diperbarui.` : `Pengguna "${formData.name}" berhasil ditambahkan.`,
           editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'
         );
         setIsModalOpen(false);
         fetchUsers();
       } else {
         toast.error('Gagal menyimpan data pengguna.', 'Simpan Pengguna');
       }
    } catch (error) {
       toast.error('Terjadi kesalahan saat menyimpan data pengguna.', 'Simpan Pengguna');
    }
  };
 
  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Hapus Pengguna?',
      text: `Anda yakin ingin menghapus ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });
 
    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchUsers();
          toast.success(`Pengguna "${name}" berhasil dihapus.`, 'Hapus Pengguna');
        } else {
          toast.error(`Gagal menghapus pengguna "${name}".`, 'Hapus Pengguna');
        }
      } catch (error) {
        toast.error(`Gagal menghapus pengguna "${name}".`, 'Hapus Pengguna');
      }
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'Staff',
        status: 'Aktif'
      });
    }
    setIsModalOpen(true);
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'Admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Guru': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Siswa': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen Pengguna</h1>
          <p className="text-slate-500 mt-2">Kelola akses dan akun pengguna sistem.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah Pengguna
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-2 pl-10 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="block w-full sm:w-48 rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="Semua">Semua Peran</option>
          <option value="Admin">Admin</option>
          <option value="Guru">Guru</option>
          <option value="Staff">Staff</option>
          <option value="Siswa">Siswa</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Nama Lengkap</th>
                <th scope="col" className="px-6 py-4 font-semibold">Kontak</th>
                <th scope="col" className="px-6 py-4 font-semibold">Peran</th>
                <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-sans">Memuat data pengguna...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-sans">Tidak ada pengguna yang ditemukan.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-medium text-slate-900">{user.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border", getRoleColor(user.role))}>
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx("inline-flex items-center gap-1.5", user.status === 'Aktif' ? 'text-green-600' : 'text-slate-400')}>
                        {user.status === 'Aktif' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span className="text-xs font-medium">{user.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            Swal.fire({
                              title: 'Reset Kata Sandi oleh Admin',
                              html: `
                                <div class="text-left font-sans">
                                  <p class="text-xs text-slate-500 mb-4">Ubah kata sandi untuk pengguna <strong>${user.name}</strong> (${user.email}) secara langsung.</p>
                                  <label class="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
                                  <input id="swal-input-password" type="password" class="swal2-input w-full m-0 px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Masukkan kata sandi baru" style="box-sizing: border-box; width: 100%; margin-top: 4px;">
                                </div>
                              `,
                              focusConfirm: false,
                              showCancelButton: true,
                              confirmButtonColor: '#2563eb',
                              cancelButtonColor: '#94a3b8',
                              confirmButtonText: 'Simpan Sandi',
                              cancelButtonText: 'Batal',
                              preConfirm: () => {
                                const password = (document.getElementById('swal-input-password') as HTMLInputElement).value;
                                if (!password) {
                                  Swal.showValidationMessage('Kata sandi baru tidak boleh kosong');
                                  return false;
                                }
                                if (password.length < 6) {
                                  Swal.showValidationMessage('Kata sandi minimal 6 karakter');
                                  return false;
                                }
                                return password;
                              }
                            }).then((result) => {
                              if (result.isConfirmed) {
                                const newPassword = result.value;
                                fetch(`/api/users/${user.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ password: newPassword })
                                }).then(res => {
                                  if (res.ok) {
                                    Swal.fire({
                                      icon: 'success',
                                      title: 'Sandi Diperbarui',
                                      text: `Kata sandi baru untuk ${user.name} berhasil disimpan oleh Admin.`,
                                      confirmButtonColor: '#2563eb'
                                    });
                                  } else {
                                    Swal.fire('Error', 'Gagal menyimpan kata sandi baru', 'error');
                                  }
                                });
                              }
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-amber-600 transition-colors"
                          title="Reset Kata Sandi"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                        </button>
                        <button 
                          onClick={() => openModal(user)}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id, user.name)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-500 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium leading-6 text-slate-900">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  className="mt-2 block w-full rounded-md border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium leading-6 text-slate-900">Email</label>
                <input
                  type="email"
                  required
                  className="mt-2 block w-full rounded-md border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900">Peran</label>
                  <select
                    className="mt-2 block w-full rounded-md border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Guru">Guru</option>
                    <option value="Staff">Staff</option>
                    <option value="Siswa">Siswa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900">Status</label>
                  <select
                    className="mt-2 block w-full rounded-md border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as 'Aktif'|'Nonaktif'})}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors border border-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
