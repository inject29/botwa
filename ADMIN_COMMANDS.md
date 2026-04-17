# 🔐 Admin Commands (Tersembunyi)

⚠️ **Internal Documentation Only - Jangan Share di Public**

Perintah-perintah ini adalah untuk admin/developer dan **TIDAK ditampilkan** di menu publik.

---

## 🔑 Kategori: Setup & Configuration

### `.setgroq <api_key>`
**Fungsi:** Set Groq API Key untuk fitur AI

**Format:**
```
.setgroq gsk_abcd1234efgh5678...
```

**Response:**
```
✅ Groq API Key tersimpan!
🤖 AI mode siap digunakan.
Gunakan .aimode untuk aktifkan AI.
```

**Catatan:**
- ⚠️ Jangan share API key di group chat
- 🔒 API key disimpan di `.env` (protected)
- 💡 Hanya perlu di-set sekali saja

---

### `.pair <nomor> [key]`
**Fungsi:** Generate pairing code untuk device baru

**Format:**
```
.pair 6281234567890 ELAINA01
```

**Response:**
```
⏳ Meminta pairing code untuk 6281234567890...
✅ Pairing Code untuk 6281234567890:
123-456-789

Gunakan kode ini pada device yang ingin kamu pair.
```

**Catatan:**
- ⚠️ Hanya diperlukan untuk setup awal bot
- 🔒 Sensitive - jangan bagikan pairing code
- 📱 Gunakan di private chat saja

---

## 🎛️ Kategori: Features Toggle

### `.aimode`
**Fungsi:** Toggle AI response enhancement

**Format:**
```
.aimode
```

**Response (ON):**
```
✅ AI Mode ON. Setiap pesan bot akan ditandai dengan ikon AI.
```

**Response (OFF):**
```
❌ AI Mode OFF.
```

**Catatan:**
- 🤖 Saat ON: Groq AI akan enhance responses
- ⚙️ Perlu Groq API Key sudah di-set
- 💰 Menggunakan API limit Groq

---

### `.autoreact`
**Fungsi:** Toggle auto-reaction ke setiap pesan

**Format:**
```
.autoreact
```

**Response (ON):**
```
✅ Auto React ON (Emoji: ❤️)
```

**Response (OFF):**
```
❌ Auto React OFF
```

**Catatan:**
- ❓ Default: OFF (tidak auto-react ke semua pesan)
- ✨ Reactions hanya di saat search/command
- 🎯 Lebih control dan tidak spam

---

### `.setreact <emoji>`
**Fungsi:** Set emoji untuk auto-reaction

**Format:**
```
.setreact 👍
```

**Response:**
```
✅ Emoji react diubah menjadi: 👍
```

**Catatan:**
- 🎨 Gunakan single emoji saja
- 📋 Supported: semua Unicode emoji
- 💡 Di-gunakan saat `.autoreact ON`

---

## 💾 Kategori: Cache Management

### `.cache`
**Fungsi:** Lihat cache statistics dan efficiency

**Format:**
```
.cache
```

**Response:**
```
📊 *Cache Statistics:*
✅ Total cached: 5 responses
🎯 Cache hits: 12 times
💰 API calls saved: 12
📈 Average efficiency: 2.4x

📝 *Commands:*
• .cache - Tampilkan statistik
• .cache stats - Detail cache entries
• .cache clear - Hapus semua cache
• .cache enable - Aktifkan cache
• .cache disable - Nonaktifkan cache
```

---

### `.cache stats`
**Fungsi:** Detail setiap cache entry

**Format:**
```
.cache stats
```

**Response:**
```
📊 Cache Statistics:
✅ Total cached: 3 responses
🎯 Cache hits: 8 times
💰 API calls saved: 8

📋 Entries:
1. "Kamu adalah asisten..." - 3 hits
2. "Kamu adalah asisten..." - 2 hits
3. "Kamu adalah asisten..." - 3 hits
```

---

### `.cache clear`
**Fungsi:** Hapus semua cache entries

**Format:**
```
.cache clear
```

**Response:**
```
🧹 Cache telah dihapus!

💡 Semua cached AI responses dihapus. 
Cache akan diisi ulang saat ada pencarian baru.
```

**Catatan:**
- ⚠️ Tidak bisa di-undo
- 🔄 Cache akan rebuild otomatis
- 💡 Gunakan saat ada update database

---

### `.cache enable`
**Fungsi:** Aktifkan caching system

**Format:**
```
.cache enable
```

**Response:**
```
✅ Cache ENABLED

Bot akan menggunakan cache untuk menghemat API calls.
```

---

### `.cache disable`
**Fungsi:** Non-aktifkan caching (use API setiap kali)

**Format:**
```
.cache disable
```

**Response:**
```
⛔ Cache DISABLED

Bot akan memanggil Groq API untuk setiap request tanpa cache.
```

**Catatan:**
- 💰 API limit akan cepat habis
- ⚠️ Hanya gunakan untuk debugging/testing

---

## 📦 Kategori: Bulk Operations

### `.bulk <kode> <jumlah>`
**Fungsi:** Generate barcode label dengan quantity

**Format:**
```
.bulk 20019930 25
```

**Response:**
```
[Progress bar animation]

✅ Produk Ditemukan oleh Admin: *MINYAK GORENG 1L*
Kode: 20019930 (Qty: 25)

[Barcode image dengan label]
```

**Catatan:**
- 🖼️ Generate image barcode dengan quantity info
- 📊 Support up to 999 quantity
- 💾 Temporary image file di-delete after send

---

### `.aktiva`
**Fungsi:** Kirim semua barcode files dari folder

**Format:**
```
.aktiva
```

**Response:**
```
⏳ [Progress bar animation]

✅ Selesai memproses 45 file.

[45 barcode images dikirim]
```

**Catatan:**
- 📁 Baca dari folder `Barcode_generator/`
- 🔄 Batch send dengan delay 800ms per file
- 📱 Jika dari group → dikirim ke private chat

---

## 🎫 Kategori: SMS Integration

### Reference: SMS Commands
SMS commands ditangani oleh module terpisah `sms_service.js`.

Lihat dokumentasi: [SMS_SERVICE.md](SMS_SERVICE.md)

---

## 🎥 Kategori: CCTV Integration

### Reference: CCTV Commands
CCTV commands ditangani oleh module terpisah `cctv_service.js`.

Gunakan:
```
.cctv
```

---

## 🔒 Access Control Rules

Commands keamanan tertentu perlu protection:

| Command | Private Only | Admin Only | Rate Limit |
|---------|-------------|-----------|-----------|
| `.setgroq` | ✅ | ✅ | 1x per session |
| `.pair` | ✅ | ✅ | 1x per session |
| `.cache clear` | ✅ | ⚠️ | 1x per day |
| `.cache disable` | ✅ | ⚠️ | Unrestricted |
| `.bulk` | - | - | Unrestricted |
| `.aktiva` | ⚠️ | - | Personal only |

---

## 📋 Public Commands (Ditampilkan di .menu)

Berikut commands yang ditampilkan ke public:

### Basic Search
- Kirim angka PLU/Barcode
- `.cari <nama produk>`

### Utilities
- `.menu` / `.help`
- `.cctv` (jika enabled)

### Fitur
- `.bulk` (documented tapi tidak di-highlight)
- `.aktiva` (documented tapi tidak di-highlight)

---

## 🚨 Security Best Practices

1. **Jangan share di Group:**
   - `.setgroq` commands
   - `.pair` codes
   - Cache statistics (bisa lihat query patterns)

2. **Jangan expose:**
   - API Keys
   - Pairing codes
   - .env file contents

3. **Monitor:**
   - `.cache stats` untuk anomali
   - Rate limiting untuk abuse
   - Access logs di console

4. **Maintenance:**
   - Regular `.cache clear`
   - Monitor API limit usage
   - Check error logs

---

## 🐛 Troubleshooting

### Command tidak merespons?
- Check console logs untuk error
- Pastikan credentials/API key valid
- Coba di private chat dulu

### Cache atau API issue?
```
.cache clear
```
Reset cache dan try again.

### Perlu help?
- Baca file `.env.example` untuk config
- Check `GROQ_AI_SETUP.md` untuk AI setup
- Check `CACHE_GUIDE.md` untuk caching

---

## 📝 Update Log

**v1.0 (2026-04-17)**
- Initial admin commands documentation
- Added cache management commands
- Added Groq AI commands
- Added hidden command structure

---

⚠️ **CONFIDENTIAL - Internal Use Only**
