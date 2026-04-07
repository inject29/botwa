#!/bin/bash

set -e

# Script untuk menginstall dependency VPS yang dibutuhkan aplikasi ini.
# Pastikan pengguna menjalankan script ini dengan hak sudo.

echo "🛠️ Memperbarui paket sistem..."
sudo apt-get update -y
sudo apt-get upgrade -y

echo "📥 Menginstall tools dasar dan dependency build..."
sudo apt-get install -y curl ca-certificates gnupg lsb-release apt-transport-https build-essential python3 python3-pip python3-dev pkg-config git

echo "📦 Menyiapkan Node.js 20.x (NodeSource)..."
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v20.* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node -v || echo "none")
NPM_VERSION=$(npm -v || echo "none")
echo "✅ Node.js terpasang: $NODE_VERSION"
echo "✅ npm terpasang: $NPM_VERSION"

# Cek ketersediaan paket yang berbeda di Ubuntu baru/bukan
LIBASOUND="libasound2"
apt-cache show libasound2t64 >/dev/null 2>&1 && LIBASOUND="libasound2t64"

LIBGCC="libgcc1"
apt-cache show libgcc-s1 >/dev/null 2>&1 && LIBGCC="libgcc-s1"

echo "🧩 Menginstall dependency sistem untuk Puppeteer, Sharp, dan SQLite..."
sudo apt-get install -y \
  $LIBASOUND \
  libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 $LIBGCC \
  libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
  lsb-release wget xdg-utils \
  libvips-dev libjpeg-dev libpng-dev libwebp-dev libtiff5-dev zlib1g-dev \
  sqlite3 libsqlite3-dev

cd "$(dirname "$0")"

if [ -f package-lock.json ]; then
  echo "📦 Menginstall dependency Node.js dari package-lock.json..."
  npm ci
else
  echo "📦 Menginstall dependency Node.js dari package.json..."
  npm install
fi

echo "✅ Semua instalasi selesai."
echo "👉 Jalankan bot dengan: node index.js"
