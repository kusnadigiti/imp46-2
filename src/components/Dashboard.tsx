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
    return <div className="p-8 text-slate-500 flex items-center justify-center h-full">Memuat dasbor...</div>;
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
        <div className="col-span-1 lg:col-span-2 rounded-xl border border-slate-200 bg-white flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h3 className="text-sm font-bold uppercase tracking-tight">Inventaris Berdasarkan Kategori</h3>
          </div>
          <div className="h-80 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.categoryDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }}
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
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold uppercase tracking-tight mb-4">Distribusi Status Barang</h3>
            <div className="flex h-3 w-full gap-1 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: '65%' }}></div>
              <div className="h-full bg-amber-400" style={{ width: '25%' }}></div>
              <div className="h-full bg-red-400" style={{ width: '10%' }}></div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Tersedia Normal</span>
                <span className="font-mono">65%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Peminjaman Berjalan</span>
                <span className="font-mono">25%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 text-red-500 font-bold">Rusak / Perbaikan</span>
                <span className="font-mono">10%</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-900 p-6 text-white flex-1 flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Log Aktivitas Real-time</h3>
            <div className="mt-6 flex items-end gap-1 h-12">
              {[20, 40, 60, 80, 100, 70, 50, 90, 30].map((opacity, i) => (
                <div key={i} className={`w-2 bg-blue-500 opacity-${opacity} h-${Math.max(4, Math.floor(opacity / 8))}`}></div>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-slate-400">Sinkronisasi data langsung via WebSocket/API Go & MySQL.</p>
            
            <div className="mt-6 flex-1 overflow-y-auto space-y-3">
              {activities.slice(0, 3).map((activity) => (
                <div key={activity.id} className="text-xs">
                  <div className="text-slate-300 font-medium truncate">{activity.itemName}</div>
                  <div className="text-[10px] text-slate-500">{activity.details}</div>
                  <div className="text-[9px] text-slate-600 mt-0.5">{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: idLocale })}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, alert }: { title: string, value: string, subtitle?: string, alert?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
      <p className={clsx("mt-1 text-3xl font-light font-mono", alert ? "text-red-500" : "")}>{value}</p>
      {subtitle && (
        <div className={clsx("mt-2 text-[10px]", alert ? "text-red-400 font-bold" : "text-slate-400")}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
