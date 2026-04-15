# ✅ VPS SETUP PACKAGE - READY TO USE

Paket lengkap untuk setup Bot WhatsApp di VPS dengan 1 command!

---

## 📦 Contents

### Automated Scripts ⭐ (Paling Important)

| File | Fungsi | Waktu |
|------|--------|-------|
| **setup-complete-vps.sh** | 🚀 Setup lengkap (dependencies + bot + PM2) | 5-10 menit |
| **import-database.sh** | 💾 Import database products.db | 1-2 menit |

### Documentation

| File | Untuk |
|------|--------|
| **SETUP_COMPLETE_GUIDE.md** | 📖 Panduan lengkap penggunaan |
| **README.md** | 📚 Overview bot + features |
| **INSTALL_VPS.md** | 📝 Detail step-by-step instalasi |
| **UPDATE_VPS.md** | 🔄 Cara update bot |
| **CHEATSHEET.md** | ⚡ Quick commands reference |
| **TROUBLESHOOTING_SHARP.md** | 🔧 Sharp build issues |
| **ANIMATIONS_IMPLEMENTED.md** | ✨ Animation system docs |
| **DEPLOY_GUIDE.md** | 🎯 Quick deployment |

---

## 🚀 QUICK START VPS (5 Menit!)

### Langkah 1: Copy Script ke VPS

Di **local machine** Anda:
```bash
# Clone atau download script
git clone https://github.com/inject29/botwa.git
cd botwa

# Atau download satu script saja
curl -O https://raw.githubusercontent.com/inject29/botwa/main/setup-complete-vps.sh
chmod +x setup-complete-vps.sh
```

### Langkah 2: Transfer Database ke VPS

```bash
# Di local machine, upload products.db ke VPS
scp /path/to/products.db user@vps-ip:~/

# SSH ke VPS
ssh user@vps-ip
```

### Langkah 3: Run Setup Script (VPS)

```bash
# Download script (jika belum di VPS)
curl -O https://raw.githubusercontent.com/inject29/botwa/main/setup-complete-vps.sh
chmod +x setup-complete-vps.sh

# Jalankan (akan minta password untuk sudo)
bash setup-complete-vps.sh
```

**Total waktu: ~10 menit** ⏱️

### Langkah 4: Done! 🎉

```bash
# Bot automatically:
# ✅ Installed all dependencies
# ✅ Cloned repository
# ✅ Installed npm packages
# ✅ Imported database
# ✅ Configured PM2 autostart
# ✅ Started running

# Scan QR code to connect WhatsApp:
pm2 logs botwa
```

---

## 📋 What Each Script Does

### setup-complete-vps.sh

**Automated, no user interaction needed** (except QR scan at end):

```
Step 1: System Update
  └─ sudo apt-get update & upgrade

Step 2: Node.js Installation
  └─ Install Node.js v20 LTS

Step 3: Sharp Dependencies (⭐ CRITICAL)
  └─ libvips, glib, build tools
  └─ Solves most "glib-object.h" errors

Step 4: Clone Repository
  └─ git clone from GitHub

Step 5: Install NPM Packages
  └─ npm install --build-from-source

Step 6: Database Setup
  └─ Auto-detect products.db
  └─ Backup existing database
  └─ Verify integrity

Step 7: Configure PM2
  └─ Register bot for auto-start
  └─ Setup to restart on reboot

Step 8: Verify & Test
  └─ Show status and next steps
```

### import-database.sh

**Use if need to import database later**:

```bash
# Auto-detect and import database
bash ~/botwa/import-database.sh

# Or specify paths
bash ~/botwa/import-database.sh ~/botwa ~/products.db
```

---

## ✅ Success Checklist

After setup, verify these:

- [ ] ✅ Script completed with "Setup complete!"
- [ ] ✅ Bot appears in `pm2 status`
- [ ] ✅ QR code visible in `pm2 logs botwa`
- [ ] ✅ Scan QR with WhatsApp
- [ ] ✅ Send "tes" → get response
- [ ] ✅ `ls ~/botwa/products.db` shows file
- [ ] ✅ Try PLU lookup: send `20019930`

---

## 🎯 Common Post-Setup Commands

```bash
# View bot status
pm2 status

# Monitor logs (real-time)
pm2 logs botwa -f

# Restart bot
pm2 restart botwa

# Stop bot
pm2 stop botwa

# View last 50 lines of logs
pm2 logs botwa --lines 50

# Update bot from GitHub
cd ~/botwa && git pull && npm install && pm2 restart botwa

# Backup database
cp ~/botwa/products.db ~/botwa/products.db.backup.$(date +%Y%m%d)
```

---

## ⚠️ If Script Fails

```bash
# Check error logs
cat /tmp/botwa-setup.log

# Common issues:
# 1. Permission denied → run with sudo
# 2. apt-get error → try: sudo apt-get update
# 3. Build error → check: TROUBLESHOOTING_SHARP.md
# 4. No database → check: products.db in home directory

# Troubleshoot Sharp issue
sudo apt-get install -y libvips-dev libglib2.0-dev
cd ~/botwa
rm -rf node_modules package-lock.json
npm install --build-from-source
```

---

## 📱 Test Bot After Setup

### Test 1: Is Running?
```
/botwa/botwa/botwa  Send: tes
Expected: 🤖 Bot OK. Koneksi aktif. Halo [nama]!
```

### Test 2: Database Working?
```
Send: 20019930
Expected: Product label image with barcode
```

### Test 3: Help Menu
```
Send: .menu
Expected: List of all commands
```

---

## 🔍 Verify Everything is Correct

```bash
# 1. Check bot running
$ pm2 status
[online] botwa

# 2. Check database exists
$ ls -lh ~/botwa/products.db
-rw-r--r-- 1 user user 250M

# 3. Check dependencies
$ npm ls --depth=0 | grep -E "sharp|sqlite3"
├── sharp@0.34.5
└── sqlite3@5.1.6

# 4. Check system ready
$ node -v
v20.11.0
$ npm -v
10.2.5
$ pm2 -v
5.3.0
```

---

## 📚 Full Documentation Available

In bot directory (`~/botwa/`):

```
README.md                    ← Start here!
SETUP_COMPLETE_GUIDE.md      ← This guide
INSTALL_VPS.md              ← Installation details
UPDATE_VPS.md               ← How to update
CHEATSHEET.md               ← Quick reference
TROUBLESHOOTING_SHARP.md    ← Error solutions
ANIMATIONS_IMPLEMENTED.md   ← Feature details
DEPLOY_GUIDE.md             ← Deployment
```

---

## 🎓 Learning Path

1. **First time?** → Read: SETUP_COMPLETE_GUIDE.md
2. **Already set up?** → Read: UPDATE_VPS.md
3. **Need quick command?** → See: CHEATSHEET.md
4. **Got an error?** → Check: TROUBLESHOOTING_SHARP.md
5. **Want details?** → Full docs in GitHub

---

## 🐛 Troubleshooting Matrix

| Problem | Check | Solution |
|---------|-------|----------|
| Script fails | Permissions | Run with: `bash setup-complete-vps.sh` |
| Build error (Sharp) | libvips | See: TROUBLESHOOTING_SHARP.md |
| Bot won't start | PM2 | `pm2 logs botwa` & check error |
| Database not found | File exists | `ls ~/botwa/products.db` |
| No QR code | Logs | `pm2 logs botwa -f` |
| Out of disk | Space | `df -h` & cleanup |
| Out of memory | Usage | `free -h` & restart |

---

## 🚀 Next Steps After Setup

1. **Test bot** → Send "tes" on WhatsApp
2. **Backup database** → `cp products.db products.db.backup`
3. **Monitor logs** → `pm2 logs botwa -f`
4. **Read documentation** → Check CHEATSHEET.md for commands
5. **Setup auto-updates** → See UPDATE_VPS.md

---

## 📞 Support Resources

| Need Help With | Resource |
|----------------|----------|
| Installation | SETUP_COMPLETE_GUIDE.md |
| Commands | CHEATSHEET.md |
| Errors | TROUBLESHOOTING_SHARP.md |
| Updates | UPDATE_VPS.md |
| Features | README.md |
| Details | INSTALL_VPS.md |

---

## ✨ Features Included

Bot comes with:

- ✅ **Product Lookup** - Single & multiple PLU auto-detect
- ✅ **Barcode Generation** - Code128 barcodes with images
- ✅ **Search** - Find products by name (`.cari`)
- ✅ **Bulk Operations** - Generate multiple labels
- ✅ **Animations** - Progress bars, spinners, emoji
- ✅ **Broadcast** - Auto message on online
- ✅ **Reactions** - ⏳✅❌ status indicators
- ✅ **Customization** - AI mode, custom reactions
- ✅ **Integration** - SMS, CCTV, Listing services
- ✅ **Auto-restart** - PM2 handles crashes

---

## 🎯 Success = These 3 Things Work

1. **Bot Responds to "tes"**
   ```
   ✅ You get: "🤖 Bot OK. Koneksi aktif"
   ```

2. **Database Works**
   ```
   ✅ Send PLU → Get product label
   ```

3. **PM2 Auto-restart Works**
   ```
   ✅ Bot survives VPS reboot
   ```

---

## 📊 Final Checklist

Before declaring success:

- [ ] Bot installed on VPS
- [ ] Database imported
- [ ] Bot running (pm2 status ✓)
- [ ] QR code scanned
- [ ] Bot responds to "tes"
- [ ] Product lookup works
- [ ] PM2 auto-start configured
- [ ] Logs monitoring working
- [ ] Backup strategy in place
- [ ] Documentation read

---

## 🎉 CONGRATULATIONS!

You now have:
- ✅ Production-ready WhatsApp bot
- ✅ Auto-start on VPS reboot
- ✅ Database integrated
- ✅ Full documentation
- ✅ Update capability

**Enjoy your bot!** 🤖

---

**Repository**: https://github.com/inject29/botwa  
**Version**: 1.0.0  
**Last Updated**: April 2026  
**Status**: ✅ Production Ready
