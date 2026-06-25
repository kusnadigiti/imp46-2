# Panduan Konfigurasi MySQL di XAMPP (Versi 8.2+)

Aplikasi ini dilengkapi dengan simulasi backend `server.ts` berbasis Node.js/Express. Berikut adalah langkah-langkah untuk menghubungkan aplikasi secara langsung ke database MySQL nyata pada server lokal XAMPP Anda.

## 1. Persiapan Database MySQL di XAMPP

1. Buka **XAMPP Control Panel**.
2. Klik tombol **Start** pada modul **Apache** dan **MySQL**.
3. Pastikan indikator status modul MySQL berubah menjadi hijau (berjalan pada port `3306` secara default).
4. Klik tombol **Admin** pada baris MySQL, atau buka browser dan ketik `http://localhost/phpmyadmin/`.
5. Buat database baru:
   - Klik tab **Databases**.
   - Masukkan nama database, contoh: `inv_sync_db`.
   - Klik **Create**.

## 2. Struktur Tabel (Skema MySQL)

Jalankan perintah SQL berikut di tab **SQL** pada `phpmyadmin` untuk membuat struktur tabel:

```sql
CREATE TABLE items (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    kode_barang VARCHAR(100) UNIQUE NOT NULL,
    quantity INT DEFAULT 0,
    price DECIMAL(10, 2) DEFAULT 0.00,
    location VARCHAR(255),
    category VARCHAR(100),
    status VARCHAR(50),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE loans (
    id VARCHAR(50) PRIMARY KEY,
    item_id VARCHAR(50),
    item_name VARCHAR(255),
    borrower_name VARCHAR(255),
    quantity INT,
    borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    return_date TIMESTAMP NULL,
    status VARCHAR(50) DEFAULT 'Dipinjam',
    FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE repairs (
    id VARCHAR(50) PRIMARY KEY,
    item_id VARCHAR(50),
    item_name VARCHAR(255),
    description TEXT,
    reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Menunggu',
    FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE activities (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(50),
    item_id VARCHAR(50),
    item_name VARCHAR(255),
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. Konfigurasi Backend (`server.ts`)

Aplikasi ini menggunakan modul `mysql2` untuk koneksi Node.js ke MySQL. Ikuti langkah ini untuk mengaktifkan koneksinya:

1. Buat file `.env` di root folder proyek Anda.
2. Tambahkan kredensial database XAMPP Anda (secara default user `root` tanpa password):

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=inv_sync_db
```

3. Pada file `server.ts`, kita telah menyiapkan koneksi pool (`mysql.createPool`) yang dapat digunakan untuk menggantikan data `in-memory` (array). 

Contoh penggunaan koneksi pool:

```typescript
import mysql from 'mysql2/promise';

// Buat pool koneksi ke MySQL XAMPP
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inv_sync_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Contoh implementasi Endpoint untuk Mengambil Data Barang
app.get('/api/inventory', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM items ORDER BY last_updated DESC');
    res.json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Gagal mengambil data dari database' });
  }
});
```

*(Catatan: `server.ts` yang berjalan di pratinjau AI Studio menggunakan mode "in-memory simulasi" agar aplikasi tetap dapat dicoba tanpa server XAMPP eksternal. Untuk penggunaan nyata, Anda hanya perlu mengganti fungsi-fungsi route `/api/` di `server.ts` dengan query SQL seperti contoh di atas).*
