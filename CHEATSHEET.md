# 📋 Quick Reference / Cheat Sheet

## 🚀 Startup Commands

### Development Mode
```bash
npm start
# atau
node index.js
```

### Production Mode (PM2)
```bash
# Start
pm2 start index.js --name "botwa"

# View status
pm2 status

# View logs
pm2 logs botwa

# Stop
pm2 stop botwa

# Restart
pm2 restart botwa

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Production Mode (systemd)
```bash
# Start service
sudo systemctl start botwa.service

# Check status
sudo systemctl status botwa.service

# View logs
sudo journalctl -u botwa -f

# Enable auto-start
sudo systemctl enable botwa.service
```

---

## 💬 Bot Commands

### Search & Lookup
| Command | Example | Hasil |
|---------|---------|-------|
| Single PLU | `20019930` | 1 label dengan product info |
| Multiple PLU | `20019930 20019931 20019932` | 3 label dengan batch progress |
| Search | `.cari minyak` | List produk dengan nama "minyak" |
| Cari PLU | `.cari 20019930` | Cari spesifik product |

### Generation & Sending
| Command | Example | Hasil |
|---------|---------|-------|
| Bulk Generate | `.bulk 20019930 100` | 1 label qty 100 |
| Send All | `.aktiva` | Kirim semua barcode dari folder |
| Menu | `.menu` | Help message |

### Settings & Features
| Command | Example | Hasil |
|---------|---------|-------|
| AI Mode | `.aimode` | Toggle AI response format |
| Auto React | `.autoreact` | Toggle auto emoji (⏳✅❌) |
| Set Emoji | `.setreact ❤️` | Set custom reaction emoji |
| Pairing | `.pair 62812345678901` | Get pairing code |

### Integrasi
| Command | Format | Deskripsi |
|---------|--------|----------|
| SMS | `.sms [nomor] [pesan]` | Send SMS |
| CCTV | `.cctv` | CCTV access menu |
| Testing | `tes` | Check bot connectivity |

---

## 📁 File Management

### Database
```bash
# Check database
ls -la products.db

# Backup database
cp products.db products.db.backup

# Copy from local
scp products.db user@vps-ip:/path/to/botwa/
```

### Session
```bash
# Delete session (untuk QR code baru)
rm -rf baileys_auth_info

# Copy existing session from local
scp -r baileys_auth_info user@vps-ip:/path/to/botwa/
```

### Barcode Output
```bash
# Check generated barcodes
ls -la Barcode_generator/

# Download barcodes
scp -r user@vps-ip:/path/to/botwa/Barcode_generator/ ./

# Clean old barcodes
rm Barcode_generator/*.{png,jpg,jpeg}
```

---

## 🔧 Troubleshooting

### Bot tidak connect
```bash
# Reset session dan restart
rm -rf baileys_auth_info
npm start
```

### Build error untuk Sharp (glib-object.h)
```bash
# ⚠️ CRITICAL FIX: Install missing development headers FIRST
sudo apt-get install -y libglib2.0-dev libvips-dev

# Then clean and reinstall
cd ~/botwa
rm -rf node_modules package-lock.json
npm install

# If still error, see full troubleshooting guide:
# TROUBLESHOOTING_SHARP.md
```

### High memory usage
```bash
# Restart dengan memory limit
pm2 restart botwa --max-memory-restart 256M
```

### Database not found
```bash
# Check if exists
file products.db
sqlite3 products.db ".tables"

# Copy dari backup
cp products.db.backup products.db
```

### Permission denied untuk systemd
```bash
# Fix permission
sudo chown -R ubuntu:ubuntu /home/ubuntu/botwa

# Restart service
sudo systemctl restart botwa.service
```

---

## 📊 Monitoring

### View real-time logs
```bash
# PM2
pm2 logs botwa

# systemd
sudo journalctl -u botwa -f

# Direct (jika running di terminal)
# Logs akan keluar langsung
```

### Check resource usage
```bash
# PM2
pm2 monit

# System
top
htop  # install: apt-get install htop
```

### Save logs
```bash
# PM2
pm2 logs botwa > /tmp/botwa.log

# systemd
sudo journalctl -u botwa > /tmp/botwa.log

# From current date
sudo journalctl -u botwa --since today > /tmp/botwa.log
```

---

## 🌐 Network & Ports

### Test connectivity
```bash
# Check WhatsApp connection
curl -I https://api.whatsapp.com

# DNS resolution
nslookup graph.instagram.com

# Traceroute
traceroute -m 20 api.instagram.com
```

### Port forwarding (jika perlu)
```bash
# Check if port is open
netstat -tuln | grep :3000

# Change SSH port (opsional)
sudo nano /etc/ssh/sshd_config
```

---

## 🔐 Security Best Practices

### Restrict SSH access
```bash
# Allow only your IP
sudo nano /etc/ssh/sshd_config
# AllowUsers ubuntu@[YOUR-IP]
```

### Backup important files
```bash
# Daily backup script
0 2 * * * cd /home/ubuntu/botwa && tar -czf backups/backup-$(date +%Y%m%d).tar.gz products.db recent_chats.json
```

### Monitor security
```bash
# Check failed login attempts
grep "Failed password" /var/log/auth.log | wc -l

# View recent connections
lastlog
```

---

## 📦 Update & Maintenance

### Update dependencies
```bash
npm update --save

# Check for outdated packages
npm outdated

# Security audit
npm audit

# Fix security vulnerabilities
npm audit fix
```

### Update Node.js
```bash
# Check current version
node -v

# Update to LTS (gunakan NVM)
nvm install 18
nvm use 18
nvm alias default 18
```

### Clean up
```bash
# Clear npm cache
npm cache clean --force

# Remove old logs
pm2 flush

# Remove node_modules (untuk reinstall)
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 Helpful Aliases (add ke ~/.bashrc)

```bash
# Bot shortcuts
alias botstart='pm2 start index.js --name "botwa" --watch --max-memory-restart 256M'
alias botstop='pm2 stop botwa'
alias botrestart='pm2 restart botwa'
alias botlogs='pm2 logs botwa'
alias botstatus='pm2 status'
alias botsave='pm2 save'

# Database shortcuts
alias botdb='sqlite3 /home/ubuntu/botwa/products.db'
alias botdbcount='sqlite3 /home/ubuntu/botwa/products.db "SELECT COUNT(*) as total FROM products;"'

# Add ke ~/.bashrc, kemudian:
source ~/.bashrc
```

---

## 📞 Quick Support Commands

```bash
# Get bot info
node -e "console.log(process.version); console.log(process.platform);"

# Check npm version
npm -v

# List global packages
npm list -g --depth=0

# Check disk usage
du -sh ~/botwa
df -h

# Check memory
free -h

# Get external IP
curl -s https://api.ipify.org
```

---

**Last Updated**: April 2026 | **Version**: 1.0.0
