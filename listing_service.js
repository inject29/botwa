const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Path ke database listing.db (Pastikan path ini benar dan sama dengan script Python)
const DB_PATH = '/home/oem/Documents/bail/listing.db';

/**
 * Mengambil caption lengkap (Nama, Rak, Shelf, Baris, Retur) berdasarkan PLU.
 * @param {string|number} plu 
 * @returns {Promise<string|null>} Caption string atau null jika tidak ditemukan.
 */
function getListingCaption(plu) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(DB_PATH)) {
            // console.error(`❌ Database tidak ditemukan di: ${DB_PATH}`);
            // Resolve null agar bot tidak error fatal, hanya tidak ada caption
            return resolve(null);
        }

        const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error("❌ Gagal membuka database listing:", err.message);
                return resolve(null);
            }
        });

        // Query mencari PLU
        const sql = `SELECT * FROM listings WHERE PLU = ?`;
        const pluString = String(plu).trim();

        db.get(sql, [pluString], (err, row) => {
            db.close(); // Tutup koneksi setelah query selesai

            if (err) {
                console.error("❌ Error saat query PLU:", err.message);
                return resolve(null);
            }

            if (row) {
                // Ambil data kolom (sesuai nama kolom di Python script)
                const nama = row['NAMA BARANG'];
                const rak = row['RAK'];
                const shelf = row['SHELFING'];
                const baris = row['BARIS'];
                const retur = row['RETUR'];

                // Format Caption
                const caption = `${nama}\nRak: ${rak} | Shelf: ${shelf} | Baris: ${baris}\nRetur: ${retur}`;
                resolve(caption);
            } else {
                // Data tidak ditemukan
                resolve(null);
            }
        });
    });
}

module.exports = { getListingCaption };