import React, { useState, useEffect, useRef } from 'react';
import { Item, Loan, Repair } from '../types';
import { Printer, Download } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export function Reports() {
  const [activeReport, setActiveReport] = useState<'inventory' | 'loans' | 'repairs'>('inventory');
  
  const [items, setItems] = useState<Item[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [itemsRes, loansRes, repairsRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/loans'),
          fetch('/api/repairs')
        ]);
        
        const itemsData = await itemsRes.json();
        const loansData = await loansRes.json();
        const repairsData = await repairsRes.json();
        
        setItems(itemsData);
        setLoans(loansData);
        setRepairs(repairsData);
      } catch (error) {
        console.error("Failed to fetch reports data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!reportRef.current) return;
    
    setIsGeneratingPDF(true);
    
    setTimeout(async () => {
      try {
        const element = reportRef.current;
        const opt = {
          margin:       10,
          filename:     `Laporan_${activeReport}_${format(new Date(), 'yyyyMMdd')}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: activeReport === 'loans' ? 'landscape' : 'portrait' }
        };

        const generator = (html2pdf as any).default || html2pdf;
        await generator().set(opt).from(element).save();
      } catch (error) {
        console.error("PDF generation failed:", error);
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 100);
  };

  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: idLocale });
  const adminName = "Admin Sistem";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Laporan Sistem</h1>
          <p className="text-slate-500 mt-2">Cetak dan tinjau laporan inventaris, peminjaman, dan perbaikan.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="rounded-md bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {isGeneratingPDF ? 'Memproses...' : 'Unduh PDF'}
          </button>
          <button 
            onClick={handlePrint}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 print:hidden">
        <button
          onClick={() => setActiveReport('inventory')}
          className={`pb-2 text-sm font-medium transition-colors ${activeReport === 'inventory' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Laporan Barang
        </button>
        <button
          onClick={() => setActiveReport('loans')}
          className={`pb-2 text-sm font-medium transition-colors ${activeReport === 'loans' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Laporan Peminjaman
        </button>
        <button
          onClick={() => setActiveReport('repairs')}
          className={`pb-2 text-sm font-medium transition-colors ${activeReport === 'repairs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Laporan Perbaikan
        </button>
      </div>

      <div id="print-report" className={`rounded-xl bg-white overflow-hidden ${isGeneratingPDF ? 'border-none shadow-none' : 'border border-slate-200'} print:border-none print:shadow-none`} ref={reportRef}>
        <div className="p-8">
          <div className={`text-center mb-8 ${isGeneratingPDF ? 'block' : 'hidden print:block'}`}>
            <h2 className="text-2xl font-bold uppercase">Laporan SMKN 46 Jakarta</h2>
            <p className="text-slate-500">
              {activeReport === 'inventory' && 'Laporan Data Inventaris Barang'}
              {activeReport === 'loans' && 'Laporan Riwayat Peminjaman Barang'}
              {activeReport === 'repairs' && 'Laporan Data Perbaikan Barang'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200">
                {activeReport === 'inventory' && (
                  <tr>
                    <th className="px-6 py-3 border-b">Kode Barang</th>
                    <th className="px-6 py-3 border-b">Nama Barang</th>
                    <th className="px-6 py-3 border-b">Kategori</th>
                    <th className="px-6 py-3 border-b text-right">Jumlah</th>
                    <th className="px-6 py-3 border-b text-center">Status</th>
                  </tr>
                )}
                {activeReport === 'loans' && (
                  <tr>
                    <th className="px-6 py-3 border-b">ID Pinjam</th>
                    <th className="px-6 py-3 border-b">Nama Barang</th>
                    <th className="px-6 py-3 border-b">Peminjam</th>
                    <th className="px-6 py-3 border-b text-center">Tgl Pinjam</th>
                    <th className="px-6 py-3 border-b text-center">Tgl Kembali</th>
                    <th className="px-6 py-3 border-b text-right">Status</th>
                  </tr>
                )}
                {activeReport === 'repairs' && (
                  <tr>
                    <th className="px-6 py-3 border-b">ID Tiket</th>
                    <th className="px-6 py-3 border-b">Barang Terkait</th>
                    <th className="px-6 py-3 border-b">Deskripsi Masalah</th>
                    <th className="px-6 py-3 border-b text-center">Tgl Lapor</th>
                    <th className="px-6 py-3 border-b text-right">Status</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-sans">Memuat data...</td>
                  </tr>
                ) : (
                  <>
                    {activeReport === 'inventory' && items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold">{item.kodeBarang}</td>
                        <td className="px-6 py-4 font-sans text-slate-900">{item.name}</td>
                        <td className="px-6 py-4 text-slate-500">{item.category}</td>
                        <td className="px-6 py-4 text-right">{item.quantity}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium font-sans ${
                            item.status === 'Tersedia' ? 'bg-emerald-50 text-emerald-700' :
                            item.status === 'Terbatas' ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {activeReport === 'loans' && loans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-500">LN-{loan.id.toUpperCase()}</td>
                        <td className="px-6 py-4 font-sans text-slate-900">{loan.itemName}</td>
                        <td className="px-6 py-4 font-sans">{loan.borrowerName}</td>
                        <td className="px-6 py-4 text-center">{loan.borrowDate ? format(new Date(loan.borrowDate), 'dd MMM yyyy', { locale: idLocale }) : '-'}</td>
                        <td className="px-6 py-4 text-center">{loan.returnDate ? format(new Date(loan.returnDate), 'dd MMM yyyy', { locale: idLocale }) : '-'}</td>
                        <td className="px-6 py-4 text-right font-sans">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium ${
                            loan.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {activeReport === 'repairs' && repairs.map((repair) => (
                      <tr key={repair.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-500">RP-{repair.id.toUpperCase()}</td>
                        <td className="px-6 py-4 font-sans text-slate-900">{repair.itemName}</td>
                        <td className="px-6 py-4 font-sans text-slate-500">{repair.description}</td>
                        <td className="px-6 py-4 text-center">{repair.reportedDate ? format(new Date(repair.reportedDate), 'dd MMM yyyy', { locale: idLocale }) : '-'}</td>
                        <td className="px-6 py-4 text-right font-sans">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium ${
                            repair.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700' :
                            repair.status === 'Proses' ? 'bg-blue-50 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {repair.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {/* Empty states */}
                    {activeReport === 'inventory' && items.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-sans">Tidak ada data.</td></tr>
                    )}
                    {activeReport === 'loans' && loans.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-sans">Tidak ada data.</td></tr>
                    )}
                    {activeReport === 'repairs' && repairs.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-sans">Tidak ada data.</td></tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-16 flex justify-end">
            <div className="text-center font-sans">
              <p className="text-sm text-slate-600 mb-16">Jakarta, {currentDate}</p>
              <p className="font-semibold text-slate-900 border-b border-slate-900 pb-1 px-4">{adminName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
