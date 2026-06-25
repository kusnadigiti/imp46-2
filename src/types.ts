export interface Item {
  id: string;
  name: string;
  kodeBarang: string;
  quantity: number;
  price: number;
  location?: string;
  category: string;
  lastUpdated: string;
  status: 'Tersedia' | 'Stok Menipis' | 'Habis';
}

export interface Activity {
  id: string;
  type: 'addition' | 'update' | 'removal' | 'loan' | 'repair';
  itemId: string;
  itemName: string;
  timestamp: string;
  details: string;
}

export interface Loan {
  id: string;
  itemId: string;
  itemName: string;
  borrowerName: string;
  quantity: number;
  borrowDate: string;
  returnDate?: string;
  status: 'Dipinjam' | 'Dikembalikan';
}

export interface Repair {
  id: string;
  itemId: string;
  itemName: string;
  description: string;
  reportedDate: string;
  status: 'Menunggu' | 'Proses' | 'Selesai';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff' | 'Guru' | 'Siswa';
  status: 'Aktif' | 'Nonaktif';
  password?: string;
}

export interface ReportSummary {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  totalSKUs: number;
  activeLoans: number;
  pendingRepairs: number;
  categoryDistribution: { name: string; value: number }[];
}
