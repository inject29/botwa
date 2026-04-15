# 🔄 Update Bot di VPS menggunakan Git

Panduan lengkap untuk update bot WhatsApp Elaina di VPS dengan git pull.

## 🚀 Quick Update (30 detik)

```bash
cd ~/botwa

# Pull latest changes dari GitHub
git pull

# Restart bot
pm2 restart botwa
```

Done! ✅

---

## 📋 Full Update Procedure (dengan Safety Check)

### Step 1: Check Current Status
```bash
cd ~/botwa

# Lihat status
git status

# Lihat latest commits dari remote
git log --oneline origin/main -5

# Lihat apa yang akan di-pull
git fetch origin
git log --oneline main..origin/main
```

### Step 2: Backup (Opsional tapi Recommended)
```bash
# Backup database (IMPORTANT!)
cp products.db products.db.backup.$(date +%Y%m%d_%H%M%S)

# Backup recent chats
cp recent_chats.json recent_chats.json.backup.$(date +%Y%m%d_%H%M%S)

# Check size
du -sh products.db*
```

### Step 3: Stop Bot (Opsional)
```bash
# Jika menggunakan PM2
pm2 stop botwa

# Atau jika pakai systemd
sudo systemctl stop botwa.service
```

### Step 4: Pull Changes dari GitHub
```bash
# Simple pull
git pull

# Jika ada conflict, lihat di bawah
```

### Step 5: Install Dependencies (jika ada yang baru)
```bash
# Check if package.json changed
git diff HEAD~1 package.json

# Jika ada changes, install ulang
npm install

# Atau untuk production (lebih cepat)
npm ci --only=production
```

### Step 6: Restart Bot
```bash
# PM2
pm2 restart botwa

# Atau systemd
sudo systemctl start botwa.service

# Verify running
pm2 status
# atau
sudo systemctl status botwa.service
```

### Step 7: Verify Bot Online
```bash
# Check logs
pm2 logs botwa --lines 20

# Test bot connection
# Send "tes" ke bot via WhatsApp
# Should get: 🤖 Bot OK. Koneksi aktif
```

---

## 🔧 Troubleshooting Git Update

### Problem 1: Conflict - "Your local changes would be overwritten"

**Cause**: Ada file lokal yang berbeda dengan remote

**Solution**:
```bash
# Option A: Keep local changes
git stash
git pull
git stash pop

# Option B: Discard local changes (gunakan jika yakin)
git reset --hard
git pull

# Option C: View differences first
git diff package.json
git diff package-lock.json
```

### Problem 2: Bot won't start setelah update

```bash
# Check error
pm2 logs botwa --err

# Check system error
npm start  # Run manually to see full error

# Common fixes:
npm install --build-from-source  # Rebuild modules
npm cache clean --force && npm install  # Full clean
```

### Problem 3: Multiple commits behind

```bash
# Lihat berapa commits behind
git lag  # alias untuk: git log --oneline main..origin/main

# Update ke latest
git pull origin main

# Atau force update
git reset --hard origin/main
```

### Problem 4: Out of sync dengan remote

```bash
# Fetch latest info
git fetch origin

# Check status
git status

# Rebase (lebih clean)
git pull --rebase

# Atau merge (default)
git pull
```

---

## 📊 Scheduled Auto-Update (Optional)

### Using Cron Job (tiap jam/hari)

```bash
# Edit crontab
crontab -e

# Add this line untuk update setiap pukul 2 AM
0 2 * * * cd ~/botwa && git pull && npm install && pm2 restart botwa >> /tmp/botwa-update.log 2>&1

# Or setiap 30 menit check update
*/30 * * * * cd ~/botwa && git fetch origin && if [ "$(git rev-parse main)" != "$(git rev-parse origin/main)" ]; then git pull && npm install && pm2 restart botwa; fi
```

### Verify Cron
```bash
# List active cron jobs
crontab -l

# View logs
tail -f /tmp/botwa-update.log
```

---

## 🎯 Complete Update Scenarios

### Scenario 1: Simple Update (No Dependencies Change)
```bash
cd ~/botwa
git pull
pm2 restart botwa
```

### Scenario 2: Update dengan New Dependencies
```bash
cd ~/botwa
pm2 stop botwa
git pull
npm install
pm2 start index.js --name "botwa" --max-memory-restart 256M
```

### Scenario 3: Major Update dengan Potential Issues
```bash
# 1. Backup
cp -r ~/botwa ~/botwa.backup.$(date +%Y%m%d)
cp products.db products.db.backup.$(date +%Y%m%d)

# 2. Stop bot
pm2 stop botwa

# 3. Update
cd ~/botwa
git pull

# 4. Clean install
rm -rf node_modules package-lock.json
npm install

# 5. Test run
node index.js  # Ctrl+C after QR/verification

# 6. Restart with PM2
pm2 start index.js --name "botwa" --max-memory-restart 256M

# 7. Monitor
pm2 logs botwa
```

### Scenario 4: Rollback ke versi sebelumnya
```bash
# Lihat histori commit
git log --oneline -10

# Rollback ke commit tertentu
git reset --hard abc1234  # ganti dengan commit hash

# Atau rollback ke 1 commit sebelumnya
git reset --hard HEAD~1

# Restart bot
pm2 restart botwa
```

---

## 📈 Monitoring Updates

### Check Update Status
```bash
# Lihat status terbaru
git status

# Lihat latest changes
git log --oneline -3

# Lihat branch info
git branch -vv

# Verify local sama dengan remote
git diff main origin/main
```

### View Change Log
```bash
# Lihat apa yang berubah sejak last update
git log --oneline last-update..main

# Atau lihat perubahan terbaru
git log -p -1  # Detail dari commit terakhir

# Lihat siapa yang update
git log --author="inject29" --oneline -10
```

---

## 🔒 Safety Checks sebelum Update

```bash
#!/bin/bash

# Safety check script sebelum update

echo "🔍 Performing safety checks..."

# 1. Check git status
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: Uncommitted changes exist"
    git status
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Update cancelled"
        exit 1
    fi
fi

# 2. Backup database
echo "💾 Backing up database..."
cp products.db products.db.backup.$(date +%Y%m%d_%H%M%S)

# 3. Fetch latest
echo "📡 Fetching latest changes..."
git fetch origin

# 4. Show what will change
echo "📋 Changes to be applied:"
git log --oneline main..origin/main

# 5. Check if package.json changed
if git diff --name-only origin/main | grep -E "package.json|package-lock.json"; then
    echo "⚠️  package.json will be updated - npm install required"
fi

# 6. Ask for confirmation
read -p "Proceed with update? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ Updating..."
    git pull
    npm install
    pm2 restart botwa
    echo "✅ Update complete!"
else
    echo "Update cancelled"
fi
```

Simpan sebagai `update-bot.sh`:
```bash
chmod +x update-bot.sh
./update-bot.sh
```

---

## 📋 Quick Commands Reference

```bash
# Show all available updates
git fetch && git log --oneline main..origin/main

# Update hanya kode (skip npm install jika dependencies tidak berubah)
git pull && pm2 restart botwa

# Update dengan reinstall dependencies
git pull && npm install && pm2 restart botwa

# Rollback ke sebelumnya
git reset --hard HEAD~1 && npm install && pm2 restart botwa

# Force update (buang local changes)
git reset --hard origin/main && npm install && pm2 restart botwa

# Check updated files
git diff --name-only HEAD~1 HEAD

# View detailed changes
git diff HEAD~1 HEAD

# See bot update logs
pm2 logs botwa | tail -100
```

---

## 🎯 Best Practices

✅ **DO:**
- Backup database sebelum update
- Check logs setelah restart
- Pull saat traffic rendah
- Monitor bot untuk 5 menit setelah update

❌ **DON'T:**
- Update saat bot sedang busy (many users)
- Force update tanpa review
- Skip testing setelah update
- Delete `products.db` saat update

---

## 🔄 Typical Update Workflow (Rekomendasi)

```bash
# Every morning/off-peak time:
cd ~/botwa

# 1. Check pending updates
git fetch origin
git log --oneline main..origin/main

# 2. If ada update:
# (Option) Backup
backup_time=$(date +%Y%m%d_%H%M%S)
cp products.db products.db.backup.$backup_time

# 3. Pull & install
git pull
npm install

# 4. Restart
pm2 restart botwa

# 5. Monitor
pm2 logs botwa

# 6. Test (send "tes" via WhatsApp)
```

---

## 📞 Need Help?

**Issue**: Git pull fails
```bash
git status  # See what's blocking
git stash   # If local changes, save them
git pull    # Try again
```

**Issue**: npm install fails  
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --build-from-source
```

**Issue**: Bot tidak start setelah update
```bash
pm2 logs botwa  # Check error
npm start       # Test manually
```

---

**Last Updated**: April 2026 | **Version**: 1.0.0
