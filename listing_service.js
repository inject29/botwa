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
            console.log(`[ListingService] ⚠️ Database tidak ditemukan di: ${DB_PATH}`);
            // Resolve null agar bot tidak error fatal, hanya tidak ada caption
            return resolve(null);
        }

        const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error("[ListingService] ❌ Gagal membuka database listing:", err.message);
                return resolve(null);
            }
        });

        // Normalisasi PLU: Hapus leading zeros jika input berupa angka
        // Ini penting karena di database listing, PLU disimpan tanpa leading zeros (misal: "123" bukan "00123")
        let searchPlu = String(plu).trim();
        if (/^\d+$/.test(searchPlu)) {
            searchPlu = String(Number(searchPlu));
        }

        const sql = `SELECT * FROM listings WHERE PLU = ?`;

        db.get(sql, [searchPlu], (err, row) => {
            db.close(); // Tutup koneksi setelah query selesai

            if (err) {
                console.error("[ListingService] ❌ Error saat query PLU:", err.message);
                return resolve(null);
            }

            if (row) {
                // console.log(`[ListingService] ✅ Data ditemukan untuk PLU: ${searchPlu}`);
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
                console.log(`[ListingService] ⚠️ Data tidak ditemukan untuk PLU: ${searchPlu} (Input asli: ${plu})`);
                resolve(null);
            }
        });
    });
}

module.exports = { getListingCaption };