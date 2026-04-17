# 🤖 Groq AI Integration Guide

Integrasi Groq AI memungkinkan bot memberikan respons yang lebih intelligent untuk pencarian produk dan queries.

## 📋 Setup

### 1. Dapatkan Groq API Key

1. Buka: https://console.groq.com/keys
2. Login atau buat akun baru
3. Klik tombol "Create API Key"
4. Copy API Key yang dihasilkan

### 2. Set API Key ke Bot

Kirim ke bot dengan format:
```
.setgroq YOUR_API_KEY_HERE
```

**Contoh:**
```
.setgroq gsk_abcd1234efgh5678...
```

Bot akan merespons:
```
✅ Groq API Key tersimpan!
🤖 AI mode siap digunakan.
Gunakan .aimode untuk aktifkan AI.
```

### 3. Aktifkan AI Mode

Kirim command:
```
.aimode
```

Bot akan menampilkan:
```
✅ AI Mode ON. Setiap pesan bot akan ditandai dengan ikon AI.
```

## ✨ Fitur AI

### Saat AI Mode Aktif:

1. **Single PLU Search** - Hasil pencarian akan di-enhance dengan Groq:
   ```
   User: 20019930
   Bot: 🤖 *AI Response:*
   [Natural language enhancement dari Groq tentang produk]
   ```

2. **Pencarian Nama Produk** - Hasil `.cari` akan di-enhance:
   ```
   User: .cari minyak
   Bot: 🤖 *AI Response:*
   [Smart suggestions dari Groq]
   ```

3. **Error Messages** - Pesan error lebih helpful:
   ```
   User: .cari unknown-product
   Bot: 🤖 *AI Response:*
   [Groq suggestion untuk keyword lain]
   ```

## 📊 Model Tersedia

Groq mendukung beberapa model gratis:

| Model | Speed | Token | Best For |
|-------|-------|-------|----------|
| `llama-3.1-70b-versatile` | 🚀🚀🚀 | 8000 | Recommended (default) |
| `llama-3.1-8b-instant` | 🚀🚀🚀🚀 | 8000 | Faster, general tasks |
| `mixtral-8x7b-32768` | 🚀🚀 | 32000 | Long context |

### Ganti Model

Edit file `.env`:
```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

Restart bot untuk menggunakan model baru.

## 💾 Persistent Storage

- API Key disimpan di file `.env` di root directory
- File `.env` tidak di-commit ke git
- Aman dilakukan di VPS

## ⚙️ Troubleshooting

### "Groq API key tidak dikonfigurasi"
- Pastikan sudah jalankan `.setgroq <key>`
- Cek file `.env` ada dan berisi key yang valid

### "Error calling Groq API"
- Pastikan API key masih valid
- Check rate limit (Groq memiliki free tier rate limit)
- Coba lagi dalam beberapa saat

### AI Mode tidak berubah respons
- Pastikan Groq client terkonfigurasi
- Cek di server logs untuk error message
- Restart bot

## 🔐 Security Notes

- **Jangan share API Key** di public chat
- API Key bersifat sensitive - treat seperti password
- Gunakan `.setgroq` hanya di private chat
- File `.env` harus dalam `.gitignore`

## 📚 API Limits

Groq free tier:
- **30 requests per minute**
- **14,400 requests per day**
- **1 API Key per account**

Jika limit tercapai, tunggu rate limit reset atau upgrade account.

## 🎯 Usage Tips

1. **Short Queries** - Lebih cepat dan murah
2. **Active Learning** - Bot akan improve seiring waktu
3. **Combine Features** - Gunakan `.aimode` + `.bulk` + `.cari` untuk hasil terbaik
4. **Disable When Not Needed** - Gunakan `.aimode` untuk toggle off saat tidak butuh

---

**Need Help?**
- Groq Docs: https://console.groq.com/docs
- Report Issues: Check server logs untuk error details
