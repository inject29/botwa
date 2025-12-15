const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const sqlite3 = require('sqlite3').verbose();

// --- Konfigurasi Database SQLite ---
const DB_FILE = 'products.db';
const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('❌ Gagal terhubung ke database SQLite:', err.message);
        process.exit(1); 
    }
    console.log('✅ Berhasil terhubung ke database produk (SQLite).');
});

/**
 * Fungsi untuk mencari produk dari database SQLite.
 * @param {string} query - Barcode atau PLU yang dicari.
 */
function getProductDetails(query) {
    // Pastikan input di-trim untuk menghilangkan spasi di awal/akhir
    const cleanedQuery = String(query).trim(); 
    
    // Query SQL mencari berdasarkan barcode ATAU plu
    const sql = `SELECT plu, barcode, nama, gambar FROM products 
                 WHERE barcode = ? OR plu = ?`;

    return new Promise((resolve, reject) => {
        db.get(sql, [cleanedQuery, cleanedQuery], (err, row) => {
            if (err) {
                console.error('Error saat mencari di database:', err.message);
                return reject(err);
            }
            resolve(row || null); 
        });
    });
}

// --- Logik Bot Baileys ---

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // Tangani QR Code
        if (qr) {
            console.log('\n===========================================');
            console.log('Silakan scan QR Code di bawah ini untuk menghubungkan bot:');
            qrcode.generate(qr, { small: true });
            console.log('===========================================\n');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Sambungan ditutup. Mencoba sambung semula:', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp(); 
            } else {
                console.log('Sesi keluar, hapus folder baileys_auth_info untuk memulai sesi baru.');
            }
        } else if (connection === 'open') {
            console.log('✅ Bot WhatsApp telah disambungkan dan siap menerima pesan!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return; 

        const text = msg.message.extendedTextMessage?.text || msg.message.conversation || '';
        const jid = msg.key.remoteJid; 

        if (!text || jid.endsWith('@s.whatsapp.net') === false) return;
        
        // LOG DIAGNOSTIK: Pesan Diterima
        console.log(`Pesan diterima dari ${jid}: "${text}"`);
        
        // Logika Pencarian Database
        try {
            // LOG DIAGNOSTIK: Mulai Pencarian
            console.log('Mulai pencarian DB...');
            
            const product = await getProductDetails(text);

            // LOG DIAGNOSTIK: Hasil Pencarian
            console.log('Pencarian DB selesai. Hasil:', product ? 'DITEMUKAN' : 'TIDAK DITEMUKAN');


            if (product) {
                const productName = product.nama || `(Nama produk tidak tersedia untuk PLU: ${product.plu})`;
                const productImage = product.gambar;
                const barcode = product.barcode;
                const plu = product.plu;

                let response = `✅ *Produk Ditemui*\n\n`;
                response += `*Nama:* ${productName}\n`;
                response += `*Barcode:* ${barcode}\n`;
                response += `*PLU:* ${plu}\n`;
                response += `*Imej:* ${productImage}`;
                
                await sock.sendMessage(jid, { text: response });
                
                if (productImage) {
                    try {
                        await sock.sendMessage(jid, { 
                            image: { url: productImage }, 
                            caption: productName 
                        });
                    } catch (e) {
                        console.error('Gagal menghantar imej:', e.message);
                        await sock.sendMessage(jid, { text: '⚠️ Gagal memuatkan gambar produk. Mungkin URL gambar tidak valid.' });
                    }
                }
            } else {
                await sock.sendMessage(jid, { text: `Produk dengan barcode/PLU "${text}" tidak ditemui dalam pangkalan data. Sila cuba lagi.` });
            }
        } catch (error) {
            console.error('❌ Kesalahan dalam pemprosesan mesej (Server/DB):', error.message);
            await sock.sendMessage(jid, { text: `⚠️ Maaf, berlaku kesalahan server semasa mencari data. Sila cuba sebentar lagi.` });
        }
    });
}

connectToWhatsApp();