const axios = require('axios');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Gunakan plugin stealth agar tidak terdeteksi sebagai bot
puppeteer.use(StealthPlugin());

/**
 * MODUL INTEGRASI KLIK INDOMARET (Private API)
 * Menggunakan endpoint catalog-xpress
 * Fitur: Auto Token & Search by PLU/Name
 */

// --- KONFIGURASI ---
const BASE_URL = 'https://ap-mc.klikindomaret.com/assets-klikidmgroceries/api/get/catalog-xpress/api/webapp/product/detail-page';
const SEARCH_PAGE_URL = 'https://www.klikindomaret.com/search';

// Cache Token agar tidak membuka browser setiap kali request
let CACHED_TOKEN = null;
let TOKEN_EXPIRY = 0;

// Parameter Lokasi (Hardcoded sesuai log Anda)
const DEFAULT_PARAMS = {
    storeCode: 'TCRB',
    latitude: '-7.1561275',
    longitude: '109.26273',
    mode: 'DELIVERY',
    districtId: '141300950'
};

// --- FUNGSI AUTO TOKEN (PUPPETEER) ---
async function getDynamicToken() {
    // Jika token masih ada dan belum expired (valid 50 menit), pakai yang lama
    if (CACHED_TOKEN && Date.now() < TOKEN_EXPIRY) {
        return CACHED_TOKEN;
    }

    console.log('🔄 Membuka browser background untuk mengambil Token baru...');
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new', // Mode tanpa tampilan (background)
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();
        
        // Optimasi: Block gambar/font agar hemat kuota & cepat
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Listener: Tangkap header Authorization dari request yang keluar
        const tokenPromise = new Promise((resolve) => {
            page.on('request', (req) => {
                const headers = req.headers();
                if (headers['authorization'] && headers['authorization'].startsWith('Bearer')) {
                    resolve(headers['authorization']);
                }
            });
        });

        // Buka website asli
        await page.goto('https://www.klikindomaret.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Tunggu sampai token tertangkap (maksimal 20 detik)
        const token = await Promise.race([
            tokenPromise,
            new Promise(r => setTimeout(() => r(null), 20000))
        ]);

        if (token) {
            CACHED_TOKEN = token;
            TOKEN_EXPIRY = Date.now() + (50 * 60 * 1000); // Set expired 50 menit
            console.log('✅ Token baru berhasil didapatkan!');
        } else {
            console.error('❌ Gagal mendapatkan token dari traffic.');
        }

        return CACHED_TOKEN;

    } catch (err) {
        console.error('❌ Error Puppeteer:', err.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

async function getProductDetail(permalink) {
    try {
        // Ambil token otomatis
        const token = await getDynamicToken();
        if (!token) throw new Error("Gagal mendapatkan Authorization Token");

        const response = await axios.get(BASE_URL, {
            params: {
                ...DEFAULT_PARAMS,
                permalink: permalink
            },
            headers: {
                'Host': 'ap-mc.klikindomaret.com',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'x-correlation-id': '1f694784-b825-418c-9f24-a78774529216',
                'Authorization': token, // Gunakan token dinamis
                'apps': '{"app_version":"Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0","device_class":"browser|browser","device_family":"none","device_id":"6bad80b1-4e06-47e1-97be-2e3d37366e43","os_name":"Linux","os_version":"none"}',
                'Origin': 'https://www.klikindomaret.com',
                'Referer': 'https://www.klikindomaret.com/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
                'Te': 'trailers'
            }
        });
        return response.data;
    } catch (error) {
        console.error('❌ Indomaret API Error:', error.message);
        return null;
    }
}

async function getAutocomplete(keyword) {
    try {
        const token = await getDynamicToken();
        if (!token) throw new Error("Gagal mendapatkan Authorization Token");

        const response = await axios.get('https://ap-mc.klikindomaret.com/assets-klikidmsearch/api/get/catalog-xpress/api/webapp/search/autocomplete', {
            params: {
                ...DEFAULT_PARAMS,
                keyword: keyword
            },
            headers: {
                'Host': 'ap-mc.klikindomaret.com',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'x-correlation-id': '1f694784-b825-418c-9f24-a78774529216',
                'Authorization': token,
                'apps': '{"app_version":"Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0","device_class":"browser|browser","device_family":"none","device_id":"6bad80b1-4e06-47e1-97be-2e3d37366e43","os_name":"Linux","os_version":"none"}',
                'Origin': 'https://www.klikindomaret.com',
                'Referer': 'https://www.klikindomaret.com/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
                'Te': 'trailers'
            }
        });
        return response.data;
    } catch (error) {
        console.error('❌ Autocomplete API Error:', error.message);
        return null;
    }
}

// --- FUNGSI CARI PERMALINK DARI PLU/NAMA ---
async function searchProductPermalink(keyword) {
    let browser = null;
    try {
        // Gunakan Puppeteer karena Axios diblokir (403) oleh WAF/Cloudflare
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();
        
        // Optimasi: Block gambar/font agar hemat kuota & cepat
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        const searchUrl = `${SEARCH_PAGE_URL}/?key=${encodeURIComponent(keyword)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        const content = await page.content();
        const match = content.match(/href="\/product\/([^"]+)"/);
        if (match && match[1]) {
            return match[1]; // Mengembalikan permalink (misal: bimoli-minyak-goreng-2l)
        }
        return null;
    } catch (error) {
        console.error('❌ Search Error:', error.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

async function handleCommand(sock, jid, text, msg) {
    const command = text.split(' ')[0].toLowerCase();
    const args = text.split(' ').slice(1).join(' '); // Gabungkan sisa teks jadi satu string

    // Command: .indo <permalink/PLU/Nama>
    if (command === '.indo') {
        if (!args) {
            await sock.sendMessage(jid, { text: '⚠️ Masukkan PLU, Nama, atau Permalink.\nContoh: *.indo 1000351* atau *.indo bimoli*' }, { quoted: msg });
            return true;
        }

        let targetPermalink = args;
        
        // Jika input tidak terlihat seperti permalink (misal angka PLU atau ada spasi), cari dulu
        if (!args.includes('-') || /^\d+$/.test(args) || args.includes(' ')) {
            await sock.sendMessage(jid, { text: `🔎 Mencari produk: "${args}"...` }, { quoted: msg });
            const foundLink = await searchProductPermalink(args);
            
            if (foundLink) {
                targetPermalink = foundLink;
                // await sock.sendMessage(jid, { text: `✅ Ditemukan: ${foundLink}` }, { quoted: msg });
            } else {
                await sock.sendMessage(jid, { text: `❌ Produk "${args}" tidak ditemukan di pencarian.` }, { quoted: msg });
                return true;
            }
        }

        await sock.sendMessage(jid, { text: `🔄 Mengambil detail data...` }, { quoted: msg });

        const data = await getProductDetail(targetPermalink);

        if (data) {
            // Sesuaikan parsing JSON ini dengan struktur response asli API
            // Karena saya tidak melihat output JSON-nya, saya dump dulu datanya agar Anda bisa lihat isinya.
            // Nanti bisa dirapikan tampilannya.
            const jsonString = JSON.stringify(data, null, 2);
            
            // Kirim hasil (potong jika terlalu panjang)
            const reply = `🛒 *Data Produk Indomaret*\n\n${jsonString.substring(0, 2000)}`;
            await sock.sendMessage(jid, { text: reply }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, { text: '❌ Gagal mengambil data. Cek log console (mungkin token expired).' }, { quoted: msg });
        }
        return true;
    }

    // Command: .search <keyword>
    if (command === '.search') {
        if (!args) {
            await sock.sendMessage(jid, { text: '⚠️ Masukkan keyword untuk pencarian.\nContoh: *.search bimoli*' }, { quoted: msg });
            return true;
        }
        await sock.sendMessage(jid, { text: `🔎 Mencari produk: "${args}"...` }, { quoted: msg });
        const data = await getAutocomplete(args);
        if (data && data.data) {
            const { suggestedKeywords, products } = data.data;
            let reply = `🔍 *Hasil Autocomplete untuk "${args}"*\n\n`;
            if (suggestedKeywords && suggestedKeywords.length > 0) {
                reply += `💡 *Saran Kata Kunci:* ${suggestedKeywords.join(', ')}\n\n`;
            }
            if (products && products.length > 0) {
                reply += `🛒 *Produk Ditemukan:*\n`;
                products.forEach((product, index) => {
                    reply += `${index + 1}. *${product.productName}*\n   PLU: ${product.plu}\n   Harga: Rp ${product.finalPrice.toLocaleString('id-ID')} (Diskon: ${product.discountText})\n   Permalink: ${product.permalink}\n\n`;
                });
            } else {
                reply += `❌ Tidak ada produk ditemukan.\n`;
            }
            await sock.sendMessage(jid, { text: reply }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, { text: '❌ Gagal mengambil data autocomplete.' }, { quoted: msg });
        }
        return true;
    }

    return false;
}

module.exports = { handleCommand };