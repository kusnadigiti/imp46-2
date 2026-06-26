import express from "express";
import path from "path";
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// --- Types ---
interface Item {
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

interface Activity {
  id: string;
  type: 'addition' | 'update' | 'removal' | 'loan' | 'repair';
  itemId: string;
  itemName: string;
  timestamp: string;
  details: string;
}

interface Loan {
  id: string;
  itemId: string;
  itemName: string;
  borrowerName: string;
  quantity: number;
  borrowDate: string;
  returnDate?: string;
  status: 'Dipinjam' | 'Dikembalikan';
}

interface Repair {
  id: string;
  itemId: string;
  itemName: string;
  description: string;
  reportedDate: string;
  status: 'Menunggu' | 'Proses' | 'Selesai';
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff' | 'Guru' | 'Siswa';
  status: 'Aktif' | 'Nonaktif';
  password?: string;
}

// --- Neon / PostgreSQL Pool ---
let postgresPool: pg.Pool | null = null;

if (process.env.DATABASE_URL) {
  console.log("DATABASE_URL found! Connecting to Neon PostgreSQL...");
  postgresPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
    query_timeout: 5000
  });
  
  // Register error listener to prevent unhandled process crashes on idle client drops
  postgresPool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });
} else {
  console.log("No DATABASE_URL found. Using in-memory fallback.");
}

// --- In-Memory Database Fallbacks ---
let items: Item[] = [
  { id: '1', name: 'MacBook Pro M2 14"', kodeBarang: 'PRD-9012', quantity: 82, price: 1999.99, location: 'Rak A1', category: 'Elektronik', status: 'Tersedia', lastUpdated: new Date().toISOString() },
  { id: '2', name: 'Dell UltraSharp 27"', kodeBarang: 'PRD-4481', quantity: 12, price: 499.99, location: 'Rak B2', category: 'Monitor', status: 'Stok Menipis', lastUpdated: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', name: 'Logitech MX Keys', kodeBarang: 'PRD-2209', quantity: 0, price: 119.99, location: 'Rak C3', category: 'Aksesoris', status: 'Habis', lastUpdated: new Date(Date.now() - 172800000).toISOString() },
  { id: '4', name: 'Sony WH-1000XM5', kodeBarang: 'PRD-7733', quantity: 45, price: 349.99, location: 'Rak A2', category: 'Audio', status: 'Tersedia', lastUpdated: new Date(Date.now() - 3600000).toISOString() },
  { id: '5', name: 'Kabel HDMI 2.1 2m', kodeBarang: 'ACC-1102', quantity: 150, price: 15.99, location: 'Rak C1', category: 'Aksesoris', status: 'Tersedia', lastUpdated: new Date(Date.now() - 7200000).toISOString() },
];

let loans: Loan[] = [
  { id: 'L1', itemId: '1', itemName: 'MacBook Pro M2 14"', borrowerName: 'Budi Santoso', quantity: 1, borrowDate: new Date(Date.now() - 259200000).toISOString(), status: 'Dipinjam' },
  { id: 'L2', itemId: '4', itemName: 'Sony WH-1000XM5', borrowerName: 'Siti Aminah', quantity: 2, borrowDate: new Date(Date.now() - 432000000).toISOString(), returnDate: new Date(Date.now() - 86400000).toISOString(), status: 'Dikembalikan' },
];

let repairs: Repair[] = [
  { id: 'R1', itemId: '2', itemName: 'Dell UltraSharp 27"', description: 'Layar bergaris horizontal', reportedDate: new Date(Date.now() - 172800000).toISOString(), status: 'Proses' },
  { id: 'R2', itemId: '3', itemName: 'Logitech MX Keys', description: 'Beberapa tombol tidak merespon', reportedDate: new Date(Date.now() - 86400000).toISOString(), status: 'Menunggu' },
];

let activities: Activity[] = [
  { id: '101', type: 'addition', itemId: '1', itemName: 'MacBook Pro M2 14"', timestamp: new Date(Date.now() - 86400000).toISOString(), details: 'Menambahkan 82 unit ke stok' },
  { id: '102', type: 'repair', itemId: '2', itemName: 'Dell UltraSharp 27"', timestamp: new Date(Date.now() - 172800000).toISOString(), details: 'Dikirim untuk perbaikan layar' },
  { id: '103', type: 'loan', itemId: '1', itemName: 'MacBook Pro M2 14"', timestamp: new Date(Date.now() - 259200000).toISOString(), details: 'Dipinjam oleh Budi Santoso (1 unit)' },
];

let users: User[] = [
  { id: 'U1', name: 'Admin Sistem', email: 'admin@smkn46jkt.sch.id', role: 'Admin', status: 'Aktif' },
  { id: 'U2', name: 'Budi Santoso', email: 'budi@guru.smkn46jkt.sch.id', role: 'Guru', status: 'Aktif' },
  { id: 'U3', name: 'Siti Aminah', email: 'siti@siswa.smkn46jkt.sch.id', role: 'Siswa', status: 'Aktif' },
  { id: 'U4', name: 'Ahmad Fauzi', email: 'ahmad@staff.smkn46jkt.sch.id', role: 'Staff', status: 'Nonaktif' },
];

const updateItemStatus = (quantity: number): Item['status'] => {
  if (quantity === 0) return 'Habis';
  if (quantity < 15) return 'Stok Menipis';
  return 'Tersedia';
};

const addActivity = async (type: Activity['type'], itemId: string, itemName: string, details: string) => {
  if (postgresPool) {
    try {
      const id = Math.random().toString(36).substring(7);
      await postgresPool.query(
        'INSERT INTO activities (id, type, item_id, item_name, details) VALUES ($1, $2, $3, $4, $5)',
        [id, type, itemId, itemName, details]
      );
    } catch (err) {
      console.error("Failed to insert activity into PostgreSQL:", err);
    }
  } else {
    activities.unshift({
      id: Math.random().toString(36).substring(7),
      type,
      itemId,
      itemName,
      timestamp: new Date().toISOString(),
      details
    });
    if (activities.length > 50) activities.pop();
  }
};

async function bootstrapDatabase() {
  if (!postgresPool) return;
  try {
    const client = await postgresPool.connect();
    console.log("Connected to Neon PostgreSQL! Bootstrapping tables...");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          kode_barang VARCHAR(100) UNIQUE NOT NULL,
          quantity INT DEFAULT 0,
          price DECIMAL(12, 2) DEFAULT 0.00,
          location VARCHAR(255),
          category VARCHAR(100),
          status VARCHAR(50),
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS loans (
          id VARCHAR(50) PRIMARY KEY,
          item_id VARCHAR(50),
          item_name VARCHAR(255),
          borrower_name VARCHAR(255),
          quantity INT,
          borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          return_date TIMESTAMP NULL,
          status VARCHAR(50) DEFAULT 'Dipinjam'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS repairs (
          id VARCHAR(50) PRIMARY KEY,
          item_id VARCHAR(50),
          item_name VARCHAR(255),
          description TEXT,
          reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(50) DEFAULT 'Menunggu'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
          id VARCHAR(50) PRIMARY KEY,
          type VARCHAR(50),
          item_id VARCHAR(50),
          item_name VARCHAR(255),
          details TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          role VARCHAR(50),
          status VARCHAR(50) DEFAULT 'Aktif',
          password VARCHAR(255)
      );
    `);

    const userCountRes = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCountRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO users (id, name, email, role, status) VALUES
        ('U1', 'Admin Sistem', 'admin@smkn46jkt.sch.id', 'Admin', 'Aktif'),
        ('U2', 'Budi Santoso', 'budi@guru.smkn46jkt.sch.id', 'Guru', 'Aktif'),
        ('U3', 'Siti Aminah', 'siti@siswa.smkn46jkt.sch.id', 'Siswa', 'Aktif'),
        ('U4', 'Ahmad Fauzi', 'ahmad@staff.smkn46jkt.sch.id', 'Staff', 'Nonaktif')
      `);
    }

    const itemCountRes = await client.query('SELECT COUNT(*) FROM items');
    if (parseInt(itemCountRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO items (id, name, kode_barang, quantity, price, location, category, status) VALUES
        ('1', 'MacBook Pro M2 14"', 'PRD-9012', 82, 1999.99, 'Rak A1', 'Elektronik', 'Tersedia'),
        ('2', 'Dell UltraSharp 27"', 'PRD-4481', 12, 499.99, 'Rak B2', 'Monitor', 'Stok Menipis'),
        ('3', 'Logitech MX Keys', 'PRD-2209', 0, 119.99, 'Rak C3', 'Aksesoris', 'Habis'),
        ('4', 'Sony WH-1000XM5', 'PRD-7733', 45, 349.99, 'Rak A2', 'Audio', 'Tersedia'),
        ('5', 'Kabel HDMI 2.1 2m', 'ACC-1102', 150, 15.99, 'Rak C1', 'Aksesoris', 'Tersedia')
      `);
    }

    client.release();
    console.log("PostgreSQL database bootstrap complete!");
  } catch (err) {
    console.error("Database bootstrap failed:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Vercel pre-parses the body for Serverless functions.
  // We need to skip express.json() if the body is already an object.
  app.use((req: any, res: any, next: any) => {
    if (req.body && typeof req.body === 'object') {
      req._body = true; // Tell body-parser it's already parsed
    }
    next();
  });
  app.use(express.json());

  // Bootstrap the database before handling requests
  try {
    await bootstrapDatabase();
  } catch(err) {
    console.error("Database bootstrap failed:", err);
  }

  // --- API Routes (Database Status Check) ---
  app.get('/api/db-status', async (req, res) => {
    if (postgresPool) {
      try {
        const client = await postgresPool.connect();
        await client.query('SELECT 1');
        client.release();
        res.json({ connected: true, isFallback: false, type: 'Neon PostgreSQL' });
      } catch (err: any) {
        res.json({ connected: false, isFallback: true, type: `In-Memory Fallback (Koneksi Gagal: ${err.message})` });
      }
    } else {
      res.json({ connected: false, isFallback: true, type: 'In-Memory Fallback (DATABASE_URL Belum Dikonfigurasi)' });
    }
  });

  // --- API Routes (Users) ---
  app.get('/api/users', async (req, res) => {
    if (postgresPool) {
      try {
        const { rows } = await postgresPool.query('SELECT id, name, email, role, status, password FROM users ORDER BY id ASC');
        res.json(rows);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.json(users);
    }
  });

  app.post('/api/users', async (req, res) => {
    if (postgresPool) {
      try {
        const { name, email, role, status, password } = req.body;
        const id = `U${Date.now()}`;
        const { rows } = await postgresPool.query(
          'INSERT INTO users (id, name, email, role, status, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [id, name, email, role, status, password || null]
        );
        res.status(201).json(rows[0]);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      const newUser: User = {
        ...req.body,
        id: `U${Date.now()}`
      };
      users.push(newUser);
      res.status(201).json(newUser);
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    if (postgresPool) {
      try {
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;
        for (const [key, val] of Object.entries(req.body)) {
          fields.push(`${key} = $${i}`);
          values.push(val);
          i++;
        }
        values.push(id);
        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;
        const { rows } = await postgresPool.query(query, values);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      const index = users.findIndex(u => u.id === id);
      if (index === -1) return res.status(404).json({ error: 'User not found' });
      
      users[index] = { ...users[index], ...req.body };
      res.json(users[index]);
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    if (postgresPool) {
      try {
        await postgresPool.query('DELETE FROM users WHERE id = $1', [id]);
        res.status(204).send();
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      users = users.filter(u => u.id !== id);
      res.status(204).send();
    }
  });

  // --- API Routes (Inventaris) ---
  app.get('/api/inventory', async (req, res) => {
    if (postgresPool) {
      try {
        const { rows } = await postgresPool.query('SELECT id, name, kode_barang as "kodeBarang", quantity, price, location, category, status FROM items ORDER BY id DESC');
        res.json(rows);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.json(items);
    }
  });

  app.post('/api/inventory', async (req, res) => {
    if (postgresPool) {
      try {
        const { name, kodeBarang, quantity, price, location, category } = req.body;
        const id = Math.random().toString(36).substring(7);
        const status = updateItemStatus(quantity);
        const { rows } = await postgresPool.query(
          'INSERT INTO items (id, name, kode_barang, quantity, price, location, category, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, kode_barang as "kodeBarang", quantity, price, location, category, status',
          [id, name, kodeBarang, quantity, price, location, category, status]
        );
        await addActivity('addition', id, name, `Menambahkan ${quantity} unit ke stok`);
        res.status(201).json(rows[0]);
      } catch (err: any) {
        if (err.code === '23505') {
          return res.status(400).json({ error: `Kode Barang "${req.body.kodeBarang}" sudah terdaftar dalam sistem. Silakan gunakan Kode Barang lainnya.` });
        }
        res.status(500).json({ error: err.message });
      }
    } else {
      const newItem: Item = {
        ...req.body,
        id: Math.random().toString(36).substring(7),
        lastUpdated: new Date().toISOString(),
        status: updateItemStatus(req.body.quantity)
      };
      items.push(newItem);
      addActivity('addition', newItem.id, newItem.name, `Menambahkan ${newItem.quantity} unit ke stok`);
      res.status(201).json(newItem);
    }
  });

  app.put('/api/inventory/:id', async (req, res) => {
    const { id } = req.params;
    if (postgresPool) {
      try {
        const { name, kodeBarang, quantity, price, location, category } = req.body;
        const status = updateItemStatus(quantity);
        
        // Get old qty for activity log
        const oldRes = await postgresPool.query('SELECT quantity, name FROM items WHERE id = $1', [id]);
        if (oldRes.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
        const oldQuantity = oldRes.rows[0].quantity;

        const { rows } = await postgresPool.query(
          'UPDATE items SET name = $1, kode_barang = $2, quantity = $3, price = $4, location = $5, category = $6, status = $7 WHERE id = $8 RETURNING id, name, kode_barang as "kodeBarang", quantity, price, location, category, status',
          [name, kodeBarang, quantity, price, location, category, status, id]
        );

        if (quantity !== undefined && oldQuantity !== quantity) {
          const diff = quantity - oldQuantity;
          await addActivity('update', id, name, `Stok ${diff > 0 ? 'bertambah' : 'berkurang'} ${Math.abs(diff)} unit`);
        }

        res.json(rows[0]);
      } catch (err: any) {
        if (err.code === '23505') {
          return res.status(400).json({ error: `Kode Barang "${req.body.kodeBarang}" sudah digunakan oleh barang lain. Silakan gunakan Kode Barang yang berbeda.` });
        }
        res.status(500).json({ error: err.message });
      }
    } else {
      const index = items.findIndex(i => i.id === id);
      if (index === -1) return res.status(404).json({ error: 'Item not found' });
      
      const oldQuantity = items[index].quantity;
      const newQuantity = req.body.quantity;
      
      items[index] = {
        ...items[index],
        ...req.body,
        lastUpdated: new Date().toISOString(),
        status: updateItemStatus(newQuantity !== undefined ? newQuantity : items[index].quantity)
      };

      if (newQuantity !== undefined && oldQuantity !== newQuantity) {
        const diff = newQuantity - oldQuantity;
        addActivity('update', id, items[index].name, `Stok ${diff > 0 ? 'bertambah' : 'berkurang'} ${Math.abs(diff)} unit`);
      }

      res.json(items[index]);
    }
  });

  app.delete('/api/inventory/:id', async (req, res) => {
    const { id } = req.params;
    if (postgresPool) {
      try {
        const oldRes = await postgresPool.query('SELECT name FROM items WHERE id = $1', [id]);
        if (oldRes.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
        const name = oldRes.rows[0].name;

        await postgresPool.query('DELETE FROM items WHERE id = $1', [id]);
        await addActivity('removal', id, name, 'Barang dihapus dari inventaris');
        res.status(204).send();
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      const index = items.findIndex(i => i.id === id);
      if (index === -1) return res.status(404).json({ error: 'Item not found' });
      const item = items[index];
      items = items.filter(i => i.id !== id);
      addActivity('removal', id, item.name, 'Barang dihapus dari inventaris');
      res.status(204).send();
    }
  });

  // --- API Routes (Peminjaman) ---
  app.get('/api/loans', async (req, res) => {
    if (postgresPool) {
      try {
        const { rows } = await postgresPool.query('SELECT id, item_id as "itemId", item_name as "itemName", borrower_name as "borrowerName", quantity, borrow_date as "borrowDate", return_date as "returnDate", status FROM loans ORDER BY borrow_date DESC');
        res.json(rows);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.json(loans);
    }
  });

  app.post('/api/loans', async (req, res) => {
    const { itemId, borrowerName, quantity } = req.body;
    if (postgresPool) {
      try {
        const itemRes = await postgresPool.query('SELECT name, quantity FROM items WHERE id = $1', [itemId]);
        if (itemRes.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
        const item = itemRes.rows[0];

        if (item.quantity < quantity) {
          return res.status(400).json({ error: 'Stok tidak mencukupi' });
        }

        const newQty = item.quantity - quantity;
        const newStatus = updateItemStatus(newQty);
        await postgresPool.query('UPDATE items SET quantity = $1, status = $2 WHERE id = $3', [newQty, newStatus, itemId]);

        const id = Math.random().toString(36).substring(7);
        const { rows } = await postgresPool.query(
          'INSERT INTO loans (id, item_id, item_name, borrower_name, quantity, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, item_id as "itemId", item_name as "itemName", borrower_name as "borrowerName", quantity, borrow_date as "borrowDate", return_date as "returnDate", status',
          [id, itemId, item.name, borrowerName, quantity, 'Dipinjam']
        );
        await addActivity('loan', itemId, item.name, `Dipinjam oleh ${borrowerName} (${quantity} unit)`);
        res.status(201).json(rows[0]);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      const item = items.find(i => i.id === itemId);
      if (!item) return res.status(404).json({ error: 'Item not found' });

      if (item.quantity < quantity) {
        return res.status(400).json({ error: 'Stok tidak mencukupi' });
      }

      item.quantity -= quantity;
      item.status = updateItemStatus(item.quantity);

      const newLoan: Loan = {
        id: Math.random().toString(36).substring(7),
        itemId,
        itemName: item.name,
        borrowerName,
        quantity,
        borrowDate: new Date().toISOString(),
        status: 'Dipinjam'
      };
      loans.push(newLoan);
      addActivity('loan', itemId, item.name, `Dipinjam oleh ${borrowerName} (${quantity} unit)`);
      res.status(201).json(newLoan);
    }
  });

  app.put('/api/loans/:id/return', async (req, res) => {
    const { id } = req.params;
    if (postgresPool) {
      try {
        const loanRes = await postgresPool.query('SELECT item_id, item_name, quantity, status, borrower_name FROM loans WHERE id = $1', [id]);
        if (loanRes.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });
        const loan = loanRes.rows[0];
        if (loan.status === 'Dikembalikan') return res.status(400).json({ error: 'Loan already returned' });

        const returnDate = new Date().toISOString();
        const { rows } = await postgresPool.query(
          'UPDATE loans SET status = $1, return_date = $2 WHERE id = $3 RETURNING id, item_id as "itemId", item_name as "itemName", borrower_name as "borrowerName", quantity, borrow_date as "borrowDate", return_date as "returnDate", status',
          ['Dikembalikan', returnDate, id]
        );

        // Add stock back
        const itemRes = await postgresPool.query('SELECT quantity FROM items WHERE id = $1', [loan.item_id]);
        if (itemRes.rows.length > 0) {
          const newQty = itemRes.rows[0].quantity + loan.quantity;
          const newStatus = updateItemStatus(newQty);
          await postgresPool.query('UPDATE items SET quantity = $1, status = $2 WHERE id = $3', [newQty, newStatus, loan.item_id]);
        }

        await addActivity('loan', loan.item_id, loan.item_name, `Dikembalikan oleh ${loan.borrower_name} (${loan.quantity} unit)`);
        res.json(rows[0]);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      const loan = loans.find(l => l.id === id);
      if (!loan || loan.status === 'Dikembalikan') return res.status(404).json({ error: 'Loan not found or already returned' });

      loan.status = 'Dikembalikan';
      loan.returnDate = new Date().toISOString();

      const item = items.find(i => i.id === loan.itemId);
      if (item) {
        item.quantity += loan.quantity;
        item.status = updateItemStatus(item.quantity);
      }

      addActivity('loan', loan.itemId, loan.itemName, `Dikembalikan oleh ${loan.borrowerName} (${loan.quantity} unit)`);
      res.json(loan);
    }
  });

  app.delete('/api/loans/:id', async (req, res) => {
    const { id } = req.params;
    if (postgresPool) {
      try {
        const loanRes = await postgresPool.query('SELECT item_id, item_name, quantity, status FROM loans WHERE id = $1', [id]);
        if (loanRes.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });
        const loan = loanRes.rows[0];

        if (loan.status === 'Dipinjam') {
          const itemRes = await postgresPool.query('SELECT quantity FROM items WHERE id = $1', [loan.item_id]);
          if (itemRes.rows.length > 0) {
            const newQty = itemRes.rows[0].quantity + loan.quantity;
            const newStatus = updateItemStatus(newQty);
            await postgresPool.query('UPDATE items SET quantity = $1, status = $2 WHERE id = $3', [newQty, newStatus, loan.item_id]);
          }
        }

        await postgresPool.query('DELETE FROM loans WHERE id = $1', [id]);
        await addActivity('removal', id, loan.item_name, 'Riwayat peminjaman dihapus');
        res.status(204).send();
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      const index = loans.findIndex(l => l.id === id);
      if (index === -1) return res.status(404).json({ error: 'Loan not found' });
      const loan = loans[index];
      
      if (loan.status === 'Dipinjam') {
        const item = items.find(i => i.id === loan.itemId);
        if (item) {
          item.quantity += loan.quantity;
          item.status = updateItemStatus(item.quantity);
        }
      }

      loans = loans.filter(l => l.id !== id);
      addActivity('removal', id, loan.itemName, 'Riwayat peminjaman dihapus');
      res.status(204).send();
    }
  });

  // --- API Routes (Perbaikan) ---
  app.get('/api/repairs', async (req, res) => {
    if (postgresPool) {
      try {
        const { rows } = await postgresPool.query('SELECT id, item_id as "itemId", item_name as "itemName", description, reported_date as "reportedDate", status FROM repairs ORDER BY reported_date DESC');
        res.json(rows);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.json(repairs);
    }
  });

  app.post('/api/repairs', async (req, res) => {
    const { itemId, description } = req.body;
    if (postgresPool) {
      try {
        const itemRes = await postgresPool.query('SELECT name FROM items WHERE id = $1', [itemId]);
        if (itemRes.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
        const item = itemRes.rows[0];

        const id = Math.random().toString(36).substring(7);
        const { rows } = await postgresPool.query(
          'INSERT INTO repairs (id, item_id, item_name, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, item_id as "itemId", item_name as "itemName", description, reported_date as "reportedDate", status',
          [id, itemId, item.name, description, 'Menunggu']
        );
        await addActivity('repair', itemId, item.name, `Dilaporkan untuk perbaikan: ${description}`);
        res.status(201).json(rows[0]);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      const item = items.find(i => i.id === itemId);
      if (!item) return res.status(404).json({ error: 'Item not found' });

      const newRepair: Repair = {
        id: Math.random().toString(36).substring(7),
        itemId,
        itemName: item.name,
        description,
        reportedDate: new Date().toISOString(),
        status: 'Menunggu'
      };
      repairs.push(newRepair);
      addActivity('repair', itemId, item.name, `Dilaporkan untuk perbaikan: ${description}`);
      res.status(201).json(newRepair);
    }
  });

  app.put('/api/repairs/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (postgresPool) {
      try {
        const { rows } = await postgresPool.query(
          'UPDATE repairs SET status = $1 WHERE id = $2 RETURNING id, item_id as "itemId", item_name as "itemName", description, reported_date as "reportedDate", status',
          [status, id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Repair not found' });
        await addActivity('repair', rows[0].itemId, rows[0].itemName, `Status perbaikan diubah menjadi: ${status}`);
        res.json(rows[0]);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      const repair = repairs.find(r => r.id === id);
      if (!repair) return res.status(404).json({ error: 'Repair not found' });

      repair.status = status;
      addActivity('repair', repair.itemId, repair.itemName, `Status perbaikan diubah menjadi: ${status}`);
      res.json(repair);
    }
  });

  app.delete('/api/repairs/:id', async (req, res) => {
    const { id } = req.params;
    if (postgresPool) {
      try {
        const repairRes = await postgresPool.query('SELECT item_name FROM repairs WHERE id = $1', [id]);
        if (repairRes.rows.length === 0) return res.status(404).json({ error: 'Repair not found' });
        const repair = repairRes.rows[0];

        await postgresPool.query('DELETE FROM repairs WHERE id = $1', [id]);
        await addActivity('removal', id, repair.item_name, 'Riwayat perbaikan dihapus');
        res.status(204).send();
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      const index = repairs.findIndex(r => r.id === id);
      if (index === -1) return res.status(404).json({ error: 'Repair not found' });
      const repair = repairs[index];

      repairs = repairs.filter(r => r.id !== id);
      addActivity('removal', id, repair.itemName, 'Riwayat perbaikan dihapus');
      res.status(204).send();
    }
  });

  // --- API Routes (Laporan) ---
  app.get('/api/reports/summary', async (req, res) => {
    if (postgresPool) {
      try {
        const itemsRes = await postgresPool.query('SELECT quantity, price, status, category FROM items');
        const loansRes = await postgresPool.query('SELECT COUNT(*) FROM loans WHERE status = \'Dipinjam\'');
        const repairsRes = await postgresPool.query('SELECT COUNT(*) FROM repairs WHERE status != \'Selesai\'');

        const itemsRows = itemsRes.rows;
        const totalItems = itemsRows.reduce((sum: number, item: any) => sum + item.quantity, 0);
        const totalValue = itemsRows.reduce((sum: number, item: any) => sum + (item.quantity * parseFloat(item.price)), 0);
        const lowStockCount = itemsRows.filter((i: any) => i.status === 'Stok Menipis' || i.status === 'Habis').length;
        
        const activeLoans = parseInt(loansRes.rows[0].count, 10);
        const pendingRepairs = parseInt(repairsRes.rows[0].count, 10);

        const categoryDistributionMap = itemsRows.reduce((acc: any, item: any) => {
          acc[item.category] = (acc[item.category] || 0) + item.quantity;
          return acc;
        }, {} as Record<string, number>);

        res.json({
          totalItems,
          totalValue,
          lowStockCount,
          totalSKUs: itemsRows.length,
          activeLoans,
          pendingRepairs,
          categoryDistribution: Object.entries(categoryDistributionMap).map(([name, value]) => ({ name, value }))
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const lowStockCount = items.filter(i => i.status === 'Stok Menipis' || i.status === 'Habis').length;
      
      const activeLoans = loans.filter(l => l.status === 'Dipinjam').length;
      const pendingRepairs = repairs.filter(r => r.status !== 'Selesai').length;

      const categoryDistribution = items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        totalItems,
        totalValue,
        lowStockCount,
        totalSKUs: items.length,
        activeLoans,
        pendingRepairs,
        categoryDistribution: Object.entries(categoryDistribution).map(([name, value]) => ({ name, value }))
      });
    }
  });

  app.get('/api/activities', async (req, res) => {
    if (postgresPool) {
      try {
        const { rows } = await postgresPool.query('SELECT id, type, item_id as "itemId", item_name as "itemName", details, timestamp FROM activities ORDER BY timestamp DESC LIMIT 10');
        res.json(rows);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.json(activities.slice(0, 10)); // return top 10
    }
  });

  // --- Vite Middleware for Development ---
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();
export default async function (req: any, res: any) {
  const app = await appPromise;
  app(req, res);
}
