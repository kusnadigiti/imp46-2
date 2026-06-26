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
          confirmButtonColor: '#ec4899',
          background: '#0f172a',
          color: '#fff'
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
    <div className="min-h-screen aurora-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-pink-500 to-violet-600 p-4 rounded-2xl text-white shadow-[0_0_20px_rgba(236,72,153,0.5)]">
            <Monitor className="w-10 h-10" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white neon-text">
          {isResetMode ? 'Reset Kata Sandi' : 'Masuk ke Sistem'}
        </h2>
        <p className="mt-2 text-center text-sm text-white/70">
          {isResetMode ? 'Masukkan email Anda untuk menerima instruksi reset' : 'Aplikasi Manajemen Inventaris Terintegrasi'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 relative z-10">
        <div className="glass-panel py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && !isResetMode && (
              <div className="bg-red-500/20 text-red-300 text-xs p-3 rounded-md border border-red-500/30 font-semibold text-center">
                {error}
              </div>
            )}
            
            {isResetMode ? (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">
                  Alamat Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md glass-input font-sans"
                    placeholder="Masukkan email Anda"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">
                    Alamat Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md glass-input font-sans"
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">
                    Kata Sandi
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md glass-input font-sans"
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
                      className="h-4 w-4 rounded border-white/30 bg-white/10 text-pink-500 focus:ring-pink-500/50"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-xs text-white/70">
                      Ingat saya
                    </label>
                  </div>

                  <div className="text-xs">
                    <button 
                      type="button" 
                      onClick={() => setIsResetMode(true)}
                      className="font-semibold text-pink-400 hover:text-pink-300"
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
                className="flex w-full justify-center rounded-md glass-button-primary px-4 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:opacity-70"
              >
                {loading ? 'Memverifikasi...' : (isResetMode ? 'Kirim Link Reset' : 'Masuk')}
              </button>
              
              {isResetMode && (
                <button
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  disabled={loading}
                  className="flex w-full justify-center rounded-md glass-button px-4 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/20 disabled:opacity-70"
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
