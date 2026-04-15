const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const readline = require('readline');
const bwipjs = require('bwip-js');
const sharp = require('sharp');
const axios = require('axios');
const smsService = require('./sms_service'); // 1. Import modul SMS terpisah
// const indomaretService = require('./indomaret_service'); // Import modul Indomaret (Dinonaktifkan)
const cctvService = require('./cctv_service'); // Import modul CCTV
const { getListingCaption } = require('./listing_service'); // Import modul Listing

// --- Konfigurasi Database SQLite ---
const DB_FILE = 'products.db';
const AUTH_INFO_PATH = 'baileys_auth_info';
const RECENT_CHATS_FILE = 'recent_chats.json';
let hasSentOnlineBroadcast = false;
let isBotConnected = false;
let initialPairPhone = null;
let initialPairKey = 'ELAINA01';
let initialPairMode = false;
let initialPairRequested = false;
let aiMode = false;
let autoReactEmoji = '❤️';
let autoReactEnabled = true;

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

function searchProductByName(query) {
    const sql = `SELECT plu, barcode, nama FROM products WHERE nama LIKE ? LIMIT 10`;
    return new Promise((resolve, reject) => {
        db.all(sql, [`%${String(query).trim()}%`], (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
        });
    });
}

function loadRecentChats() {
    try {
        if (!fs.existsSync(RECENT_CHATS_FILE)) return {};
        const raw = fs.readFileSync(RECENT_CHATS_FILE, 'utf-8');
        return raw ? JSON.parse(raw) : {};
    } catch (err) {
        console.warn('⚠️ Gagal membaca recent chats:', err.message);
        return {};
    }
}

function saveRecentChats(chats) {
    try {
        fs.writeFileSync(RECENT_CHATS_FILE, JSON.stringify(chats, null, 2), 'utf-8');
    } catch (err) {
        console.warn('⚠️ Gagal menyimpan recent chats:', err.message);
    }
}

function recordRecentChat(jid) {
    try {
        const recentChats = loadRecentChats();
        recentChats[jid] = Date.now(); // Save the timestamp of the chat
        saveRecentChats(recentChats);
    } catch (err) {
        console.error('❌ Error recording recent chat:', err.message);
    }
}

function askQuestion(query) {
    if (!process.stdin.isTTY) return Promise.resolve('');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function promptInitialPairingMode() {
    const hasAuthFolder = fs.existsSync(AUTH_INFO_PATH);
    if (hasAuthFolder) return;

    console.log('⚠️ Belum ada sesi WhatsApp. Pilih cara setup:');
    console.log('  1) Scan QR');
    console.log('  2) Gunakan kode pairing dengan nomor telepon');

    const answer = (await askQuestion('Pilih 1 atau 2 [default 1]: ')) || '1';
    if (answer === '2' || answer.toLowerCase().startsWith('c')) {
        initialPairMode = true;
        const phone = (await askQuestion('Masukkan nomor telepon (contoh 6281234567890): ')).replace(/\D/g, '');
        if (!phone) {
            console.log('❌ Nomor telepon tidak valid. Menggunakan QR secara default.');
            initialPairMode = false;
            return;
        }
        initialPairPhone = phone;
        const key = (await askQuestion('Masukkan pairing key (default ELAINA01): ')).trim();
        if (key) initialPairKey = key;
        console.log(`✅ Pairing mode dipilih untuk ${initialPairPhone}. Kode pairing akan ditampilkan di terminal saat terhubung.`);
    }
}

function formatAIMessage(text) {
    return `🤖 *AI Response:*\n${text}`;
}

async function sendReaction(sock, jid, msgKey, emoji) {
    try {
        await sock.sendMessage(jid, {
            react: {
                text: emoji,
                key: msgKey
            }
        });
    } catch (err) {
        console.error('Error sending reaction:', err.message);
    }
}

function getSpinner(frame) {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    return frames[frame % frames.length];
}

function getProgressBar(percent) {
    const filled = Math.floor(percent / 5);
    const empty = 20 - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percent}%`;
}

function getAnimatedEmoji(frame) {
    const emojis = ['🔄', '⏳', '🔃'];
    return emojis[frame % emojis.length];
}

// Replace the existing loading spinner with custom animation
async function showLoadingSpinner(sock, jid, initialMsg, duration = 3000) {
    try {
        const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        const startTime = Date.now();
        let lastMsg = null;
        let frameIndex = 0;

        while (Date.now() - startTime < duration) {
            const spinner = spinnerFrames[frameIndex % spinnerFrames.length];
            const text = `${spinner} ${initialMsg}`;

            if (!lastMsg) {
                lastMsg = await sock.sendMessage(jid, { text });
            } else {
                try {
                    await sock.sendMessage(jid, { text, edit: lastMsg.key });
                } catch (err) {
                    console.warn('Could not edit loading message:', err.message);
                }
            }

            frameIndex++;
            await delay(150);
        }
        return lastMsg;
    } catch (err) {
        console.error('Error in loading spinner:', err.message);
        return null;
    }
}

async function showCustomLoadingAnimation(sock, jid, initialMsg, duration = 3000) {
    try {
        const frames = ['🔍', '⌛', '🔎', '⏳'];
        const startTime = Date.now();
        let frame = 0;
        let lastMsg = null;

        while (Date.now() - startTime < duration) {
            const text = `${frames[frame % frames.length]} ${initialMsg}`;

            if (!lastMsg) {
                lastMsg = await sock.sendMessage(jid, { text });
            } else {
                try {
                    await sock.sendMessage(jid, { text, edit: lastMsg.key });
                } catch (err) {
                    console.warn('Could not edit loading message:', err.message);
                }
            }

            frame++;
            await delay(500); // Ganti frame setiap 500ms
        }
        return lastMsg;
    } catch (err) {
        console.error('Error in custom loading animation:', err.message);
        return null;
    }
}

// Fungsi untuk menampilkan progress bar custom
async function showProgressBar(sock, jid, initialMsg, totalSteps, delayMs = 500) {
    try {
        let lastMsg = null;

        for (let step = 0; step <= totalSteps; step++) {
            const filled = Math.floor((step / totalSteps) * 20);
            const empty = 20 - filled;
            const percent = Math.floor((step / totalSteps) * 100);
            const progressBar = `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percent}%`;
            const text = `${initialMsg}\n${progressBar}`;

            if (!lastMsg) {
                lastMsg = await sock.sendMessage(jid, { text });
            } else {
                try {
                    await sock.sendMessage(jid, { text, edit: lastMsg.key });
                } catch (err) {
                    console.warn('Could not edit progress message:', err.message);
                }
            }

            await delay(delayMs);
        }

        // Kirim pesan selesai setelah progress bar selesai
        await sock.sendMessage(jid, { text: `${initialMsg}\n✅ Progress selesai!` });
        return lastMsg;
    } catch (err) {
        console.error('Error in progress bar:', err.message);
        return null;
    }
}

function getRecentChatJids(days = 2) {
    const recentChats = loadRecentChats();
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    return Object.keys(recentChats).filter(jid => {
        const lastActive = recentChats[jid];
        return lastActive >= cutoffTime;
    });
}

async function broadcastOnlineToRecentChats(sock) {
    const jids = getRecentChatJids(2);
    if (jids.length === 0) {
        console.log('Tidak ada nomor chat dalam 2 hari terakhir untuk broadcast online.');
        return;
    }

    console.log(`📣 Mengirim broadcast online ke ${jids.length} nomor...`);
    const broadcastMessage = '🤖 Bot sudah online kembali. Silakan kirimkan kode produk atau perintah yang Anda perlukan.';

    for (const jid of jids) {
        try {
            await sock.sendMessage(jid, { text: broadcastMessage });
            await delay(1000);
        } catch (err) {
            console.warn(`⚠️ Gagal mengirim broadcast ke ${jid}: ${err.message}`);
        }
    }

    console.log('✅ Broadcast online selesai.');
}

async function sendBarcodeFromGenerator(sock, jid, msg) {
    const barcodeDir = './Barcode_generator';
    
    // Deteksi apakah dari group atau private
    const isGroup = jid.endsWith('@g.us');
    const targetJid = isGroup ? msg.key.participant : jid; // Kirim ke private jika dari group
    
    try {
        // Cek apakah folder ada
        if (!fs.existsSync(barcodeDir)) {
            await sock.sendMessage(targetJid, { text: '❌ Folder Barcode_generator tidak ditemukan.' }, { quoted: msg });
            return;
        }

        // Baca isi folder
        const files = fs.readdirSync(barcodeDir).filter(file => {
            const ext = file.toLowerCase();
            return ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg');
        });

        if (files.length === 0) {
            await sock.sendMessage(targetJid, { text: '📭 Tidak ada file barcode di folder Barcode_generator.' }, { quoted: msg });
            return;
        }

        // Kirim pesan konfirmasi + animated emoji progress
        const confirmMsg = isGroup 
            ? `📤 Mengirim ${files.length} barcode ke pesan pribadi Anda...`
            : `📤 Mengirim ${files.length} barcode dari folder Barcode_generator...`;
        
        await sock.sendMessage(targetJid, { text: confirmMsg }, { quoted: msg });

        // Kirim setiap file dengan animated emoji
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const filePath = `${barcodeDir}/${file}`;
            try {
                const imageBuffer = fs.readFileSync(filePath);
                const progress = Math.floor((i / files.length) * 100);
                await sock.sendMessage(targetJid, { 
                    image: imageBuffer, 
                    caption: `${getAnimatedEmoji(i)} ${i + 1}/${files.length} | 📊 ${file}` 
                });
                
                // Delay kecil untuk menghindari spam
                await delay(1000);
            } catch (error) {
                console.error(`Error sending barcode ${file}:`, error);
                await sock.sendMessage(targetJid, { text: `❌ Gagal mengirim ${file}: ${error.message}` });
            }
        }

        await sock.sendMessage(targetJid, { text: '✅ Selesai mengirim semua barcode.' });

    } catch (error) {
        console.error('Error in sendBarcodeFromGenerator:', error);
        await sock.sendMessage(targetJid, { text: `❌ Terjadi kesalahan: ${error.message}` });
    }
}

async function createProductImage(product, queryText, qty = null) {
    try {
        const { nama: productName, gambar: productImage, barcode, plu } = product;

        // 1. Fetch Product Image
        let productImageBuffer;
        if (productImage) {
            try {
                // Tentukan Referer (biasanya domain asal gambar) untuk menghindari blokir hotlink
                let refererUrl = 'https://www.google.com/';
                try { refererUrl = new URL(productImage).origin + '/'; } catch (e) {}

                const response = await axios.get(productImage, { 
                    responseType: 'arraybuffer',
                    timeout: 5000, // Timeout 5 detik agar lebih cepat pindah ke proxy jika hang
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                        'Referer': refererUrl
                    }
                });
                productImageBuffer = Buffer.from(response.data);
            } catch (error) {
                console.warn(`⚠️ Gagal download langsung (${error.message}), mengalihkan ke Proxy...`);
                try {
                    // Fallback: Gunakan proxy wsrv.nl untuk bypass blokir IP VPS
                    const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(productImage)}&output=png`;
                    const response = await axios.get(proxyUrl, { 
                        responseType: 'arraybuffer',
                        timeout: 30000  // Increased timeout to 30 seconds
                    });
                    productImageBuffer = Buffer.from(response.data);
                } catch (proxyError) {
                    console.error('Gagal download via proxy:', proxyError.message);
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
        // Revisi: Menggunakan barcode murni (tanpa QTY*) agar kompatibel dengan scanner yang tidak support macro '*'.
        // QTY tetap ditampilkan secara visual di label untuk informasi manual.
        const codeToRender = barcode || String(queryText);
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
    await promptInitialPairingMode();

    const hasAuthFolder = fs.existsSync(AUTH_INFO_PATH);
    if (!hasAuthFolder) {
        console.log('⚠️ Folder sesi belum ditemukan. Jika Anda sudah memiliki sesi dari device lain, copy folder baileys_auth_info ke folder proyek ini.');
        console.log('   Jika belum, bot akan menampilkan QR code untuk pairing.');
        if (initialPairMode) {
            console.log('   Opsi pairing code dipilih. Tunggu kode pairing di terminal.');
        }
    }

    if (!fs.existsSync(AUTH_INFO_PATH)) {
        console.warn('⚠️ Folder sesi tidak ditemukan. Membuat ulang folder sesi...');
        fs.mkdirSync(AUTH_INFO_PATH, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_INFO_PATH);
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        isBotConnected = connection === 'open';
        
        if (qr) {
            if (!initialPairMode) {
                console.log('\n===========================================');
                console.log('🚨 SILAKAN PINDAI QR CODE DI BAWAH SEKARANG 🚨');
                qrcode.generate(qr, { small: true });
                console.log('===========================================\n');

                try {
                    const qrFile = 'qr.png';
                    await QRCode.toFile(qrFile, qr, { type: 'png', width: 500 });
                    fs.writeFileSync('qr.txt', qr, 'utf-8');
                    console.log(`✅ QR code saved to ${qrFile} and qr.txt`);
                    console.log('📎 Jika terminal tidak cocok, download file qr.png untuk discan.');
                } catch (err) {
                    console.error('❌ Gagal menyimpan QR code ke file:', err.message);
                }
            } else {
                console.log('\n⚠️ QR code tersedia, tetapi pairing code mode dipilih. Abaikan QR ini.\n');
            }
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
                console.log('🛑 Bot terputus. Silakan restart bot secara manual.');
                process.exit(1); // Exit the process to prevent multiple instances
            } else {
                console.log('🛑 Sesi keluar. Sila jalankan bot secara manual untuk memindai QR code baru.');
                process.exit(1);
            }

        }

        if (connection === 'connectionReplaced') {
            console.warn('⚠️ Sambungan digantikan oleh sesi lain. Pastikan tidak ada sesi lain yang aktif.');
            console.warn('⚠️ Jika WhatsApp terbuka di perangkat lain atau browser, tutup terlebih dahulu.');
            console.log('🛑 Keluar untuk mencegah konflik sesi. Silakan restart bot.');
            process.exit(1); // Exit to prevent multiple instances
        }

        if (initialPairMode && !initialPairRequested && connection === 'connecting') {
            initialPairRequested = true;
            if (typeof sock.requestPairingCode === 'function' && initialPairPhone) {
                console.log(`⏳ Meminta pairing code untuk ${initialPairPhone}...`);
                try {
                    const code = await sock.requestPairingCode(initialPairPhone, initialPairKey);
                    console.log('✅ Pairing Code:', code);
                    fs.writeFileSync('pairing-code.txt', code, 'utf-8');
                    console.log('📄 Kode pairing tersimpan di pairing-code.txt');
                    console.log('Gunakan kode ini di WhatsApp Anda untuk menautkan bot.');
                } catch (err) {
                    console.error('❌ Gagal mendapatkan pairing code:', err?.message || err);
                }
            } else {
                console.warn('⚠️ requestPairingCode tidak tersedia di versi Baileys saat ini atau nomor belum diisi.');
            }
        }

        if (connection === 'open') {
            console.log('✅ Bot WhatsApp telah disambungkan dan siap menerima pesan!');
            // Aktifkan fitur broadcast
            // if (!hasSentOnlineBroadcast) {
            //     hasSentOnlineBroadcast = true;
            //     await broadcastOnlineToRecentChats(sock);
            // }
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

            // Simpan nomor chat masuk untuk broadcast online kembali
            recordRecentChat(jid);

            // Abaikan pesan lama (lebih dari 1 menit) untuk menghindari memproses pesan tertunda saat startup
            if (msg.messageTimestamp && msg.messageTimestamp * 1000 < Date.now() - 60000) return;


            const message = msg.message;
            const rawText =
                message.conversation ||
                message.extendedTextMessage?.text ||
                message.imageMessage?.caption ||
                '';
            const text = String(rawText || '').trim();
            const name = msg.pushName || 'Pengguna';

            console.log('messages.upsert from=', jid, 'text=', text);

            const HELP_MESSAGE = `👋 Selamat Datang ${name}.\n🤖 Bot mencari kode produk (PLU/Barcode/Nama).\n\n📋 *Cara Pakai:*\n1. Kirim *Angka* (PLU/Barcode) untuk lihat label.\n2. Ketik *.cari <Nama>* untuk cari kode.\n\n⚙️ *Fitur Lain:*\n• *.bulk <kode> <jumlah>* : Label dengan Qty.\n• *.plu <kode1> <kode2>* : Cari banyak sekaligus.\n• *.aktiva* : Kirim semua barcode dari folder Barcode_generator.\n  (Jika di group, dikirim ke pesan pribadi)\n• *.pair <nomor> [key]* : Buat pairing code untuk setup awal saja\n• *.aimode* : Aktifkan/nonaktifkan mode AI\n🎥 *Fitur CCTV:*\n• .cctv : Lihat akses CCTV\n\n• *.menu* : Tampilkan pesan ini.`;

            if (text.toLowerCase() === 'tes') {
                await sock.sendMessage(jid, { text: `🤖 Bot OK. Koneksi aktif. Halo ${name}!` }, { quoted: msg });
                return;
            }

            // Auto react ke pesan masuk jika enabled
            if (autoReactEnabled && msg.key) {
                await sendReaction(sock, jid, msg.key, autoReactEmoji);
            }

            // --- Integrasi Projek SMS (Terpisah) ---
            // Jika perintah adalah .sms, proses di sini dan stop (return).
            if (await smsService.handleCommand(sock, jid, text, msg)) return;

            // --- Integrasi CCTV ---
            if (text.toLowerCase() === '.cctv') {
                await cctvService.handleCctvMenu(sock, jid, msg);
                return;
            }

            // --- Fitur Kirim Barcode dari Folder ---
            if (text.toLowerCase() === '.aktiva') {
                // React to indicate processing started
                await sendReaction(sock, jid, msg.key, '⏳');
                
                try {
                    await sendBarcodeFromGenerator(sock, jid, msg);
                    
                    // React to indicate successful completion
                    await sendReaction(sock, jid, msg.key, '✅');
                } catch (err) {
                    console.error('Error in .aktiva command:', err);
                    
                    // React to indicate error
                    await sendReaction(sock, jid, msg.key, '❌');
                }
                return;
            }

            // --- Fitur AI Mode Toggle ---
            if (text.toLowerCase() === '.aimode') {
                aiMode = !aiMode;
                const status = aiMode ? '✅ ON' : '❌ OFF';
                await sock.sendMessage(jid, { text: `🤖 AI Mode ${status}. Setiap pesan bot akan ditandai dengan ikon AI.` }, { quoted: msg });
                return;
            }

            // --- Fitur Auto React Toggle ---
            if (text.toLowerCase() === '.autoreact') {
                autoReactEnabled = !autoReactEnabled;
                const status = autoReactEnabled ? '✅ ON' : '❌ OFF';
                await sock.sendMessage(jid, { text: `👍 Auto React ${status} (Emoji: ${autoReactEmoji})` }, { quoted: msg });
                return;
            }

            // --- Fitur Set React Emoji ---
            if (/^\.setreact\s+/i.test(text)) {
                const args = text.replace(/^\.setreact\s+/i, '').trim();
                if (args && args.length <= 2) {
                    autoReactEmoji = args;
                    await sock.sendMessage(jid, { text: `✅ Emoji react diubah menjadi: ${autoReactEmoji}` }, { quoted: msg });
                } else {
                    await sock.sendMessage(jid, { text: `⚠️ Gunakan: .setreact <emoji>\nContoh: .setreact ❤️` }, { quoted: msg });
                }
                return;
            }

            // --- Fitur Pairing Code ---
            if (/^\.pair(?:\s+|$)/i.test(text)) {
                const args = text.trim().split(/\s+/);
                let targetNumber = args[1];
                const pairKey = args[2] || 'ELAINA01';

                if (!targetNumber) {
                    if (jid.endsWith('@s.whatsapp.net')) {
                        targetNumber = jid.replace('@s.whatsapp.net', '');
                    }
                }

                if (hasAuthFolder && isBotConnected) {
                    await sock.sendMessage(jid, { text: '⚠️ Pairing code hanya diperlukan saat pertama kali menghubungkan bot. Bot sudah memiliki sesi aktif sekarang.' }, { quoted: msg });
                    return;
                }

                if (!targetNumber || !/^\d{8,}$/.test(targetNumber)) {
                    await sock.sendMessage(jid, { text: '⚠️ Gunakan: .pair <nomor> [key]\nContoh: .pair 6281234567890 ELAINA01' }, { quoted: msg });
                    return;
                }

                if (typeof sock.requestPairingCode !== 'function') {
                    await sock.sendMessage(jid, { text: '⚠️ Fitur pairing belum tersedia di versi Baileys saat ini.' }, { quoted: msg });
                    return;
                }

                await sock.sendMessage(jid, { text: `⏳ Meminta pairing code untuk ${targetNumber}...` }, { quoted: msg });
                try {
                    const code = await sock.requestPairingCode(targetNumber, pairKey);
                    await sock.sendMessage(jid, { text: `✅ Pairing Code untuk ${targetNumber}:\n${code}\n\nGunakan kode ini pada device yang ingin kamu pair.` }, { quoted: msg });
                } catch (error) {
                    console.error('Error requestPairingCode:', error);
                    await sock.sendMessage(jid, { text: `❌ Gagal membuat pairing code: ${error.message}` }, { quoted: msg });
                }
                return;
            }

            // --- Integrasi Indomaret (Dinonaktifkan) ---
            // Command: .indo <permalink>
            // if (await indomaretService.handleCommand(sock, jid, text, msg)) return;

            // --- Fitur Bulk / Qty (.bulk) ---
            // Format: ".bulk <kode> <jumlah>"
            if (/^\.bulk\s+/i.test(text)) {
                const args = text.trim().split(/\s+/); // Split by whitespace
                const code = args[1];
                const qty = args[2];

                if (code) {
                    let quantity = parseInt(qty);
                    if (isNaN(quantity) || quantity < 1) quantity = 1;
                    console.log(`[BULK] Request dari ${name}: Code=${code}, Qty=${quantity}`);
                    
                    // React to indicate processing started
                    await sendReaction(sock, jid, msg.key, '⏳');
                    
                    await showProgressBar(sock, jid, `📦 Generate barcode..`, quantity * 100, 50);
                    try {
                        // Cari produk di database (PLU/Barcode) agar nama barang tampil di label
                        let product = await getProductDetails(code);
                        let caption = '';

                        if (product) {
                            caption = `✅ Produk Ditemukan oleh ${name}: *${product.nama}*\nKode: ${code} (Qty: ${quantity})`;
                        } else {
                            // Jika tidak ditemukan, gunakan data dummy agar tetap bisa cetak label (Fallback)
                            product = {
                                nama: 'Produk Tidak Terdaftar',
                                gambar: null,
                                barcode: code,
                                plu: code
                            };
                            caption = `⚠️ Produk tidak ditemukan di database oleh ${name}.\nLabel manual dibuat: ${code} (Qty: ${quantity})`;
                        }

                        const finalImageBuffer = await createProductImage(product, code, quantity);
                        await sock.sendMessage(jid, { image: finalImageBuffer, caption: caption }, { quoted: msg });
                        
                        // React to indicate successful completion
                        await sendReaction(sock, jid, msg.key, '✅');

                    } catch (err) {
                        console.error(`Error bulk processing ${code}:`, err);
                        await sock.sendMessage(jid, { text: `⚠️ Terjadi kesalahan.` }, { quoted: msg });
                        
                        // React to indicate error
                        await sendReaction(sock, jid, msg.key, '❌');
                    }
                } else {
                     await sock.sendMessage(jid, { text: `⚠️ Format yang Anda masukkan salah, ${name}. Gunakan format berikut: *.bulk <kode> <jumlah>*\nContoh: .bulk 89912345 25` }, { quoted: msg });
                }
                return;
            }

            // --- Multiple PLU otomatis terdeteksi di bagian single PLU handler ---

            if (text.toLowerCase() === '.menu' || text.toLowerCase() === '.help') {
                const HELP_MESSAGE = `👋 Selamat Datang ${name}.
🤖 Bot mencari kode produk (PLU/Barcode/Nama).

📋 *Cara Pakai:*
1. Kirim *Angka* (PLU/Barcode) untuk lihat label.
   • Single: 20019930
   • Multiple: 20019930 20019931 20019932 (space/dot/newline separator)
2. Ketik *.cari <Nama>* untuk cari kode.

⚙️ *Fitur Lain:*
• *.bulk <kode> <jumlah>* : Label dengan Qty.
• *.aktiva* : Kirim semua barcode dari folder Barcode_generator.
  (Jika di group, dikirim ke pesan pribadi)
• *.pair <nomor> [key]* : Buat pairing code untuk setup awal saja
• *.aimode* : Aktifkan/nonaktifkan mode AI
🎥 *Fitur CCTV:*
• .cctv : Lihat akses CCTV

• *.menu* : Tampilkan pesan ini.`;
                await sock.sendMessage(jid, { text: HELP_MESSAGE }, { quoted: msg });
                return;
            }

            if (!text) {
                return;
            }

            // Auto-detect single or multiple PLU codes (separated by space, dot, or newline)
            const codeArray = text.split(/[\s.\n]+/).filter(c => /^\d{5,}$/.test(c));
            
            if (codeArray.length > 0) {
                console.log(`Pencarian untuk ${codeArray.length} kode: ${codeArray.join(', ')}`);
                
                // React to indicate processing started
                await sendReaction(sock, jid, msg.key, '⏳');
                
                if (codeArray.length === 1) {
                    // Single PLU - Progress bar animation
                    const singleCode = codeArray[0];
                    const loadingMsg = await sock.sendMessage(jid, { text: `[░░░░░░░░░░░░░░░░░░] 0%` });
                    let progressValue = 0;
                    
                    const progressInterval = setInterval(async () => {
                        try {
                            progressValue = Math.min(progressValue + 10, 90);
                            const filled = Math.floor(progressValue / 5);
                            const empty = 20 - filled;
                            const progressBar = `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${progressValue}%`;
                            
                            await sock.sendMessage(jid, { 
                                text: progressBar, 
                                edit: loadingMsg.key 
                            });
                        } catch (err) {
                            // Ignore edit errors
                        }
                    }, 200);
                    
                    try {
                        const product = await getProductDetails(singleCode);
                        console.log('Pencarian DB selesai. Hasil:', product ? 'DITEMUKAN' : 'TIDAK DITEMUKAN');
                        
                        clearInterval(progressInterval);
                        const progressBar = `[${'█'.repeat(20)}] 100%`;
                        await sock.sendMessage(jid, { 
                            text: progressBar, 
                            edit: loadingMsg.key 
                        });

                        if (product) {
                            const finalImageBuffer = await createProductImage(product, singleCode);
                            let captionText = `✅ *Produk Ditemukan oleh ${name}:* ${singleCode}`;
                            const listingInfo = await getListingCaption(product.plu || singleCode);
                            if (listingInfo) {
                                captionText += `\n\n${listingInfo}`;
                            }
                            if (aiMode) {
                                captionText = formatAIMessage(captionText);
                            }
                            await sock.sendMessage(jid, {
                                image: finalImageBuffer,
                                caption: captionText
                            }, { quoted: msg });
                            
                            // React to indicate successful completion
                            await sendReaction(sock, jid, msg.key, '✅');
                        } else {
                            let errorMsg = `Produk dengan kode "${singleCode}" tidak ditemukan oleh ${name}.`;
                            if (aiMode) {
                                errorMsg = formatAIMessage(errorMsg);
                            }
                            await sock.sendMessage(jid, { text: errorMsg }, { quoted: msg });
                            
                            // React to indicate not found
                            await sendReaction(sock, jid, msg.key, '❌');
                        }
                    } catch (error) {
                        console.error('❌ Kesalahan:', error?.message || error);
                        clearInterval(progressInterval);
                        await sock.sendMessage(jid, { text: `⚠️ Terjadi kesalahan saat memproses kode ${singleCode}.` }, { quoted: msg });
                        
                        // React to indicate error
                        await sendReaction(sock, jid, msg.key, '❌');
                    }
                } else {
                    // Multiple PLU - Progress bar animation
                    const loadingMsg = await sock.sendMessage(jid, { text: `[░░░░░░░░░░░░░░░░░░] 0%` });
                    const totalCodes = codeArray.length;
                    let processedCount = 0;
                    
                    const progressInterval = setInterval(async () => {
                        try {
                            const currentProgress = Math.floor((processedCount / totalCodes) * 100);
                            const filled = Math.floor(currentProgress / 5);
                            const empty = 20 - filled;
                            const progressBar = `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${currentProgress}%`;
                            
                            await sock.sendMessage(jid, { 
                                text: progressBar, 
                                edit: loadingMsg.key 
                            });
                        } catch (err) {
                            // Ignore edit errors
                        }
                    }, 300);
                    
                    try {
                        for (const code of codeArray) {
                            try {
                                const product = await getProductDetails(code);
                                if (product) {
                                    const finalImageBuffer = await createProductImage(product, code);
                                    await sock.sendMessage(jid, { image: finalImageBuffer, caption: `✅ ${code}` }, { quoted: msg });
                                } else {
                                    await sock.sendMessage(jid, { text: `❌ Kode "${code}" tidak ditemukan.` }, { quoted: msg });
                                }
                                processedCount++;
                                await delay(800);
                            } catch (err) {
                                console.error(`Error processing code ${code}:`, err);
                                processedCount++;
                            }
                        }
                        clearInterval(progressInterval);
                        const progressBar = `[${'█'.repeat(20)}] 100%`;
                        await sock.sendMessage(jid, { 
                            text: progressBar, 
                            edit: loadingMsg.key 
                        });
                        await sock.sendMessage(jid, { text: `✅ Selesai memproses ${totalCodes} kode.` }, { quoted: msg });
                        
                        // React to indicate completion
                        await sendReaction(sock, jid, msg.key, '✅');
                    } catch (error) {
                        console.error('❌ Kesalahan:', error?.message || error);
                        clearInterval(progressInterval);
                        await sendReaction(sock, jid, msg.key, '❌');
                    }
                }
                return;
            } else if (/^\.cari\s+/i.test(text)) {
                const query = text.replace(/^\.cari\s+/i, '').trim();
                
                // React to indicate processing started
                await sendReaction(sock, jid, msg.key, '⏳');
                
                await showLoadingSpinner(sock, jid, `🔎 Mencari produk "${query}"`, 2000);

                try {
                    const results = await searchProductByName(query);
                    if (results.length > 0) {
                        let replyMsg = `🔎 *Hasil Pencarian oleh ${name}: "${query}"*\nDitemukan ${results.length} produk:\n\n`;
                        results.forEach(p => {
                            replyMsg += `• *${p.nama}*\n  PLU: ${p.plu} | Barcode: ${p.barcode}\n\n`;
                        });
                        replyMsg += `_Kirim kode PLU di atas untuk melihat gambar._`;

                        if (aiMode) {
                            replyMsg = formatAIMessage(replyMsg);
                        }

                        await sock.sendMessage(jid, { text: replyMsg }, { quoted: msg });
                        
                        // React to indicate successful completion
                        await sendReaction(sock, jid, msg.key, '✅');
                    } else {
                        let notFoundMsg = `❌ Tidak ditemukan produk dengan nama "${query}" oleh ${name}.`;
                        if (aiMode) {
                            notFoundMsg = formatAIMessage(notFoundMsg);
                        }
                        await sock.sendMessage(jid, { text: notFoundMsg }, { quoted: msg });
                        
                        // React to indicate not found
                        await sendReaction(sock, jid, msg.key, '❌');
                    }
                } catch (err) {
                    console.error('Error search name:', err);
                    await sock.sendMessage(jid, { text: `⚠️ Terjadi kesalahan saat mencari nama.` }, { quoted: msg });
                    
                    // React to indicate error
                    await sendReaction(sock, jid, msg.key, '❌');
                } finally {
                    console.log('Pencarian produk selesai.');
                }
            }

        } catch (err) {
            console.error('Unhandled error in messages.upsert handler:', err);
        }
    });
}

connectToWhatsApp();