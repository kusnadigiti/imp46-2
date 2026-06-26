import React, { useEffect, useState } from 'react';
import { ReportSummary, Activity } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import clsx from 'clsx';

export function Dashboard() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, activitiesRes] = await Promise.all([
          fetch('/api/reports/summary'),
          fetch('/api/activities')
        ]);
        
        const isJson = (res: Response) => {
          const contentType = res.headers.get('content-type');
          return !!(contentType && contentType.includes('application/json'));
        };

        if (summaryRes.ok && activitiesRes.ok && isJson(summaryRes) && isJson(activitiesRes)) {
          setSummary(await summaryRes.json());
          setActivities(await activitiesRes.json());
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  if (loading || !summary) {
    return <div className="p-8 text-white/50 flex items-center justify-center h-full">Memuat dasbor...</div>;
  }

  const COLORS = ['#f472b6', '#c084fc', '#60a5fa', '#34d399', '#fbbf24'];

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Barang" 
          value={summary.totalItems.toLocaleString()} 
          subtitle={`${summary.totalSKUs} Kode Unik`}
        />
        <StatCard 
          title="Sedang Dipinjam" 
          value={summary.activeLoans.toString()} 
          subtitle="Peminjaman Aktif"
        />
        <StatCard 
          title="Dalam Perbaikan" 
          value={summary.pendingRepairs.toString()} 
          subtitle="Tunggu Teknisi"
          alert={summary.pendingRepairs > 0}
        />
        <StatCard 
          title="Peringatan Stok" 
          value={summary.lowStockCount.toString()} 
          subtitle="Perlu Restock"
          alert={summary.lowStockCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2 glass-panel flex flex-col rounded-xl">
          <div className="flex items-center justify-between glass-header p-5">
            <h3 className="text-sm font-bold uppercase tracking-tight text-white neon-text">Inventaris Berdasarkan Kategori</h3>
          </div>
          <div className="h-80 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.categoryDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {summary.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 flex flex-col gap-6">
          <div className="rounded-xl glass-panel p-6">
            <h3 className="text-sm font-bold uppercase tracking-tight mb-4 text-white neon-text">Distribusi Status Barang</h3>
            <div className="flex h-3 w-full gap-1 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-500 to-violet-500" style={{ width: '65%' }}></div>
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: '25%' }}></div>
              <div className="h-full bg-red-500" style={{ width: '10%' }}></div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/70">Tersedia Normal</span>
                <span className="font-mono text-white">65%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/70">Peminjaman Berjalan</span>
                <span className="font-mono text-white">25%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-red-400 font-bold">Rusak / Perbaikan</span>
                <span className="font-mono text-red-400">10%</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/20 bg-black/40 backdrop-blur-xl p-6 text-white flex-1 flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Log Aktivitas Real-time</h3>
            
            <div className="mt-6 flex-1 overflow-y-auto space-y-3">
              {activities.slice(0, 3).map((activity) => (
                <div key={activity.id} className="text-xs">
                  <div className="text-pink-300 font-medium truncate">{activity.itemName}</div>
                  <div className="text-[10px] text-white/60">{activity.details}</div>
                  <div className="text-[9px] text-white/40 mt-0.5">{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: idLocale })}</div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-xs text-white/40 italic mt-2">Tidak ada aktivitas terbaru.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, alert }: { title: string, value: string, subtitle?: string, alert?: boolean }) {
  return (
    <div className="rounded-xl glass-panel p-5">
      <span className="text-xs font-semibold uppercase tracking-wider text-white/50">{title}</span>
      <p className={clsx("mt-1 text-3xl font-light font-mono neon-text", alert ? "text-red-400" : "text-white")}>{value}</p>
      {subtitle && (
        <div className={clsx("mt-2 text-[10px]", alert ? "text-red-300 font-bold" : "text-white/40")}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
