const fs = require('fs');
const path = require('path');

/**
 * Modul untuk menangani menu CCTV
 * @param {object} sock - Socket koneksi WA
 * @param {string} from - ID pengirim pesan (jid)
 * @param {object} m - Objek pesan asli (quoted)
 */
const handleCctvMenu = async (sock, from, m) => {
    const captionText = `*CCTV MONITORING*\n\n` +
                        `Berikut adalah akses login CCTV:\n` +
                        `👤 *User:* admin\n` +
                        `🔑 *Pass:* 3dp@jkt2`;

    try {
        await sock.sendMessage(from, { text: '⏳ Sedang mengambil data qr dan password...' }, { quoted: m });
        await sock.sendMessage(from, { 
            image: fs.readFileSync(path.join(__dirname, 'cctv.png')), 
            caption: captionText 
        }, { quoted: m });
    } catch (error) {
        console.error('[ERROR] Gagal mengirim menu CCTV:', error);
        await sock.sendMessage(from, { text: `⚠️ Gagal memuat gambar. Berikut akses loginnya:\n\n${captionText}` }, { quoted: m });
    }
};

module.exports = { handleCctvMenu };