import React, { useState } from 'react';
import { Monitor } from 'lucide-react';
import Swal from 'sweetalert2';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isResetMode) {
      // Simulate reset password
      setTimeout(() => {
        setLoading(false);
        Swal.fire({
          icon: 'success',
          title: 'Email Terkirim',
          text: `Instruksi untuk reset kata sandi telah dikirim ke ${resetEmail}`,
          confirmButtonColor: '#2563eb'
        });
        setIsResetMode(false);
        setResetEmail('');
      }, 1000);
      return;
    }

    // Simulasi proses login
    setTimeout(() => {
      if (email === 'admin@example.com' && password === 'admin123') {
        onLogin();
      } else {
        setError('Email atau password salah.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg">
            <Monitor className="w-10 h-10" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900">
          {isResetMode ? 'Reset Kata Sandi' : 'Masuk ke Sistem'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          {isResetMode ? 'Masukkan email Anda untuk menerima instruksi reset' : 'Aplikasi Manajemen Inventaris Terintegrasi'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && !isResetMode && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-md border border-red-100">
                {error}
              </div>
            )}
            
            {isResetMode ? (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Alamat Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans text-slate-900"
                    placeholder="Masukkan email Anda"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Alamat Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans text-slate-900"
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Kata Sandi
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans text-slate-900"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-600">
                      Ingat saya
                    </label>
                  </div>

                  <div className="text-xs">
                    <button 
                      type="button" 
                      onClick={() => setIsResetMode(true)}
                      className="font-semibold text-blue-600 hover:text-blue-500"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors disabled:opacity-70"
              >
                {loading ? 'Memverifikasi...' : (isResetMode ? 'Kirim Link Reset' : 'Masuk')}
              </button>
              
              {isResetMode && (
                <button
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  disabled={loading}
                  className="flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors disabled:opacity-70"
                >
                  Kembali ke Login
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
