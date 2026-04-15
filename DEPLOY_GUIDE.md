# ✅ Setup Selesai! - Panduan Instalasi di VPS

Semua file sudah di-push ke GitHub. Berikut panduan singkat untuk instalasi di VPS.

---

## 🚀 3-Minute Quick Install

### Step 1: Login ke VPS
```bash
ssh user@vps-ip-address
```

### Step 2: Download & Install
```bash
# Clone repository
git clone https://github.com/inject29/botwa.git
cd botwa

# Jalankan setup script
bash setup-vps.sh
```

### Step 3: Prepare Database
```bash
# Copy products.db yang sudah ada
# (minta dari owner / Administrator)
# Letakkan file di folder botwa/
```

### Step 4: Start Bot
```bash
# Option A: Simple (untuk testing)
npm start

# Option B: PM2 (untuk production)
pm2 start index.js --name "botwa"
pm2 startup
pm2 save
```

---

## 📦 Apa yang Sudah Di-Deploy

### Dokumentasi Lengkap
- ✅ **README.md** - Overview & quick start
- ✅ **INSTALL_VPS.md** - Detail step-by-step instalasi
- ✅ **CHEATSHEET.md** - Quick reference commands
- ✅ **setup-vps.sh** - Automated setup script

### Code & Dependencies
- ✅ **package.json** - Cleaned dependencies + start script
- ✅ **index.js** - Main bot dengan features:
  - 🎨 Animations (progress bar, spinner, emoji)
  - 💬 Message reactions (⏳✅❌)
  - 🔍 Auto-detect multiple PLU (hidden feature)
  - 📡 Broadcast messaging
  - 🎯 AI mode toggle
  - ⚙️ Auto-react customizable

### Dependencies yang Terinstall
```
@rexxhayanasi/elaina-bail  - WhatsApp Baileys
axios                      - HTTP requests
bwip-js                    - Barcode generation
pino                       - Logging
qrcode                     - QR code generation
qrcode-terminal            - QR display
sharp                      - Image processing
sqlite3                    - Database
```

---

## 🎯 Features Yang Tersedia

### Product Lookup
- Single PLU: `20019930`
- Multiple PLU: `20019930 20019931 20019932` (auto-detect)
- Search: `.cari [nama]`
- Bulk generate: `.bulk [kode] [qty]`

### Messaging
- Send barcodes: `.aktiva`
- Auto broadcast saat online
- Auto reactions: ⏳ (start), ✅ (success), ❌ (error)

### Customization
- AI Mode: `.aimode` (on/off)
- Auto React: `.autoreact` (on/off)
- Set Emoji: `.setreact [emoji]`
- Pairing code: `.pair [nomor]`

---

## 📋 Pre-requisites untuk VPS

Sebelum install, siapkan:

1. **Server Linux** (Ubuntu 18+, Debian 10+)
   - RAM: Min 512MB
   - Disk: Min 1GB free
   - Internet: Stabil

2. **Database File** (products.db)
   - Get dari owner/admin
   - Letakkan di folder `botwa/`

3. **WhatsApp Account**
   - Nomor yang aktif di WhatsApp
   - Tidak login di device lain saat QR scan

4. **SSH Access** ke VPS

---

## 🔧 Langkah Instalasi Lengkap

### 1. System Preparation
```bash
ssh user@vps-ip
cd ~

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install build tools
sudo apt-get install -y build-essential python3 python3-dev
sudo apt-get install -y git sqlite3 libsqlite3-dev libvips libvips-dev
```

### 2. Install Node.js
```bash
# Option A: Using NVM (untuk multiple versions)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Option B: Direct install
sudo apt-get install -y nodejs npm
```

### 3. Clone & Install Bot
```bash
git clone https://github.com/inject29/botwa.git
cd botwa

# Install dependencies (may take 3-5 minutes)
npm install --build-from-source
```

### 4. Setup Database
```bash
# Download products.db dari local
# Jalankan di local machine:
scp products.db user@vps-ip:/home/user/botwa/

# Atau upload via FTP/SCP tool
```

### 5. Test Bot
```bash
# Start untuk test
npm start

# Scan QR code dengan WhatsApp
# Kirim "tes" ke bot untuk verify koneksi
# Jika OK, keluar dengan Ctrl+C
```

### 6. Setup Production
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start bot dengan PM2
pm2 start index.js --name "botwa" --max-memory-restart 256M

# Setup auto-start
pm2 startup
pm2 save

# Verify running
pm2 status
```

---

## 📊 Git Commits History

```
f7d927c ✨ Add setup script and cheatsheet for quick reference
a4afb51 📚 Add comprehensive documentation: README, INSTALL_VPS guide
2ed7ad3 📦 Update package.json: Clean dependencies, add start script
2e2cddc 🔄 Reset: Hapus sesi WhatsApp untuk fresh start
b2b05ea 🔐 Hide .plu from menu - now auto-detected as hidden feature
ab7a1e5 ✨ Add animations, auto-detect multiple PLU, and message reactions
```

---

## 🎮 Testing Bot Commands

Setelah bot online, test dengan:

```
Message: tes
Response: 🤖 Bot OK. Koneksi aktif. Halo [nama]!

Message: .menu
Response: Help menu dengan semua commands

Message: 20019930
Response: Product label dengan barcode

Message: .cari minyak
Response: List produk dengan nama "minyak"
```

---

## 🐛 Troubleshooting

### Bot tidak muncul QR code
```bash
# Restart dan jalankan
rm -rf baileys_auth_info
npm start
```

### Error during NPM install
```bash
# Rebuild
npm install --build-from-source

# Atau clear dan reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database not found
```bash
# Check if exists
file products.db

# If not, copy via SCP
scp /local/path/products.db user@vps:/path/to/botwa/
```

### High memory usage
```bash
# Restart dengan limit
pm2 restart botwa --max-memory-restart 256M
```

Untuk troubleshooting lebih detail, lihat: **INSTALL_VPS.md**

---

## 📞 Quick Commands Reference

```bash
# Start/Stop Bot
npm start                              # Test mode
pm2 start index.js --name "botwa"     # Production
pm2 stop botwa                        # Stop
pm2 restart botwa                     # Restart

# View Logs
pm2 logs botwa                        # Real-time logs
tail -f ~/.pm2/logs/botwa-error.log  # Error logs

# Database
sqlite3 products.db ".tables"         # Check tables
sqlite3 products.db "SELECT COUNT(*) FROM products;"

# Backup
tar -czf backup-$(date +%Y%m%d).tar.gz /path/to/botwa/

# Update
cd botwa && git pull
npm update --save
pm2 restart botwa
```

Lebih detail: **CHEATSHEET.md**

---

## ✅ Setup Checklist

- [ ] VPS sudah siap (OS, RAM, Disk)
- [ ] SSH access verify
- [ ] Node.js v14+ installed
- [ ] Bot repository cloned
- [ ] Dependencies installed
- [ ] products.db copied
- [ ] Bot testing OK (npm start)
- [ ] PM2 setup complete
- [ ] Auto-start configured
- [ ] Logs monitoring setup
- [ ] Backup strategy planned

---

## 📖 Dokumentasi File

| File | Tujuan |
|------|--------|
| README.md | Overview & features |
| INSTALL_VPS.md | Detail instalasi step-by-step |
| CHEATSHEET.md | Quick commands reference |
| setup-vps.sh | Automated setup script |
| ANIMATIONS_IMPLEMENTED.md | Animation system docs |
| package.json | Dependencies & scripts |
| index.js | Main bot code |
| sms_service.js | SMS integration |
| cctv_service.js | CCTV integration |
| listing_service.js | Listing integration |
| indomaret_service.js | Indomaret integration |

---

## 🔐 Security Tips

1. **Protect Session**: Jangan share `baileys_auth_info/`
2. **Database**: Jangan public `products.db` jika sensitif
3. **SSH**: Gunakan SSH key, bukan password
4. **Monitoring**: Regular check logs untuk anomaly
5. **Backup**: Daily backup untuk `products.db`
6. **Updates**: Regular update Node.js & dependencies

---

## 📞 Need Help?

1. Check: **CHEATSHEET.md** untuk common commands
2. Check: **INSTALL_VPS.md** untuk detail troubleshooting
3. View logs: `pm2 logs botwa`
4. Manual debug: `node -e "require('./index.js')"`

---

## 🎉 Selesai!

Bot mu siap di-deploy ke VPS! 

Repository: https://github.com/inject29/botwa

**Happy deploying!** 🚀

---

**Version**: 1.0.0 | **Last Updated**: April 2026 | **Status**: ✅ Ready for VPS Deployment
