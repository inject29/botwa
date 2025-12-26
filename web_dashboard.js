const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000; // Port untuk akses web (Bisa diganti jika bentrok)

// Path Database (Menggunakan path absolut agar aman)
const BASE_DIR = '/home/ubuntu/botwa';
const DB_LISTING = path.join(BASE_DIR, 'listing.db');
const DB_PRODUCTS = path.join(BASE_DIR, 'products.db');

// Cek apakah database ada (Penting untuk VPS agar tidak error diam-diam)
if (!fs.existsSync(DB_LISTING) || !fs.existsSync(DB_PRODUCTS)) {
    console.error(`⚠️  PERINGATAN: Database tidak ditemukan di folder: ${BASE_DIR}`);
    console.error("    Pastikan path BASE_DIR di kode sesuai dengan lokasi file .db di VPS Anda.");
}

// Middleware
app.use(express.urlencoded({ extended: true }));

// --- CSS Sederhana untuk Tampilan ---
const style = `
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f4f6f8; color: #333; }
        .container { max-width: 1100px; margin: auto; background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 0; }
        a { text-decoration: none; color: #3498db; font-weight: 600; }
        a:hover { text-decoration: underline; }
        .nav { margin-bottom: 20px; padding: 10px; background: #ecf0f1; border-radius: 5px; }
        .nav a { margin-right: 20px; font-size: 16px; color: #2c3e50; }
        .nav a.active { color: #e74c3c; }
        
        /* Form Pencarian */
        .search-box { margin-bottom: 20px; display: flex; gap: 10px; }
        input[type="text"] { padding: 10px; border: 1px solid #ddd; border-radius: 5px; flex: 1; font-size: 16px; }
        button { padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #219150; }

        /* Tabel */
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #3498db; color: white; }
        tr:hover { background-color: #f1f1f1; }
        .empty { text-align: center; color: #7f8c8d; padding: 20px; }
        .badge { padding: 3px 8px; border-radius: 4px; font-size: 12px; color: white; }
        .bg-blue { background: #3498db; }
        .bg-orange { background: #e67e22; }

        /* Pagination */
        .pagination { margin-top: 20px; text-align: center; }
        .pagination a { display: inline-block; padding: 8px 16px; background: #3498db; color: white; border-radius: 4px; margin: 0 5px; transition: 0.3s; }
        .pagination a:hover { background: #2980b9; text-decoration: none; }
        .pagination a.disabled { background: #bdc3c7; pointer-events: none; cursor: not-allowed; }
    </style>
`;

// --- Fungsi Helper Database ---
function queryDB(dbPath, sql, params = []) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(err);
        });
        db.all(sql, params, (err, rows) => {
            db.close();
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

// --- Routes ---

// 1. Halaman Utama
app.get('/', (req, res) => {
    res.send(`
        ${style}
        <div class="container">
            <h1>🤖 Dashboard Bot WhatsApp</h1>
            <div class="nav">
                <a href="/listings">📂 Data Listing (Rak/Shelf)</a>
                <a href="/products">📦 Data Produk (Gambar/Barcode)</a>
            </div>
            <p>Selamat datang di panel admin. Gunakan menu di atas untuk melihat data database bot Anda.</p>
            <div style="padding: 15px; background: #dff9fb; border-left: 5px solid #badc58; border-radius: 4px;">
                <strong>Status System:</strong> Web Server Berjalan Normal 🟢
            </div>
        </div>
    `);
});

// 2. Halaman Listing
app.get('/listings', async (req, res) => {
    const q = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM listings ORDER BY RAK, SHELFING, BARIS LIMIT ? OFFSET ?';
    let params = [limit, offset];
    
    if (q) {
        sql = 'SELECT * FROM listings WHERE "NAMA BARANG" LIKE ? OR PLU LIKE ? LIMIT ? OFFSET ?';
        params = [`%${q}%`, `%${q}%`, limit, offset];
    }

    try {
        const rows = await queryDB(DB_LISTING, sql, params);
        res.send(`
            ${style}
            <div class="container">
                <div class="nav"><a href="/">🏠 Home</a> <a href="/listings" class="active">📂 Listing</a> <a href="/products">📦 Produk</a></div>
                <h2>📂 Data Listing (Rak & Shelf)</h2>
                <form class="search-box" method="GET">
                    <input type="text" name="q" value="${q}" placeholder="Cari Nama Barang atau PLU...">
                    <button type="submit">Cari</button>
                </form>
                <table>
                    <thead><tr><th>PLU</th><th>Nama Barang</th><th>Rak</th><th>Shelf</th><th>Baris</th><th>Retur</th></tr></thead>
                    <tbody>
                        ${rows.length > 0 ? rows.map(r => `
                            <tr><td><b>${r.PLU}</b></td><td>${r['NAMA BARANG']}</td><td><span class="badge bg-blue">${r.RAK}</span></td><td>${r.SHELFING}</td><td>${r.BARIS}</td><td>${r.RETUR}</td></tr>
                        `).join('') : '<tr><td colspan="6" class="empty">Data tidak ditemukan</td></tr>'}
                    </tbody>
                </table>
                <div class="pagination">
                    <a href="/listings?q=${encodeURIComponent(q)}&page=${page - 1}" class="${page <= 1 ? 'disabled' : ''}">❮ Sebelumnya</a>
                    <span>Halaman ${page}</span>
                    <a href="/listings?q=${encodeURIComponent(q)}&page=${page + 1}" class="${rows.length < limit ? 'disabled' : ''}">Selanjutnya ❯</a>
                </div>
            </div>
        `);
    } catch (err) { res.send(`Error Database: ${err.message}`); }
});

// 3. Halaman Produk
app.get('/products', async (req, res) => {
    const q = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM products LIMIT ? OFFSET ?';
    let params = [limit, offset];
    
    if (q) {
        sql = 'SELECT * FROM products WHERE nama LIKE ? OR barcode LIKE ? OR plu LIKE ? LIMIT ? OFFSET ?';
        params = [`%${q}%`, `%${q}%`, `%${q}%`, limit, offset];
    }

    try {
        const rows = await queryDB(DB_PRODUCTS, sql, params);
        res.send(`
            ${style}
            <div class="container">
                <div class="nav"><a href="/">🏠 Home</a> <a href="/listings">📂 Listing</a> <a href="/products" class="active">📦 Produk</a></div>
                <h2>📦 Data Produk (Master)</h2>
                <form class="search-box" method="GET">
                    <input type="text" name="q" value="${q}" placeholder="Cari Nama, Barcode, atau PLU...">
                    <button type="submit">Cari</button>
                </form>
                <table>
                    <thead><tr><th>PLU</th><th>Barcode</th><th>Nama</th><th>Gambar</th></tr></thead>
                    <tbody>
                        ${rows.length > 0 ? rows.map(r => `
                            <tr><td>${r.plu || '-'}</td><td>${r.barcode || '-'}</td><td>${r.nama}</td><td>${r.gambar ? `<a href="${r.gambar}" target="_blank">Lihat 📷</a>` : '-'}</td></tr>
                        `).join('') : '<tr><td colspan="4" class="empty">Data tidak ditemukan</td></tr>'}
                    </tbody>
                </table>
                <div class="pagination">
                    <a href="/products?q=${encodeURIComponent(q)}&page=${page - 1}" class="${page <= 1 ? 'disabled' : ''}">❮ Sebelumnya</a>
                    <span>Halaman ${page}</span>
                    <a href="/products?q=${encodeURIComponent(q)}&page=${page + 1}" class="${rows.length < limit ? 'disabled' : ''}">Selanjutnya ❯</a>
                </div>
            </div>
        `);
    } catch (err) { res.send(`Error Database: ${err.message}`); }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Web Dashboard berjalan di port ${PORT} (Bisa diakses publik)`);
});
