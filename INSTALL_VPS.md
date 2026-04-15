# 🤖 Instalasi Bot WhatsApp di VPS

Panduan lengkap untuk menginstall dan menjalankan Bot WhatsApp Elaina di VPS.

## 📋 Persyaratan Sistem

- **OS**: Linux (Ubuntu 18+, Debian 10+)
- **Node.js**: v14+ (v16+ recommended)
- **npm**: v6+
- **RAM**: Minimal 512MB
- **Disk**: Minimal 1GB
- **Internet**: Koneksi yang stabil

## 🚀 Langkah Instalasi

### 1. Update Sistem
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. Install Node.js dan npm

#### Menggunakan NVM (Recommended - untuk multiple Node versions):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18
```

#### Atau langsung menggunakan apt:
```bash
sudo apt-get install -y nodejs npm
node -v
npm -v
```

### 3. Install Dependencies Sistem

```bash
# Untuk Sharp dan SQLite3 (build tools)
sudo apt-get install -y build-essential python3 python3-dev

# Untuk SQLite3
sudo apt-get install -y sqlite3 libsqlite3-dev

# Untuk Image Processing (opsional, tapi sangat direkomendasikan)
sudo apt-get install -y libvips libvips-dev

# Untuk QR Code
sudo apt-get install -y python3-qrcode
```

### 4. Clone Repository

```bash
cd ~
git clone https://github.com/inject29/botwa.git
cd botwa
```

### 5. Install Node Dependencies

```bash
npm install
# atau jika perlu rebuild untuk sharp dan sqlite3:
npm install --build-from-source
```

### 6. Setup Database

```bash
# Copy atau pindahkan products.db ke folder project
# Pastikan file products.db ada sebelum menjalankan bot
ls -la products.db
```

## 🏃 Menjalankan Bot

### Cara 1: Langsung (untuk testing)
```bash
npm start
# atau
node index.js
```

### Cara 2: Menggunakan PM2 (untuk production)

```bash
# Install PM2 globally
npm install -g pm2

# Jalankan bot dengan PM2
pm2 start index.js --name "botwa" --max-memory-restart 256M

# Lihat status
pm2 status

# Setup auto-start saat reboot
pm2 startup
pm2 save

# View logs
pm2 logs botwa

# Stop bot
pm2 stop botwa

# Restart bot
pm2 restart botwa
```

### Cara 3: Menggunakan systemd (untuk production)

Buat file `/etc/systemd/system/botwa.service`:
```bash
sudo nano /etc/systemd/system/botwa.service
```

Paste konfigurasi berikut:
```ini
[Unit]
Description=WhatsApp Bot Elaina
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/botwa
ExecStart=/usr/bin/node /home/ubuntu/botwa/index.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/botwa.log
StandardError=append:/var/log/botwa.log

[Install]
WantedBy=multi-user.target
```

Kemudian:
```bash
# Enable service
sudo systemctl enable botwa.service

# Start service
sudo systemctl start botwa.service

# Check status
sudo systemctl status botwa.service

# View logs
sudo journalctl -u botwa -f
```

## 🔧 Konfigurasi

### Sebelum Pertama kali Menjalankan:

1. **Pastikan database sudah ada**
   ```bash
   ls -la products.db
   ```

2. **Siapkan file sesi (opsional)**
   - Jika sudah punya sesi dari PC lokal, copy folder `baileys_auth_info/`
   ```bash
   cp -r ~/baileys_auth_info ~/botwa/
   ```

3. **Setup pesan broadcast**
   - Bot akan menyimpan chat history di `recent_chats.json`
   - Broadcast otomatis dikirim ke semua chat dalam 2 hari terakhir

## 📁 Struktur File Penting

```
botwa/
├── index.js                    # Main bot file
├── package.json                # Dependencies
├── products.db                 # Database produk (PENTING!)
├── baileys_auth_info/          # Session WhatsApp (auto-generated)
├── recent_chats.json           # Chat history (auto-generated)
├── Barcode_generator/          # Folder untuk simpan barcode
├── sms_service.js              # SMS integration
├── indomaret_service.js        # Indomaret service
├── cctv_service.js             # CCTV service
├── listing_service.js          # Listing service
└── .gitignore                  # Git ignore rules
```

## 📦 Dependencies yang Diinstall

| Package | Version | Fungsi |
|---------|---------|--------|
| @rexxhayanasi/elaina-bail | ^1.4.8 | WhatsApp Baileys Library (modified) |
| axios | ^1.7.2 | HTTP requests untuk download gambar |
| bwip-js | ^2.0.10 | Generate barcode |
| pino | ^8.17.2 | Logging |
| qrcode | ^1.5.1 | Generate QR code |
| qrcode-terminal | ^0.12.0 | Display QR code di terminal |
| sharp | ^0.34.5 | Image processing & composite |
| sqlite3 | ^5.1.6 | Database untuk product lookup |

## 🎯 Menggunakan Bot

Setelah bot berhasil connect:

### Testing
```
Kirim: tes
Respon: 🤖 Bot OK. Koneksi aktif. Halo [nama]!
```

### Fitur Utama
- **Single PLU**: `20019930`
- **Multiple PLU**: `20019930 20019931 20019932` (dengan space/dot/newline separator)
- **Cari Produk**: `.cari [nama produk]`
- **Bulk Generate**: `.bulk [kode] [jumlah]`
- **Kirim Barcode**: `.aktiva`
- **Help Menu**: `.menu`

## 🐛 Troubleshooting

### Error: "Cannot find module 'sharp'"
```bash
npm install --build-from-source sharp
```

### Error: "Cannot find module 'sqlite3'"
```bash
npm install --build-from-source sqlite3
```

### Bot tidak connect
- Pastikan baileys_auth_info folder tidak ada (untuk QR code baru)
- Atau hapus folder tersebut dan restart
```bash
rm -rf baileys_auth_info
npm start
```

### Memory usage tinggi
- Gunakan PM2 dengan restart memory limit:
```bash
pm2 start index.js --max-memory-restart 256M
```

### Database tidak ditemukan
- Pastikan `products.db` ada di folder project
- Copy dari device lokal jika belum ada

## 📝 Logs dan Monitoring

### Dengan PM2:
```bash
# Real-time logs
pm2 logs botwa

# Save logs
pm2 logs botwa > botwa-logs.txt

# Clear logs
pm2 flush
```

### Dengan systemd:
```bash
# Real-time logs
sudo journalctl -u botwa -f

# Last 100 lines
sudo journalctl -u botwa -n 100

# Save logs
sudo journalctl -u botwa > botwa-logs.txt
```

## 🔐 Keamanan

⚠️ **PENTING**: Jangan pernah commit atau push:
- `baileys_auth_info/` - Folder sesi WhatsApp
- `products.db` - Jika berisi data sensitif
- `.env` - File konfigurasi dengan password

Folder ini sudah ada di `.gitignore`

## 📞 Support

Jika ada masalah:
1. Check logs untuk error message
2. Pastikan database dan dependencies sudah terinstall
3. Update Node.js ke versi terbaru
4. Clear npm cache: `npm cache clean --force`

---

**Last Updated**: April 2026
**Bot Version**: 1.0.0 (Elaina)
