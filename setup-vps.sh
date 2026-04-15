#!/bin/bash

# 🚀 Quick Setup Script untuk Bot WhatsApp di VPS
# Usage: bash setup-vps.sh
# WARNING: This script requires sudo access

set -e  # Exit on error

echo "🤖 Installing Bot WhatsApp Elaina..."
echo "⚠️  This script requires sudo access and takes 5-10 minutes"
echo ""

# Update system
echo "📦 Step 1/5: Updating system..."
sudo apt-get update
sudo apt-get upgrade -y

# Install build tools (CRITICAL - must be before npm install!)
echo "🔨 Step 2/5: Installing build tools..."
sudo apt-get install -y \
  build-essential \
  python3 python3-dev \
  sqlite3 libsqlite3-dev \
  libvips libvips-dev \
  libglib2.0-dev libglib2.0-0 \
  pkg-config \
  g++ make \
  autoconf automake libtool

# Install Node.js if not exists
echo "📥 Step 3/5: Installing Node.js..."
if ! command -v node &> /dev/null; then
  curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Clone repository (if not exists)
echo "⬇️  Step 4/5: Cloning repository..."
if [ ! -d "botwa" ]; then
  git clone https://github.com/inject29/botwa.git
fi

cd botwa || exit

# Install npm dependencies
echo "📚 Step 5/5: Installing dependencies (this may take 3-5 minutes)..."
rm -rf node_modules package-lock.json 2>/dev/null || true
npm install --build-from-source 2>&1 | tee npm-install.log

# Check if setup successful
if [ -d "node_modules/sharp" ]; then
  echo ""
  echo "✅ Setup completed successfully!"
  echo ""
  echo "📋 System Info:"
  echo "  • Node: $(node -v)"
  echo "  • npm: $(npm -v)"
  echo "  • Python: $(python3 --version)"
  echo ""
  echo "📝 Next steps:"
  echo "1. Copy products.db ke folder botwa/"
  echo "2. Start bot: npm start (untuk testing)"
  echo "3. Atau gunakan PM2: pm2 start index.js --name 'botwa'"
  echo ""
  echo "📖 Full docs: https://github.com/inject29/botwa"
  echo "🐛 Sharp build error? See: TROUBLESHOOTING_SHARP.md"
else
  echo ""
  echo "❌ Setup failed - npm install error detected"
  echo "📋 Check npm-install.log untuk details"
  echo "🔧 Try: TROUBLESHOOTING_SHARP.md"
  exit 1
fi
