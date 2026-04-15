# 🤖 Bot WhatsApp Elaina

Automated WhatsApp Bot dengan fitur product lookup, barcode generation, bulk messaging, dan integrasi SMS, CCTV, dan Listing.

## ✨ Fitur Utama

### 📦 Product Lookup
- **Single PLU**: Kirim angka untuk lihat product details
- **Multiple PLU**: Support space, dot, atau newline separator
- Auto-detect hingga 100+ kode sekaligus

### 🎫 Barcode Generation
- Generate label dengan barcode code128
- Composite dengan product image & info
- Quantity support (`.bulk` command)
- Batch barcode export (`.aktiva` command)

### 💬 Messaging & Broadcasting
- Broadcast ke recent chats otomatis saat bot online
- Message reactions (⏳ start, ✅ success, ❌ error)
- Auto-react emoji customizable

### 🎨 UI/UX
- **Progress bar animation**: Visual feedback untuk long operations
- **Spinner animation**: Loading indicators dengan Braille characters
- **Emoji animation**: Rotating emoji untuk sequential operations
- **Message editing**: In-place updates tanpa spam

### 🔍 Search Features
- `.cari [nama]`: Search produk by name
- Support fuzzy matching & LIMIT 10 hasil
- Quick PLU lookup

### 🔧 Integrasi Lainnya
- **SMS Service** (`.sms` command)
- **CCTV Access** (`.cctv` command)
- **Listing Integration** (auto caption)
- **Pairing Code** untuk setup multi-device

## 🚀 Quick Start

### Local Development
```bash
# 1. Clone repository
git clone https://github.com/inject29/botwa.git
cd botwa

# 2. Install dependencies
npm install

# 3. Run bot
npm start
```

### VPS Production
Lihat: [INSTALL_VPS.md](./INSTALL_VPS.md)

**Quick command**:
```bash
# Using PM2 (recommended)
npm install -g pm2
pm2 start index.js --name "botwa"
pm2 startup
pm2 save
```

## 📋 Kebutuhan

- **Node.js**: v14+ (v16+ recommended)
- **Database**: SQLite3 dengan `products.db`
- **Images**: Folder `Barcode_generator/` untuk barcode output
- **Internet**: Stabil untuk WhatsApp connection

## 📦 Dependencies

```json
{
  "@rexxhayanasi/elaina-bail": "^1.4.8",
  "axios": "^1.7.2",
  "bwip-js": "^2.0.10",
  "pino": "^8.17.2",
  "qrcode": "^1.5.1",
  "qrcode-terminal": "^0.12.0",
  "sharp": "^0.34.5",
  "sqlite3": "^5.1.6"
}
```

## 📖 Panduan Penggunaan

### Commands

| Command | Format | Deskripsi |
|---------|---------|----------|
| Single PLU | `20019930` | Lihat product label |
| Multiple PLU | `20019930 20019931 20019932` | Batch lookup dengan auto-detect |
| Search | `.cari [nama produk]` | Cari by nama |
| Bulk | `.bulk [kode] [qty]` | Generate dengan quantity |
| Aktiva | `.aktiva` | Kirim semua barcode dari folder |
| Menu | `.menu` | Tampilkan help |
| AI Mode | `.aimode` | Toggle AI response format |
| Auto React | `.autoreact` | Toggle auto emoji reactions |
| Set React | `.setreact [emoji]` | Custom reaction emoji |
| Pairing | `.pair [nomor] [key]` | Pairing code untuk multi-device |
| CCTV | `.cctv` | CCTV access menu |

### Separator Support
Multiple PLU bisa menggunakan:
- **Space**: `20019930 20019931 20019932`
- **Dot**: `20019930.20019931.20019932`
- **Newline**: (kirim dalam 3+ baris)

## 🎯 Fitur Animasi

### Progress Bar
Untuk long-running operations (bulk, multiple PLU):
```
[████░░░░░░░░░░░░░░] 25%
[████████░░░░░░░░░░] 50%
[████████████████░░░░] 75%
[████████████████████] 100%
```

### Spinner
Untuk quick search (`.cari`):
```
⠋ Searching...
⠙ Searching...
⠹ Searching...
⠸ Searching...
```

### Message Reactions
- ⏳ : Proses dimulai
- ✅ : Berhasil
- ❌ : Error/Tidak ditemukan

## 📁 File Structure

```
botwa/
├── index.js                    # Main bot logic
├── package.json                # Dependencies & config
├── products.db                 # SQLite database (REQUIRED)
├── .gitignore                  # Git ignore rules
├── README.md                   # This file
├── INSTALL_VPS.md              # VPS installation guide
├── ANIMATIONS_IMPLEMENTED.md   # Animation details
├── sms_service.js              # SMS integration module
├── indomaret_service.js        # Indomaret service module
├── cctv_service.js             # CCTV service module
├── listing_service.js          # Listing service module
├── baileys_auth_info/          # WhatsApp session (auto-created)
├── Barcode_generator/          # Generated barcodes folder
└── recent_chats.json           # Chat history for broadcast
```

## 🔐 Security

⚠️ **Important**: 
- Never commit `baileys_auth_info/` (session folder)
- Never share `products.db` if contains sensitive data
- All sensitive files are in `.gitignore`

## � Troubleshooting

### Sharp Build Error (glib-object.h)
**Error**: `fatal error: glib-object.h: No such file or directory`

**Fix**:
```bash
# Install missing development headers
sudo apt-get install -y libglib2.0-dev libvips-dev

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

**Complete guide**: [TROUBLESHOOTING_SHARP.md](./TROUBLESHOOTING_SHARP.md)

### Bot tidak connect
```bash
rm -rf baileys_auth_info
npm start
```

### Database tidak ditemukan
```bash
# Pastikan `products.db` ada di folder project
# Copy dari device lokal jika belum ada
scp products.db user@vps:/path/to/botwa/
```

Lebih detail: Lihat [INSTALL_VPS.md](./INSTALL_VPS.md#-troubleshooting)

## 📊 Performance Tips

1. **Use PM2** untuk auto-restart on crash
2. **Enable broadcast** untuk reach users efficiently
3. **Batch operations** dengan multiple PLU untuk efficiency
4. **Monitor logs** regulerly untuk debug issues

## 🔄 Recent Updates

- ✅ Custom animation system (progress bars, spinners)
- ✅ Multiple PLU auto-detection (dengan 3 separator types)
- ✅ Message reactions (⏳✅❌)
- ✅ Broadcast messaging otomatis
- ✅ Cleaned package.json with proper dependencies

## 📞 Support & Issues

1. Check logs: `pm2 logs botwa`
2. Verify database exists: `ls -la products.db`  
3. Update Node.js: `nvm install 18`
4. Clear cache: `npm cache clean --force`

## 📝 License

ISC

## 👤 Author

Elaina Bot Team

---

**Version**: 1.0.0 | **Last Updated**: April 2026
