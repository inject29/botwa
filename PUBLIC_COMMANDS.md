# 📋 Public Commands (Safe to Share)

Perintah-perintah ini **aman ditampilkan** di public chats dan groups.

---

## 🔍 Basic Search Commands

### PLU/Barcode Search (Single or Multiple)
**Gunakan:** Kirim angka PLU atau barcode langsung

**Format:**
```
20019930                              (single)
20019930 20019931 20019932           (multiple - space separated)
20019930.20019931.20019932           (multiple - dot separated)
20019930
20019931                              (multiple - newline separated)
```

**Response:**
```
[Progress bar animation]
✅ Produk Ditemukan oleh Budi: 20019930
[Gambar barcode dengan label]
```

**Features:**
- 🎯 Auto-detect single atau multiple codes
- ⏳ Progress bar animation
- ✅ Auto-reaction saat operasi selesai
- 🤖 AI enhancement (jika AI mode ON)

---

### Search by Product Name
**Gunakan:** `.cari <nama_produk>`

**Format:**
```
.cari minyak
.cari gula pasir
.cari beras putih
```

**Response:**
```
🔎 *Hasil Pencarian oleh Budi: "minyak"*
Ditemukan 5 produk:

• *MINYAK GORENG 2L*
  PLU: 20019930 | Barcode: 8992121012345

• *MINYAK GORENG 1L*
  PLU: 20019931 | Barcode: 8992121012346

...

_Kirim kode PLU di atas untuk melihat gambar._
```

**Features:**
- 🔎 LIKE-based search (partial match)
- 📊 Max 10 results
- 🤖 AI enhancement (jika AI mode ON)
- ⏳ Loading spinner animation

---

## 📦 Bulk Operations

### Generate Label with Quantity
**Gunakan:** `.bulk <kode> <jumlah>`

**Format:**
```
.bulk 20019930 25
.bulk 89912345 100
```

**Response:**
```
[Progress bar animation]
✅ Produk Ditemukan oleh Budi: *MINYAK GORENG 1L*
Kode: 20019930 (Qty: 25)

[Gambar barcode dengan info quantity]
```

**Catatan:**
- 📊 Support up to 999 quantity
- 🖼️ Barcode image dengan label quantity
- ⚙️ Automatic fallback jika produk tidak di-database

---

### Send All Barcodes from Folder
**Gunakan:** `.aktiva`

**Format:**
```
.aktiva
```

**Response:**
```
[Progress bar animation]
📤 Mengirim 45 barcode dari folder Barcode_generator...

[45 barcode images dikirim dengan delay]

✅ Selesai memproses 45 kode.
```

**Catatan:**
- 📁 Baca file dari `Barcode_generator/`
- 🔄 Batch send dengan 800ms delay per file
- 📱 Jika dari group → dikirim ke private chat user

---

## 🎯 Utility Commands

### Help Menu
**Gunakan:** `.menu` atau `.help`

**Format:**
```
.menu
```

**Response:**
Menampilkan menu sesuai konteks:
- **Di Private Chat:** Menampilkan admin menu
- **Di Group:** Menampilkan public menu saja

---

### Check Bot Status
**Gunakan:** `tes`

**Format:**
```
tes
```

**Response:**
```
🤖 Bot OK. Koneksi aktif. Halo Budi!
```

---

## 🎥 CCTV Integration (If Enabled)

### CCTV Menu
**Gunakan:** `.cctv`

**Format:**
```
.cctv
```

**Response:**
```
🎥 CCTV Access Menu

[Displayed jika CCTV module terinstall]
```

---

## 📋 Command Summary

| Command | Context | Usage |
|---------|---------|-------|
| Angka PLU | Public | Primary feature |
| `.cari <nama>` | Public | Product name search |
| `.bulk <kode> <qty>` | Public | Bulk label generation |
| `.aktiva` | Public | Batch send barcodes |
| `.menu` | Public | Help menu |
| `tes` | Public | Status check |
| `.cctv` | Public* | CCTV access (*if enabled) |

---

## 💡 Usage Tips

### 1. **Efficient Searching**
```
❌ DON'T: .cari produk yang tidak jelas
✅ DO: .cari minyak goreng 2L
```

### 2. **Batch Operations**
```
✅ GOOD: .bulk 20019930 50
❌ BAD: .bulk 20019930 5000 (terlalu banyak)
```

### 3. **Multiple Codes**
```
✅ GOOD: 20019930 20019931 20019932
❌ BAD: Lebih dari 10 kode sekaligus (rate limit)
```

### 4. **Group Safety**
```
✅ GOOD: Di-share di public group
❌ BAD: Jangan panggil admin commands di group
```

---

## ⚡ Performance Tips

- **Cache Enabled:** Repeated searches lebih cepat
- **Batch Process:** `.aktiva` lama tapi efisien
- **Multiple Codes:** Delay 800ms per kode untuk stability

---

## 🚫 Commands (NOT Public Friendly)

Jangan share di group (sensitive/admin only):
- ~~`.setgroq`~~ - API Key setup
- ~~`.pair`~~ - Device pairing
- ~~`.cache clear`~~ - Cache management
- ~~`.aimode`~~ - AI toggle
- ~~`.autoreact`~~ - React toggle
- ~~`.setreact`~~ - Emoji config

---

## 📞 Support

Untuk bantuan teknis:
1. Coba command `.menu`
2. Check dokumentasi lengkap
3. Hubungi admin/developer

---

**Last Updated:** 2026-04-17
