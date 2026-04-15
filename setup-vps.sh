#!/bin/bash

# 🚀 Quick Setup Script untuk Bot WhatsApp di VPS
# Usage: bash setup-vps.sh

echo "🤖 Installing Bot WhatsApp Elaina..."

# Update system
echo "📦 Updating system..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js
echo "📥 Installing Node.js..."
sudo apt-get install -y nodejs npm

# Install build tools (untuk Sharp & SQLite3)
echo "🔨 Installing build tools..."
sudo apt-get install -y build-essential python3 python3-dev sqlite3 libsqlite3-dev libvips libvips-dev

# Clone repository (jika belum ada)
if [ ! -d "botwa" ]; then
  echo "📥 Cloning repository..."
  git clone https://github.com/inject29/botwa.git
fi

cd botwa || exit

# Install npm dependencies
echo "📚 Installing dependencies (this may take a few minutes)..."
npm install --build-from-source

# Install PM2 globally
echo "🔧 Installing PM2..."
sudo npm install -g pm2

# Check if setup successful
if command -v pm2 &> /dev/null; then
  echo "✅ Setup completed successfully!"
  echo ""
  echo "📝 Next steps:"
  echo "1. Copy products.db ke folder botwa/"
  echo "2. Start bot: npm start (untuk testing)"
  echo "3. Atau gunakan PM2: pm2 start index.js --name 'botwa'"
  echo ""
  echo "📖 Dokumentasi: https://github.com/inject29/botwa"
else
  echo "❌ Setup failed. Check error messages above."
  exit 1
fi
