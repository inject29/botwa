const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bwipjs = require('bwip-js');
const sharp = require('sharp');
const axios = require('axios');

// --- Konfigurasi Database SQLite ---
const DB_FILE = 'products.db';
const AUTH_INFO_PATH = 'baileys_auth_info';

const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('❌ Gagal terhubung ke database SQLite:', err.message);
        process.exit(1);
    }
    console.log('✅ Berhasil terhubung ke database produk (SQLite).');
});

function getProductDetails(query) {
    const cleanedQuery = String(query).trim();
    const sql = `SELECT plu, barcode, nama, gambar FROM products WHERE barcode = ? OR plu = ?`;

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

async function createProductImage(product, queryText, qty = null) {
    try {
        const { nama: productName, gambar: productImage, barcode, plu } = product;

        // 1. Fetch Product Image
        let productImageBuffer;
        if (productImage) {
            try {
                const response = await axios.get(productImage, { responseType: 'arraybuffer' });
                productImageBuffer = Buffer.from(response.data);
            } catch (error) {
                console.error('Gagal mengunduh gambar produk:', error.message);
                // Fallback to a placeholder if image download fails
                productImageBuffer = await sharp({
                    create: {
                        width: 400,
                        height: 300,
                        channels: 4,
                        background: { r: 200, g: 200, b: 200, alpha: 1 }
                    }
                }).png().toBuffer();
            }
        } else {
            // Create a placeholder if no image URL
            productImageBuffer = await sharp({
                create: {
                    width: 400,
                    height: 300,
                    channels: 4,
                    background: { r: 230, g: 230, b: 230, alpha: 1 }
                }
            }).png().toBuffer();
        }


        // 2. Generate Barcode
        // Jika Qty ada (Mode Bulk), gunakan PLU/Input (queryText) sebagai barcode.
        // Jika tidak (Mode Utama), gunakan Barcode asli dari DB jika ada.
        const codeToRender = qty ? String(queryText) : (barcode || String(queryText));
        const humanReadableText = qty ? `${codeToRender} (QTY: ${qty})` : codeToRender;

        const barcodeBuffer = await new Promise((resolve, reject) => {
            bwipjs.toBuffer({
                bcid: 'code128',
                text: String(codeToRender),
                alttext: humanReadableText,
                scale: 3,
                height: 15,
                includetext: true,
                textxalign: 'center',
            }, (err, png) => {
                if (err) return reject(err);
                resolve(png);
            });
        });


        // 3. Create Text Labels (ProductName and PLU) using SVG
        const sanitizedText = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Wrap text logic (Memecah teks panjang menjadi beberapa baris)
        const words = (productName || '(Nama Produk Tidak Ada)').split(' ');
        let lines = [];
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            if ((currentLine + ' ' + words[i]).length < 30) { // Batas karakter per baris
                currentLine += ' ' + words[i];
            } else {
                lines.push(currentLine);
                currentLine = words[i];
            }
        }
        lines.push(currentLine);
        const tspans = lines.map((line, i) => `<tspan x="50%" dy="${i === 0 ? 0 : '1.2em'}">${sanitizedText(line)}</tspan>`).join('');

        const productNameSvg = Buffer.from(`
            <svg width="500" height="100">
                <text x="50%" y="${lines.length > 1 ? '30' : '50%'}" ${lines.length === 1 ? 'dominant-baseline="middle"' : ''} text-anchor="middle" style="font-size: 22px; font-family: Arial, sans-serif; font-weight: bold; fill: black;">
                    ${tspans}
                </text>
            </svg>
        `);
        
        const displayPlu = sanitizedText(plu || 'N/A');
        const displayQty = qty ? `   QTY: ${qty}` : '';

        const pluSvg = Buffer.from(`
            <svg width="500" height="50">
                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" style="font-size: 24px; font-family: 'Courier New', monospace; font-weight: bold;">
                    PLU: ${displayPlu}${displayQty}
                </text>
            </svg>
        `);


        // 4. Composite the final image
        const resizedProductImage = await sharp(productImageBuffer).resize(400, 300, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).toBuffer();
        const barcodeImage = await sharp(barcodeBuffer).resize(400, 100, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).toBuffer();

        const finalImage = await sharp({
            create: {
                width: 500,
                height: 600,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
        .composite([
            { input: resizedProductImage, top: 20, left: 50 },
            { input: productNameSvg, top: 320, left: 0 },
            { input: barcodeImage, top: 420, left: 50 },
            { input: pluSvg, top: 530, left: 0 }
        ])
        .png()
        .toBuffer();

        return finalImage;

    } catch (error) {
        console.error('❌ Gagal membuat gambar produk komposit:', error);
        throw new Error('Gagal membuat gambar produk.');
    }
}


// --- Logik Bot Baileys ---

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_INFO_PATH);
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n===========================================');
            console.log('🚨 SILAKAN PINDAI QR CODE DI BAWAH SEKARANG 🚨');
            qrcode.generate(qr, { small: true });
            console.log('===========================================\n');
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect.error?.output?.statusCode;
            const reason = DisconnectReason[statusCode] || 'Unknown Error';
            
            console.log(`Sambungan ditutup. Alasan: ${reason} (Code: ${statusCode})`);

            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            if (statusCode === DisconnectReason.loggedOut) {
                console.log('⚠️ Sesi terdeteksi dikeluarkan (logged out). Menghapus sesi lama...');
                if (fs.existsSync(AUTH_INFO_PATH)) {
                    fs.rmSync(AUTH_INFO_PATH, { recursive: true, force: true });
                    console.log('✅ Folder sesi dihapus. Menunggu sambung semula untuk QR Code baru.');
                }
            }
            
            if (shouldReconnect) {
                console.log('Mencoba sambung semula dalam 5 detik...');
                delay(5000).then(() => connectToWhatsApp()); 
            } else {
                console.log('🛑 Sesi keluar. Sila jalankan bot secara manual untuk memindai QR code baru.');
            }

        } else if (connection === 'open') {
            console.log('✅ Bot WhatsApp telah disambungkan dan siap menerima pesan!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        try {
            if (!m || !m.messages || m.messages.length === 0) return;

            const msg = m.messages[0];
            if (!msg || !msg.message) return;
            if (msg.key && msg.key.fromMe) return;

            const jid = msg.key.remoteJid || '';
            if (jid === 'status@broadcast') return;

            const message = msg.message;
            const rawText =
                message.conversation ||
                message.extendedTextMessage?.text ||
                message.imageMessage?.caption ||
                '';
            const text = String(rawText || '').trim();

            console.log('messages.upsert from=', jid, 'text=', text);

            if (text.toLowerCase() === 'tes') {
                await sock.sendMessage(jid, { text: 'Bot OK. Koneksi aktif.' }, { quoted: msg });
                return;
            }

            // --- Fitur Bulk / Qty (.bulk) ---
            // Format: ".bulk <kode> <jumlah>"
            if (/^\.bulk\s+/i.test(text)) {
                const args = text.trim().split(/\s+/); // Split by whitespace
                const code = args[1];
                const qty = args[2];

                if (code && /^\d+$/.test(code)) {
                    const quantity = parseInt(qty) || 1;
                    
                    await sock.sendMessage(jid, { text: '⏳ Sedang memproses...' }, { quoted: msg });
                    try {
                        const product = await getProductDetails(code);
                        if (product) {
                            const finalImageBuffer = await createProductImage(product, code, quantity);
                            await sock.sendMessage(jid, { image: finalImageBuffer, caption: `✅ Produk Ditemukan: ${code} (Qty: ${quantity})` }, { quoted: msg });
                        } else {
                            await sock.sendMessage(jid, { text: `❌ Kode "${code}" tidak ditemukan.` }, { quoted: msg });
                        }
                    } catch (err) {
                        console.error(`Error bulk processing ${code}:`, err);
                        await sock.sendMessage(jid, { text: `⚠️ Terjadi kesalahan.` }, { quoted: msg });
                    }
                } else {
                     await sock.sendMessage(jid, { text: `⚠️ Format salah. Gunakan: *.bulk <kode> <jumlah>*\nContoh: .bulk 89912345 25` }, { quoted: msg });
                }
                return;
            }

            // --- Fitur Multi PLU (.plu) ---
            // Format: ".plu <kode1> <kode2> ..."
            if (/^\.plu\s+/i.test(text)) {
                const codes = text.replace(/^\.plu\s+/i, '').split(/[\s,\n]+/).filter(c => /^\d+$/.test(c));
                
                if (codes.length > 0) {
                    await sock.sendMessage(jid, { text: `🔄 Memproses ${codes.length} kode produk...` }, { quoted: msg });
                    
                    for (const code of codes) {
                        try {
                            const product = await getProductDetails(code);
                            if (product) {
                                const finalImageBuffer = await createProductImage(product, code);
                                await sock.sendMessage(jid, { image: finalImageBuffer, caption: `✅ Produk Ditemukan: ${code}` }, { quoted: msg });
                            } else {
                                await sock.sendMessage(jid, { text: `❌ Kode "${code}" tidak ditemukan.` }, { quoted: msg });
                            }
                            await delay(1000); // Jeda aman untuk menghindari spam
                        } catch (err) {
                            console.error(`Error multi-plu processing ${code}:`, err);
                        }
                    }
                    await sock.sendMessage(jid, { text: `✅ Selesai memproses daftar PLU.` }, { quoted: msg });
                    return;
                }
            }

            if (!text) {
                const helpMessage = `👋 Selamat Datang.\nBot mencari kode produk (PLU/Barcode).\nKirimkan kode berupa *angka* min 5 digit.\n\n*Fitur Bulk (Qty):*\nKetik ".bulk <kode> <jumlah>" untuk label dengan Qty.\n\n*Fitur Multi PLU:*\nKetik ".plu <kode1> <kode2> ..." untuk cari banyak sekaligus.`;
                await sock.sendMessage(jid, { text: helpMessage }, { quoted: msg });
                return;
            }

            if (text.length >= 5 && /^\d+$/.test(text)) {
                console.log(`Mulai pencarian DB untuk kode: ${text}`);
                await sock.sendMessage(jid, { text: '⏳ Sedang mencari data...' }, { quoted: msg });
                try {
                    const product = await getProductDetails(text);
                    console.log('Pencarian DB selesai. Hasil:', product ? 'DITEMUKAN' : 'TIDAK DITEMUKAN');

                    if (product) {
                        // Generate the composite image (Standard Mode - No Qty)
                        const finalImageBuffer = await createProductImage(product, text);
                        
                        // Send the single composite image
                        await sock.sendMessage(jid, { 
                            image: finalImageBuffer,
                            caption: `✅ Produk Ditemukan: ${text}`
                        }, { quoted: msg });

                    } else {
                        await sock.sendMessage(jid, { text: `Produk dengan kode "${text}" tidak ditemui.` }, { quoted: msg });
                    }
                } catch (error) {
                    console.error('❌ Kesalahan dalam pemprosesan mesej:', error?.message || error);
                    await sock.sendMessage(jid, { text: `⚠️ Maaf, berlaku kesalahan server. Sila cuba lagi.` }, { quoted: msg });
                }
            } else {
                const helpMessage = `👋 Selamat Datang.\nBot mencari kode produk (PLU/Barcode).\nKirimkan kode berupa *angka* min 5 digit.\n\n*Fitur Bulk (Qty):*\nKetik ".bulk <kode> <jumlah>" untuk label dengan Qty.\n\n*Fitur Multi PLU:*\nKetik ".plu <kode1> <kode2> ..." untuk cari banyak sekaligus.`;
                await sock.sendMessage(jid, { text: helpMessage }, { quoted: msg });
            }

        } catch (err) {
            console.error('Unhandled error in messages.upsert handler:', err);
        }
    });
}

connectToWhatsApp();