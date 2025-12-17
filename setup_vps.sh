#!/bin/bash

# Script untuk menginstall library Linux yang dibutuhkan Puppeteer
echo "🛠️ Menginstall dependency sistem untuk Puppeteer..."
sudo apt-get update

# Cek ketersediaan paket untuk kompatibilitas OS baru (misal Ubuntu 24.04)
LIBASOUND="libasound2"
apt-cache show libasound2t64 >/dev/null 2>&1 && LIBASOUND="libasound2t64"

LIBGCC="libgcc1"
apt-cache show libgcc-s1 >/dev/null 2>&1 && LIBGCC="libgcc-s1"

sudo apt-get install -y ca-certificates fonts-liberation $LIBASOUND libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 $LIBGCC libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
echo "✅ Instalasi selesai. Coba jalankan bot lagi."
