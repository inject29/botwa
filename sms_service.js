const axios = require('axios');

/**
 * MODUL INTEGRASI JASA OTP (jasaotp.id)
 * Dokumentasi: https://api.jasaotp.id/v1/
 */

// --- KONFIGURASI ---
// ⚠️ GANTI DENGAN API KEY ANDA DARI PROFILE JASA OTP
const API_KEY = '85ab1c7c777f7df35cbbbf0289ce2ac0'; 
const BASE_URL = 'https://api.jasaotp.id/v1';
const ID_NEGARA_DEFAULT = 6; // 6 = Indonesia

// Menyimpan status pesanan sementara (Format: { remoteJid: orderId })
// Agar user tidak perlu ketik ID pesanan terus menerus
let activeOrders = {};

// Helper untuk delay (sleep)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper untuk request API
async function callApi(endpoint, params = {}) {
    try {
        // Gabungkan params dengan API Key
        const queryParams = new URLSearchParams({ api_key: API_KEY, ...params }).toString();
        const url = `${BASE_URL}${endpoint}?${queryParams}`;
        
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`❌ API Error [${endpoint}]:`, error.message);
        return null;
    }
}

/**
 * Fungsi Handler Utama
 */
async function handleCommand(sock, jid, text, msg) {
    const command = text.split(' ')[0].toLowerCase();
    const args = text.split(' ').slice(1);

    // 1. CEK SALDO (.saldo)
    if (command === '.saldo') {
        await sock.sendMessage(jid, { text: '🔄 Mengecek saldo...' }, { quoted: msg });
        const res = await callApi('/balance.php');
        
        if (res && res.success) {
            await sock.sendMessage(jid, { text: `💰 *Informasi Saldo*\nSaldo: Rp ${res.data.saldo.toLocaleString('id-ID')}` }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, { text: `⚠️ Gagal cek saldo: ${res?.message || 'Unknown error'}` }, { quoted: msg });
        }
        return true;
    }

    // 2. LIHAT LAYANAN (.layanan)
    if (command === '.layanan') {    
        await sock.sendMessage(jid, { text: '🔄 Mengambil daftar layanan (Indo)...' }, { quoted: msg });
        const res = await callApi('/layanan.php', { negara: ID_NEGARA_DEFAULT });

        if (res && res[ID_NEGARA_DEFAULT]) {
            let reply = `📋 *Daftar Layanan (Indonesia)*\n\n`;
            const services = res[ID_NEGARA_DEFAULT];
            // Menampilkan semua layanan
            for (const [code, detail] of Object.entries(services)) {
                reply += `• *${detail.layanan}* (${code}) : Rp ${detail.harga}\n`;
            }
            reply += `\n_Gunakan .order <code> untuk membeli._`;
            await sock.sendMessage(jid, { text: reply }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, { text: '⚠️ Gagal mengambil data layanan.' }, { quoted: msg });
        }
        return true;
    }

        // 2. LIHAT LAYANAN DENGAN PENCARIAN (.layanan <nama_layanan>)
    if (command === '.layanan' && args.length > 0) {
        const searchTerm = args.join(' ').toLowerCase();
        await sock.sendMessage(jid, { text: `🔄 Mencari layanan "${searchTerm}" (Indo)...` }, { quoted: msg });
        const res = await callApi('/layanan.php', { negara: ID_NEGARA_DEFAULT });

        if (res && res[ID_NEGARA_DEFAULT]) {
            let reply = `📋 *Hasil Pencarian Layanan (Indonesia)*\n\n`;
            const services = res[ID_NEGARA_DEFAULT];
            let found = false;

            for (const [code, detail] of Object.entries(services)) {
                if (detail.layanan.toLowerCase().includes(searchTerm)) {
                    reply += `• *${detail.layanan}* (${code}) : Rp ${detail.harga}\n`;
                    found = true;
                }
            }

            if (!found) {
                reply = `❌ Tidak ditemukan layanan dengan nama "${searchTerm}".`;
            } else {
                reply += `\n_Gunakan .order <code> untuk membeli._`;
            }
            await sock.sendMessage(jid, { text: reply }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, { text: '⚠️ Gagal mengambil data layanan.' }, { quoted: msg });
        }
        return true;
    }

    // 3. ORDER NOMOR (.order <kode_layanan>)
    // Contoh: .order wa
    if (command === '.order') {
        const serviceCode = args[0];
        if (!serviceCode) {
            await sock.sendMessage(jid, { text: '⚠️ Format salah.\nGunakan: *.order <kode_layanan>*\nContoh: .order wa' }, { quoted: msg });
            return true;
        }

        await sock.sendMessage(jid, { text: `🔄 Memesan nomor untuk layanan "${serviceCode}"...` }, { quoted: msg });
        
        // Default: Negara Indonesia (6), Operator Any
        const res = await callApi('/order.php', { 
            negara: ID_NEGARA_DEFAULT, 
            layanan: serviceCode, 
            operator: 'any' 
        });

        if (res && res.success) {
            const { order_id, number } = res.data;
            
            // Simpan Order ID ke memori agar mudah dicek nanti
            activeOrders[jid] = order_id;

            const reply = `✅ *Order Berhasil!*\n\n` +
                          `🆔 ID: ${order_id}\n` +
                          `📱 Nomor: *${number}*\n` +
                          `Layanan: ${serviceCode.toUpperCase()}\n\n` +
                          `_Ketik *.otp* untuk cek SMS masuk._\n` +
                          `_Ketik *.cancel* untuk membatalkan._`;
            
            await sock.sendMessage(jid, { text: reply }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, { text: `❌ Order Gagal: ${res?.message || 'Stok kosong atau saldo kurang.'}` }, { quoted: msg });
        }
        return true;
    }

    // 4. CEK OTP (.otp atau .sms)
    if (command === '.otp' || command === '.sms') {
        // Ambil ID dari argumen atau dari memori terakhir
        let orderId = args[0] || activeOrders[jid];

        if (!orderId) {
            await sock.sendMessage(jid, { text: '⚠️ Tidak ada pesanan aktif. Masukkan ID pesanan: *.otp <order_id>*' }, { quoted: msg });
            return true;
        }

        await sock.sendMessage(jid, { text: `⏳ Memantau SMS untuk Order ${orderId} (Timeout 60s)...` }, { quoted: msg });

        const startTime = Date.now();
        const timeout = 120000; // 60 detik

        while (Date.now() - startTime < timeout) {
            const res = await callApi('/sms.php', { id: orderId });

            if (res && res.success) {
                if (res.data && res.data.otp) {
                    await sock.sendMessage(jid, { text: `📩 *SMS DITERIMA!*\n\nKode OTP: *${res.data.otp}*\nID Order: ${orderId}` }, { quoted: msg });
                    return true;
                }
                // Jika belum ada, lanjut loop (tunggu)
            } else {
                // Jika API error (misal order expired/cancel), stop loop
                await sock.sendMessage(jid, { text: `⚠️ Status: ${res?.message || 'Gagal cek'}` }, { quoted: msg });
                return true;
            }
            await sleep(5000); // Cek setiap 5 detik
        }
        
        await sock.sendMessage(jid, { text: `⚠️ Waktu habis. Belum ada SMS masuk.\nKetik *.otp* lagi untuk lanjut memantau.` }, { quoted: msg });
        return true;
    }

    // 5. CANCEL ORDER (.cancel)
    if (command === '.cancel') {
        let orderId = args[0] || activeOrders[jid];

        if (!orderId) {
            await sock.sendMessage(jid, { text: '⚠️ Tidak ada pesanan aktif untuk dibatalkan.' }, { quoted: msg });
            return true;
        }

        await sock.sendMessage(jid, { text: `🔄 Membatalkan pesanan ${orderId}...` }, { quoted: msg });
        const res = await callApi('/cancel.php', { id: orderId });

        if (res && res.success) {
            delete activeOrders[jid]; // Hapus dari memori
            await sock.sendMessage(jid, { text: `✅ *Pesanan Dibatalkan*\nDana dikembalikan: Rp ${res.data.refunded_amount}` }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, { text: `❌ Gagal cancel: ${res?.message}` }, { quoted: msg });
        }
        return true;
    }

    return false; // Bukan perintah SMS, kembalikan ke bot utama
}

module.exports = { handleCommand };
