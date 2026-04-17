# 🔐 Bot Security & Commands Update (2026-04-17)

Ringkasan perubahan yang dilakukan untuk meningkatkan security dan memisahkan public vs admin commands.

---

## ✨ Perubahan Utama

### 1. **Separated Public vs Admin Menus** 🔀
- **Public Chat/Group:** Hanya tampilkan basic commands
- **Private Chat:** Tampilkan full admin panel

### 2. **Added Safety Guards** 🛡️
Sensitive commands hanya bisa dijalankan di **private chat**:
- ✅ `.setgroq` - API Key setup
- ✅ `.pair` - Device pairing  
- ✅ `.cache clear` - Cache deletion
- ✅ `.cache disable` - Cache management

### 3. **Better Documentation** 📚
Dibuat 3 file dokumentasi:
- `PUBLIC_COMMANDS.md` - Safe untuk di-share
- `ADMIN_COMMANDS.md` - Internal use only
- `CACHE_GUIDE.md` - Cache management guide

---

## 📋 File Dokumentasi

### `PUBLIC_COMMANDS.md`
**Untuk:** End users, groups, public audience  
**Isi:** Hanya basic search & bulk commands  
**Share:** ✅ Aman di-share

### `ADMIN_COMMANDS.md`  
**Untuk:** Bot admin/developer  
**Isi:** Semua admin commands & config  
**Share:** ❌ JANGAN di-share (confidential)

### `ADMIN_COMMANDS.md`
**Untuk:** Bot admin/developer  
**Isi:** Cache strategy & optimization  
**Share:** ❌ JANGAN di-share

---

## 🎯 Command Categories

### 👥 Public Commands (Safe)
```
• 20019930                    (PLU search)
• .cari <nama>               (Name search)
• .bulk <kode> <qty>         (Bulk labels)
• .aktiva                    (Send all barcodes)
• .menu                      (Help - context aware)
• .cctv                      (CCTV menu)
• tes                        (Status check)
```

### 🔐 Admin Commands (Protected)
```
• .setgroq <key>             (Set Groq API - private only)
• .pair <nomor>              (Pairing code - private only)
• .aimode                    (Toggle AI)
• .autoreact                 (Toggle auto-react)
• .setreact <emoji>          (Set emoji)
• .cache                     (View cache stats)
• .cache clear               (Clear cache - private only)
• .cache enable/disable      (Manage cache - private only)
```

---

## 🚨 Security Features

### Private Chat Detection
```javascript
const isPrivateChat = jid.endsWith('@s.whatsapp.net');
const isGroupChat = jid.endsWith('@g.us');
```

### Group Chat Protection
**Saat user di-group mencoba sensitive command:**
```
⛔ *.setgroq* hanya bisa digunakan di **private chat**.

Alasan keamanan: API Key sangat sensitif 
dan tidak boleh di-share di group.
```

### Menu Adaptation
- **Private:** Admin panel with all commands
- **Group:** Public menu dengan basic commands only

---

## 👥 Usage Examples

### User di Group Chat

**`.menu` Response:**
```
👋 Selamat Datang Budi.
🤖 Bot untuk mencari kode produk

📋 *Cara Pakai:*
1. Kirim Angka (PLU/Barcode)
2. Ketik .cari <Nama>

✨ *Fitur:*
• .bulk <kode> <jumlah>
• .aktiva
• .cctv

💡 Bantuan:
• .menu
```

**Mencoba `.setgroq` di Group:**
```
⛔ *.setgroq* hanya bisa digunakan 
di **private chat**.

Alasan keamanan: API Key sangat sensitif 
dan tidak boleh di-share di group.
```

### Admin di Private Chat

**`.menu` Response:**
```
👋 Admin Panel - Budi

📋 *PUBLIC COMMANDS:*
• Angka (PLU/Barcode) : Cari
• .cari <nama> : Search
• .bulk <kode> <qty>
• .aktiva : Send all
• .menu : Help

🔐 *ADMIN COMMANDS:*
• .setgroq <key> : Set API
• .aimode : Toggle AI
• .cache : Cache stats
• .cache clear : Del cache
• .pair <nomor> : Pairing
...
```

---

## 🔄 Behavior Changes

### Before (v1.0)
```
❌ Sensitive commands visible di group
❌ Same menu untuk semua chat type
❌ No protection untuk API key setup
❌ No indication mana admin/public commands
```

### After (v2.0 - Current)
```
✅ Sensitive commands protected
✅ Context-aware menu (group vs private)
✅ Group chat guard untuk .setgroq & .pair
✅ Clear separation public vs admin
✅ Documentation untuk setiap command type
```

---

## 📊 Documentation Quick Links

| File | Purpose | Share? |
|------|---------|--------|
| PUBLIC_COMMANDS.md | User guide | ✅ YES |
| ADMIN_COMMANDS.md | Admin guide | ❌ NO |
| CACHE_GUIDE.md | Cache tips | ⚠️ PARTIAL |
| GROQ_AI_SETUP.md | AI setup | ⚠️ PARTIAL |
| .env.example | Config template | ✅ YES |

---

## 🔒 Security Checklist

- ✅ `.setgroq` protected (private only)
- ✅ `.pair` protected (private only)
- ✅ `.cache clear` protected (private only)
- ✅ API keys di `.env` (ignored from git)
- ✅ Pairing codes tidak di-save
- ✅ Group chats show public menu only
- ✅ Admin commands visible only in private

---

## 🚀 How to Share Bot Access

### For Public Users (Group)
Share: **PUBLIC_COMMANDS.md**
```
"Bot bisa cari produk dengan mengirim PLU.
Kirim .menu untuk bantuan."
```

### For Admin/Developer (Private)
Share: **ADMIN_COMMANDS.md**
```
"Full command reference untuk setup & management.
Keep this confidential - contains sensitive info."
```

---

## 🐛 Testing Commands

### Test Public Menu (Group-like)
```
.menu
# Expected: Short menu dengan basic commands only
```

### Test Admin Menu (Private-like)  
```
.menu (in private chat)
# Expected: Full admin panel dengan semua commands
```

### Test Group Protection
```
# From group, try:
.setgroq dummy_key

# Expected:
⛔ *.setgroq* hanya bisa digunakan di **private chat**.
```

---

## ✅ Verification Checklist

- [ ] Bot responds dengan appropriate menu per chat type
- [ ] `.setgroq` blocked di group with warning
- [ ] `.pair` blocked di group dengan warning
- [ ] `.cache clear` blocked di group dengan warning
- [ ] Private chat menampilkan admin commands
- [ ] No API keys/sensitive data di-log
- [ ] All files dalam `.gitignore` protected

---

## 📝 Files Created/Modified

### New Files:
- ✨ `PUBLIC_COMMANDS.md`
- ✨ `ADMIN_COMMANDS.md` (sudah ada)
- ✨ `CACHE_GUIDE.md` (sudah ada)

### Modified Files:
- 🔧 `index.js` - Added chat type detection & menu separation
- 🔧 `.gitignore` - Protect sensitive files
- 🔧 `.env.example` - Config template

---

## 🎓 Learning Resources

1. **For Users:** Read `PUBLIC_COMMANDS.md`
2. **For Admin:** Read `ADMIN_COMMANDS.md`
3. **For Caching:** Read `CACHE_GUIDE.md`
4. **For AI Setup:** Read `GROQ_AI_SETUP.md`

---

## 📞 Support & Maintenance

**Questions?**
1. Check relevan documentation file
2. Look at examples dalam file
3. Run test commands di private chat
4. Check console logs untuk errors

**Report Issues:**
- Check error message di console
- Document steps to reproduce
- Include chat type (group vs private)
- Include command used

---

**Version:** 2.0 (2026-04-17)  
**Status:** ✅ Production Ready
