const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Nama file database yang akan dibuat
const DB_FILE = 'products.db';
// Nama file JSON data Anda
const JSON_FILE = 'barcodesheet(1).json'; // Pastikan nama file ini benar

// --- Memuat Data JSON ---
try {
    const rawData = fs.readFileSync(JSON_FILE, 'utf-8');
    var products = JSON.parse(rawData);
    console.log(`Berhasil memuat ${products.length} entri dari ${JSON_FILE}.`);
} catch (e) {
    console.error(`Gagal memuat atau mengurai file JSON (${JSON_FILE}):`, e.message);
    process.exit(1); // Keluar jika ada masalah file
}

// --- Koneksi Database ---
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Gagal terhubung ke database SQLite:', err.message);
        return;
    }
    console.log(`Berhasil terhubung ke database SQLite: ${DB_FILE}`);
    initDatabase();
});

function initDatabase() {
    // 1. Hapus Tabel Lama (untuk memastikan bersih)
    db.run('DROP TABLE IF EXISTS products', (err) => {
        if (err) {
            console.error('Error saat menghapus tabel lama:', err.message);
            return;
        }
        
        // 2. Buat Tabel Baru
        db.run(`CREATE TABLE products (
            plu TEXT PRIMARY KEY,
            barcode TEXT UNIQUE,
            nama TEXT,
            gambar TEXT
        )`, (err) => {
            if (err) {
                console.error('Error saat membuat tabel:', err.message);
                return;
            }
            console.log('Tabel "products" berhasil dibuat.');
            insertData();
        });
    });
}

function insertData() {
    let insertedCount = 0;
    let skippedCount = 0;

    db.serialize(() => {
        // Mulai Transaksi untuk Insert Data Massal yang Cepat
        db.run('BEGIN TRANSACTION');
        
        // Gunakan INSERT OR IGNORE untuk melewatkan baris yang melanggar constraint UNIQUE (barcode duplikat)
        const stmt = db.prepare('INSERT OR IGNORE INTO products (plu, barcode, nama, gambar) VALUES (?, ?, ?, ?)');
        
        products.forEach(product => {
            const plu = String(product.plu || '').trim();
            const barcode = String(product.barcode || '').trim();
            const nama = product.nama || '';
            const gambar = product.gambar || '';

            // Syarat Utama: PLU tidak boleh kosong karena ini PRIMARY KEY
            if (plu === '') {
                skippedCount++;
                return;
            }

            // Jika Barcode kosong, kita tetapkan ke NULL. 
            // SQLite mengizinkan NULL duplikat di kolom UNIQUE.
            const finalBarcode = (barcode === '') ? null : barcode;

            // Jalankan statement
            stmt.run(plu, finalBarcode, nama, gambar, function(err) {
                if (err) {
                    // Log error hanya jika bukan UNIQUE constraint (yang seharusnya diabaikan oleh INSERT OR IGNORE)
                    if (err.code !== 'SQLITE_CONSTRAINT') {
                        console.error(`Error memasukkan data ${plu}:`, err.message);
                    }
                    // Jika INSERT OR IGNORE berfungsi, kita tidak akan melihat error di sini, 
                    // tetapi kita tetap menghitungnya sebagai dilewati untuk akurasi.
                    skippedCount++;
                } else {
                    insertedCount++;
                }
            });
        });

        stmt.finalize();
        
        // Akhiri Transaksi
        db.run('COMMIT', (err) => {
            if (err) {
                console.error('Error saat COMMIT:', err.message);
            } else {
                console.log('--- Ringkasan Insert Data ---');
                console.log(`✅ Berhasil memasukkan ${insertedCount} baris data ke dalam tabel.`);
                console.log(`⚠️ Melewati ${products.length - insertedCount} baris data (karena PLU kosong, barcode duplikat, atau error lain).`);
            }
            db.close((err) => {
                if (err) {
                    console.error(err.message);
                }
                console.log('Koneksi database ditutup.');
            });
        });
    });
}