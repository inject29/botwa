# 💾 AI Cache System Guide

Bot sekarang dilengkapi dengan **intelligent caching system** untuk menghemat API limit Groq.

## 🎯 Apa itu Cache?

Cache menyimpan responses dari Groq AI sehingga:
- ✅ Pertanyaan yang sama tidak memerlukan API call lagi
- ✅ Menghemat API quota (30 req/min, 14,400 req/hari)
- ✅ Response lebih cepat (instant dari local file)
- ✅ Dapat di-manage dari WhatsApp

## 📊 Cara Kerja

```
User: Cari "Minyak"
  ↓
Bot: Check cache...
  ├─ CACHE HIT → Ambil dari ai_cache.json (instant)
  └─ CACHE MISS → Call Groq API → Save ke cache
```

## ⚙️ Commands

### 1. **View Cache Statistics**
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
```

### 2. **Detail Cache Entries**
```
.cache stats
```
**Response:**
```
📊 Cache Statistics:
✅ Total cached: 5 responses
🎯 Cache hits: 12 times
💰 API calls saved: 12
📈 Average efficiency: 2.4x

📋 Entries:
1. "Kamu adalah asisten WhatsApp bot..." - 3 hits
2. "Kamu adalah asisten WhatsApp bot..." - 2 hits
...
```

### 3. **Clear All Cache**
```
.cache clear
```
**Response:**
```
🧹 Cache telah dihapus!

💡 Semua cached AI responses dihapus. 
Cache akan diisi ulang saat ada pencarian baru.
```

### 4. **Disable Cache** (Use API setiap kali)
```
.cache disable
```
**Response:**
```
⛔ Cache DISABLED

Bot akan memanggil Groq API untuk setiap request tanpa cache.
```

### 5. **Enable Cache**
```
.cache enable
```
**Response:**
```
✅ Cache ENABLED

Bot akan menggunakan cache untuk menghemat API calls.
```

## 🔧 Configuration

Edit file `.env`:

```env
# Cache enabled (default: true)
CACHE_ENABLED=true

# Cache expiry time in hours (default: 24)
CACHE_EXPIRY_HOURS=24
```

## 📂 Cache Storage

- **File**: `ai_cache.json` (di root directory)
- **Format**: JSON dengan MD5 hash key
- **Size**: Bergantung jumlah queries (tipically < 1MB)
- **Auto-cleanup**: Cache otomatis di-delete jika expired

### Contoh struktur:
```json
{
  "5d41402abc4b2a76b9719d911017c592": {
    "prompt": "Kamu adalah asisten WhatsApp bot...",
    "response": "Minyak adalah salah satu produk penting...",
    "timestamp": "2026-04-17T10:30:00.000Z",
    "hits": 3
  }
}
```

## 💡 Tips Optimization

### 1. **Monitor Cache Performance**
```
User: .cache
Bot: [shows stats dengan API calls saved]
```

### 2. **Clear Old Cache**
```
User: .cache clear
```
Clearing cache saat bot di-deploy atau setelah update database.

### 3. **Disable Untuk Testing**
```
User: .cache disable
Bot: Direct calls ke Groq (untuk testing)

User: .cache enable
Bot: Resume dengan cache
```

### 4. **Batch Operations**
Ketika user melakukan multiple searches:
```
Search 1: 20019930 → API Call → Cache saved
Search 2: Minyak → API Call → Cache saved
Search 3: 20019930 → Cache HIT ✨
```

## 📈 Expected Savings

**Scenario: 100 daily searches**

### Tanpa Cache:
```
100 searches = 100 API calls
Cost: High (mendekati rate limit)
```

### Dengan Cache (2x average efficiency):
```
100 searches = 50 unique queries = ~50 API calls
Savings: 50% dari total calls
```

**Realistis:**
- Day 1: 100 API calls (building cache)
- Day 2-30: ~30-50 API calls per day (cache density meningkat)
- **Monthly savings: 60-70% dari API calls**

## 🐛 Troubleshooting

### Cache tidak tersimpan?
- Check file permissions di directory
- Pastikan `CACHE_ENABLED=true` di `.env`
- Check disk space

### Cache hit tapi response lama?
- File `ai_cache.json` mungkin terlalu besar
- Jalankan `.cache clear` untuk reset
- Check system performance

### Ingin rebuild cache?
```
.cache clear
```
Cache akan dibangun ulang dari fresh queries.

## 🔒 Security

- Cache hanya menyimpan AI responses (bukan sensitive data)
- `ai_cache.json` di-ignore dari git
- API key tersimpan terpisah di `.env`
- Safe untuk production

## 🚀 Future Improvements

- [ ] Persistent cache ke database
- [ ] TTL (Time-to-Live) per entry
- [ ] Cache compression
- [ ] Distributed cache untuk multi-instance

---

**Tips:** Monitor `.cache` statistics secara berkala untuk memahami pattern queries dan optimize cache strategy! 📊
