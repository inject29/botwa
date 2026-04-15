# 🔧 FIX: Sharp Build Error - Missing Dependencies

## ❌ Error Message
```
fatal error: glib-object.h: No such file or directory
gyp ERR! build error
```

## ✅ Solusi Cepat

### Fix 1: Install Missing Development Headers (RECOMMENDED)

```bash
# Ubuntu/Debian
sudo apt-get install -y libglib2.0-dev libglib2.0-0

# Jika still error, install lengkap sharp dependencies
sudo apt-get install -y \
  build-essential \
  python3 python3-dev \
  libvips-dev \
  libglib2.0-dev \
  libglib2.0-0 \
  pkg-config

# Kemudian clear dan reinstall
cd ~/botwa
rm -rf node_modules package-lock.json
npm install
```

### Fix 2: Gunakan Pre-built Binary (FASTER)

Jika Fix 1 masih error, gunakan pre-built binary (skip building from source):

```bash
cd ~/botwa
rm -rf node_modules package-lock.json

# Install dengan flag untuk skip build
npm install --no-save
# Atau
npm ci --only=production
```

### Fix 3: Downgrade Sharp Version

Jika masih error, gunakan versi sharp yang lebih stable:

```bash
# Update package.json
npm install sharp@0.33.1

# Atau manual edit package.json
# "sharp": "^0.33.1"

npm install
```

---

## 🔍 Diagnosis Commands

```bash
# Check if libvips installed
dpkg -l | grep libvips
# atau
pkg-config --modversion libvips

# Check if dev headers exist
ls -la /usr/include/vips/
ls -la /usr/include/glib-2.0/

# Check node-gyp version
npm list node-gyp

# Check Python (required for build)
python3 --version
```

---

## 📋 Complete Fixed Setup Script

```bash
#!/bin/bash

echo "🔧 Installing Bot WhatsApp dengan Sharp Fix..."

# Step 1: Update system
sudo apt-get update
sudo apt-get upgrade -y

# Step 2: Install ALL build dependencies
sudo apt-get install -y \
  build-essential \
  python3 python3-dev \
  git curl wget \
  sqlite3 libsqlite3-dev \
  libvips libvips-dev \
  libglib2.0-dev libglib2.0-0 \
  pkg-config \
  g++ make \
  autoconf automake libtool

# Step 3: Install Node.js (if not exist)
if ! command -v node &> /dev/null; then
  curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Step 4: Verify installations
echo "✅ Checking installations..."
echo "Node: $(node -v)"
echo "npm: $(npm -v)"
echo "Python: $(python3 --version)"
echo "libvips: $(pkg-config --modversion libvips)"

# Step 5: Clone and install bot
if [ ! -d "botwa" ]; then
  git clone https://github.com/inject29/botwa.git
fi

cd botwa || exit

# Step 6: Clean install
rm -rf node_modules package-lock.json ~/.npm_cache

# Step 7: Install dependencies
echo "📦 Installing dependencies..."
npm install --verbose 2>&1 | tee npm-install.log

# Step 8: Verify installation
if [ -d "node_modules" ]; then
  echo "✅ Bot installed successfully!"
  echo ""
  echo "📝 Next steps:"
  echo "1. Copy products.db ke folder botwa/"
  echo "2. npm start (untuk test)"
  echo "3. pm2 start index.js --name 'botwa' (untuk production)"
else
  echo "❌ Installation failed. Check npm-install.log"
  exit 1
fi
```

Simpan sebagai `setup-fixed.sh` dan jalankan:
```bash
chmod +x setup-fixed.sh
./setup-fixed.sh
```

---

## 🆘 Jika Masih Error

### Option A: Gunakan Pre-built Binary (Paling Cepat)
```bash
cd ~/botwa
rm -rf node_modules package-lock.json

# Download pre-built sharp
npm install sharp --binary-host-mirror=https://github.com/lovell/sharp-libvips/releases/download

npm install
```

### Option B: Skip Sharp, Gunakan ImageMagick
Edit `package.json`:
```json
{
  "dependencies": {
    "imagemagick": "^0.1.3"
    // remove "sharp"
  }
}
```

Lalu edit `index.js` untuk replace Sharp dengan ImageMagick (butuh modifikasi code).

### Option C: Install di Container (Docker)
```bash
# Menggunakan Docker image yang sudah punya semua dependencies
docker run -it -v $(pwd):/botwa node:20-alpine npm install
```

---

## ✅ Prevention - Update INSTALL_VPS.md

Setup script di VPS seharusnya include:

```bash
# CORRECT ORDER:
1. sudo apt-get update
2. sudo apt-get install -y build-essential python3 python3-dev
3. sudo apt-get install -y libvips libvips-dev libglib2.0-dev
4. npm install
```

**JANGAN**: `npm install` sebelum install system dependencies!

---

## 📊 Installed Packages Verification

Setelah fix, verify semua packages terinstall:

```bash
# Check sharp
npm ls sharp

# Verify all dependencies
npm ls --depth=0

# Expected output:
# botwa
# ├── @rexxhayanasi/elaina-bail@1.4.8
# ├── axios@1.7.2
# ├── bwip-js@2.0.10
# ├── pino@8.17.2
# ├── qrcode@1.5.1
# ├── qrcode-terminal@0.12.0
# ├── sharp@0.34.5
# └── sqlite3@5.1.6
```

---

## 💡 Tips & Tricks

### Faster Installs
```bash
# Menggunakan npm ci (untuk reproducible builds)
npm ci

# Atau dengan pre-built
npm install --ignore-scripts
npm run install
```

### Cache Management
```bash
# Clear npm cache
npm cache clean --force

# Clear system cache (Linux)
sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
```

### Logs Debugging
```bash
# Verbose output
npm install --verbose

# Detailed error log
npm install 2>&1 | tee install.log

# Check error log
cat ~/.npm/_logs/*-debug-0.log | tail -100
```

---

## 🎯 Quick Troubleshooting Table

| Error | Cause | Fix |
|-------|-------|-----|
| `glib-object.h: No such file` | libglib2.0-dev not installed | `sudo apt-get install libglib2.0-dev` |
| `vips.pc not found` | libvips-dev missing | `sudo apt-get install libvips-dev` |
| `node-gyp: command not found` | node-gyp not installed | `npm list node-gyp` or reinstall |
| `Python not found` | Python3 missing | `sudo apt-get install python3 python3-dev` |
| `make: not found` | build-essential missing | `sudo apt-get install build-essential` |
| `g++: not found` | Compiler missing | `sudo apt-get install g++ gcc` |

---

## 🚀 Full Clean Reinstall Procedure

Jika semua fix di atas masih error, lakukan full clean:

```bash
# 1. Stop bot if running
pm2 stop botwa
pm2 delete botwa

# 2. Backup data
cp products.db products.db.backup
cp recent_chats.json recent_chats.json.backup

# 3. Full clean
rm -rf node_modules package-lock.json npm-cache

# 4. Clear system cache
sudo apt-get clean
sudo apt-get autoclean

# 5. Reinstall system dependencies
sudo apt-get install --reinstall -y \
  build-essential \
  libvips libvips-dev \
  libglib2.0-dev python3-dev

# 6. Fresh npm install
npm install --verbose

# 7. Start bot
npm start
```

---

## 📞 If Still Not Working

1. **Check Node.js version**: Should be v14+ (preferably v18+)
   ```bash
   node -v
   ```

2. **Check all system deps**:
   ```bash
   pkg-config --list-all | grep -E "vips|glib"
   ```

3. **Try with yarn** (alternative package manager):
   ```bash
   npm install -g yarn
   yarn install
   ```

4. **Last resort - Use binary-only install**:
   ```bash
   npm install --no-optional-release-build sharp
   ```

---

**Last Updated**: April 2026 | **Version**: 1.0.0 | **Status**: ✅ Sharp Install Troubleshooting Guide
