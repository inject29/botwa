# 🚀 COMPLETE VPS SETUP GUIDE

Panduan lengkap menggunakan automated setup script untuk deploy bot WhatsApp di VPS dengan database import.

---

## 📋 Overview

Ada 2 script yang siap pakai:

| Script | Fungsi | Waktu |
|--------|--------|-------|
| `setup-complete-vps.sh` | Setup lengkap (dependencies + bot + PM2) | 5-10 menit |
| `import-database.sh` | Import database products.db | 1-2 menit |

---

## 🎯 Quick Start (5 Menit)

### Step 1: Siapkan Database di Local Machine
```bash
# Pastikan file products.db ada di lokal

# Cek ukuran
ls -lh products.db
```

### Step 2: Upload Database ke VPS

```bash
# Di local machine, upload database ke VPS
scp /path/to/products.db user@vps-ip:~/

# Verify upload
ssh user@vps-ip "ls -lh ~/products.db"
```

### Step 3: Run Complete Setup pada VPS

```bash
# SSH ke VPS
ssh user@vps-ip

# Download setup script
cd ~
curl -O https://raw.githubusercontent.com/inject29/botwa/main/setup-complete-vps.sh
chmod +x setup-complete-vps.sh

# Jalankan setup lengkap
./setup-complete-vps.sh

# Atau jika sudah punya script lokal:
bash setup-complete-vps.sh
```

**Total waktu setup: ~5-10 menit** ⏱️

### Step 4: Scan QR & Test Bot

```bash
# Lihat logs + QR code
pm2 logs botwa

# Scan QR dengan WhatsApp
# Tunggu sampai "Bot WhatsApp telah disambungkan"

# Test bot
# Kirim "tes" ke bot via WhatsApp
# Expected: "🤖 Bot OK. Koneksi aktif. Halo [nama]!"
```

Done! ✅

---

## 📖 Detailed Step-by-Step

### Prerequisites
Pastikan Anda punya:
- ✅ VPS dengan Linux (Ubuntu 18+, Debian 10+)
- ✅ SSH access ke VPS
- ✅ File `products.db` dari administrator
- ✅ 512MB+ RAM
- ✅ 1GB+ disk space

---

## 🔧 COMPLETE SETUP SCRIPT

### Apa yang dilakukan script?

```
✅ System Update                  (apt-get update/upgrade)
✅ Node.js Installation           (v20 LTS)
✅ Build Dependencies             (gcc, python3, etc)
✅ Sharp Dependencies             (libvips, glib libraries)
✅ SQLite Development Files       (libsqlite3-dev)
✅ Repository Clone               (github.com/inject29/botwa)
✅ NPM Dependencies               (npm install --build-from-source)
✅ Database Check                 (verify database integrity)
✅ PM2 Installation               (process manager)
✅ Bot Registration               (PM2 startup config)
✅ Auto-start Configuration       (sudo pm2 startup)
✅ Verification & Testing
✅ Summary & Next Steps
```

### Jalankan Script

```bash
# Download script (jika belum punya)
curl -O https://raw.githubusercontent.com/inject29/botwa/main/setup-complete-vps.sh
chmod +x setup-complete-vps.sh

# Jalankan dengan sudo (required untuk apt-get)
bash setup-complete-vps.sh

# Atau jika sudah punya file lokal
bash ./setup-complete-vps.sh
```

### Apa yang diharapkan

```
╔═══════════════════════════════════════════════════════════╗
║  🤖 Bot WhatsApp Elaina - COMPLETE VPS SETUP v1.0       ║
║  Automated Installation & Configuration Script           ║
╚═══════════════════════════════════════════════════════════╝

[14:32:01] 📋 STEP 1: System Update & Preparation
[14:32:10] ✅ System updated
[14:32:15] ✅ Base dependencies installed
...
[14:35:45] ✅ Setup completed successfully! 🎉
```

Script akan:
1. Minta konfirmasi jika ada issues
2. Menampilkan progress untuk setiap step
3. Automated semuanya - tinggal tunggu
4. Tampilkan summary dan next steps di akhir

---

## 💾 DATABASE IMPORT

### Opsi 1: Automatic (Integrated dalam setup)

Setup script akan otomatis:
1. Cek jika `products.db` ada di home directory
2. Tanya apakah mau import
3. Backup database lama (jika ada)
4. Copy ke bot directory
5. Verify database integrity

### Opsi 2: Manual Import

Jika database belum ada saat setup, import nanti:

```bash
# Copy database dari local
scp /path/to/products.db user@vps-ip:~/

# Import dengan script
bash ~/botwa/import-database.sh
# atau
bash ~/botwa/import-database.sh ~/botwa ~/products.db
```

### Opsi 3: Manual Copy

```bash
# SSH ke VPS
ssh user@vps-ip

# Copy database
cp ~/products.db ~/botwa/

# Verify
ls -lh ~/botwa/products.db
sqlite3 ~/botwa/products.db "SELECT COUNT(*) FROM products;"
```

---

## 📊 DATABASE VERIFICATION

### Check Database Size & Content

```bash
# Check file size
ls -lh ~/botwa/products.db

# Count products
sqlite3 ~/botwa/products.db "SELECT COUNT(*) FROM products;"

# Show first 5 products
sqlite3 ~/botwa/products.db "SELECT plu, barcode, nama FROM products LIMIT 5;"

# Show all tables
sqlite3 ~/botwa/products.db ".tables"
```

### Expected Output

```
products.db: ~50-500 MB (depending on your data)
Products count: 1000+ records
Tables: products (main table)
```

---

## 🎯 AFTER SETUP

### 1. First Run - Scan QR Code

```bash
# View logs with QR
pm2 logs botwa

# Expected output:
# [00:00:01] Bot WhatsApp telah disambungkan dan siap menerima pesan!
# [QR CODE WILL APPEAR HERE]
```

**Action**: Scan QR dengan WhatsApp pada phone yang berisi nomor bot

### 2. Test Bot

```bash
# Send message via WhatsApp:
# Message: tes
# Expected: 🤖 Bot OK. Koneksi aktif. Halo [nama]!

# Try database lookup:
# Message: 20019930 (example PLU)
# Expected: Product label image with barcode
```

### 3. Verify PM2 Setup

```bash
# Check if bot running
pm2 status

# Check if will auto-start after reboot
sudo pm2 save
sudo pm2 startup

# Monitor logs
pm2 logs botwa -f

# Stop/Start bot
pm2 stop botwa
pm2 start botwa
pm2 restart botwa
```

---

## 🔄 Common Post-Setup Tasks

### Update Bot

```bash
cd ~/botwa
git pull
npm install
pm2 restart botwa
```

### Backup Database

```bash
cp ~/botwa/products.db ~/botwa/products.db.backup.$(date +%Y%m%d)
```

### View Logs

```bash
# Real-time
pm2 logs botwa -f

# Last 50 lines
pm2 logs botwa --lines 50

# Save to file
pm2 logs botwa > botwa-logs.txt
```

### Troubleshoot Issues

```bash
# Check bot status
pm2 status

# View detailed logs
pm2 logs botwa

# If bot crashes
pm2 restart botwa

# Full system info
uname -a
node -v
npm -v
pm2 -v
```

---

## ⚠️ Troubleshooting

### Issue: Script fails with build error

```bash
# Usually Sharp build issue - verify dependencies
pkg-config --modversion libvips

# If missing:
sudo apt-get install -y libvips libvips-dev libglib2.0-dev

# Then rerun:
cd ~/botwa
rm -rf node_modules package-lock.json
npm install --build-from-source
```

### Issue: Database not found after setup

```bash
# Verify database path
ls -la ~/botwa/products.db

# If missing, import:
scp /local/path/products.db user@vps-ip:~/
ssh user@vps-ip "cp ~/products.db ~/botwa/"

# Restart bot
pm2 restart botwa
```

### Issue: Bot won't start

```bash
# Check logs
pm2 logs botwa

# Common fixes:
pm2 stop botwa
pm2 delete botwa
cd ~/botwa
npm install
pm2 start index.js --name "botwa"
```

### Issue: Out of memory

```bash
# Check current usage
free -h

# Restart with memory limit
pm2 stop botwa
pm2 start index.js --name "botwa" --max-memory-restart 256M
```

---

## 🎓 What Each Script Does

### setup-complete-vps.sh

```bash
1. Update system (apt-get)
   └─ Checks: Ubuntu/Debian
   └─ Updates: package lists + system

2. Install Node.js 20 LTS
   └─ Checks: if already installed
   └─ Offers: upgrade option
   └─ Verifies: node -v && npm -v

3. Install Sharp Dependencies ⭐ CRITICAL
   └─ libvips (image processing)
   └─ libglib2.0-dev (for Sharp to compile)
   └─ build-essential (gcc, g++, make)
   └─ sqlite3 dev files
   └─ Verifies: pkg-config --modversion libvips

4. Clone Repository
   └─ git clone https://github.com/inject29/botwa.git
   └─ Creates: ~/botwa directory

5. Install NPM Dependencies
   └─ npm install --build-from-source
   └─ Rebuilds: Sharp + SQLite3
   └─ Verifies: npm ls sharp

6. Setup Database
   └─ Checks: if products.db exists
   └─ Backup: existing database
   └─ Verify: database integrity with sqlite3

7. Configure PM2 (Auto-start)
   └─ Install: npm install -g pm2
   └─ Register: pm2 start index.js
   └─ Setup: pm2 startup (auto-restart on reboot)
   └─ Save: pm2 save

8. Verify Installation
   └─ Check: file structure
   └─ Check: PM2 running
   └─ Show: latest logs
   └─ Summary: what to do next
```

### import-database.sh

```bash
1. Verify Bot Directory
   └─ Checks: if ~/botwa/package.json exists

2. Find Database File
   └─ Looks in: current dir, home, bot dir
   └─ Asks: if multiple options

3. Backup Existing
   └─ Creates: ~/botwa/backups/ folder
   └─ Backup: existing products.db

4. Copy Database
   └─ Copies: new database to bot dir
   └─ Sets: proper permissions

5. Verify Integrity
   └─ Tests: sqlite3 .tables
   └─ Shows: database statistics
   └─ Counts: total products

6. Display Summary
   └─ File size, permissions
   └─ Database statistics
   └─ Next steps
```

---

## 📱 Testing Bot Features

Setelah setup, test fitur-fitur:

### Test 1: Connection
```
Message: tes
Expected: 🤖 Bot OK. Koneksi aktif. Halo [nama]!
```

### Test 2: Single PLU Lookup
```
Message: 20019930
Expected: Product label dengan barcode image
```

### Test 3: Help Menu
```
Message: .menu
Expected: List all commands
```

### Test 4: Search Product
```
Message: .cari minyak
Expected: List products dengan nama "minyak"
```

### Test 5: Bulk Generate
```
Message: .bulk 20019930 100
Expected: Label dengan quantity info
```

---

## 📚 Documentation Reference

Setelah setup, dokumentasi tersedia di:

```
~/botwa/README.md              - Overview & features
~/botwa/INSTALL_VPS.md         - Detail installation
~/botwa/UPDATE_VPS.md          - How to update bot
~/botwa/CHEATSHEET.md          - Quick commands
~/botwa/TROUBLESHOOTING_SHARP.md - Sharp specific issues
~/botwa/DEPLOY_GUIDE.md        - Deployment guide
```

---

## 🎉 Success Indicators

Setup adalah sukses jika Anda melihat:

✅ Script selesai dengan "Setup completed successfully!"
✅ Bot muncul di `pm2 status`
✅ QR code muncul di `pm2 logs botwa`
✅ Bot merespons "tes" dengan status OK
✅ Database file ada di `~/botwa/products.db`
✅ Bot merespons PLU lookups

---

## 🔒 Security Notes

⚠️ **Protect your sensitive files:**

```bash
# Don't share/commit:
- ~/botwa/baileys_auth_info/    (WhatsApp session)
- ~/botwa/products.db            (if contains sensitive data)

# Already protected by .gitignore ✓

# Backup important files
cp ~/.pm2/conf.js ~/.pm2/conf.js.backup
cp ~/botwa/products.db ~/botwa/products.db.backup
```

---

## 📞 Need Help?

1. **Check logs**: `pm2 logs botwa`
2. **Verify setup**: `pm2 status`
3. **Read docs**: `~/botwa/README.md`
4. **Check issues**: `~/botwa/TROUBLESHOOTING_SHARP.md`
5. **GitHub**: https://github.com/inject29/botwa

---

**Version**: 1.0.0 | **Last Updated**: April 2026 | **Status**: ✅ Ready for Production
