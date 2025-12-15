#!/bin/bash

# Pastikan permission key benar (hanya bisa dibaca user) agar SSH tidak error
chmod 600 /home/oem/Documents/bail/github

echo "🔄 Memulai proses upload ke GitHub..."

# 1. Tambahkan semua perubahan file
git add .

# 2. Simpan perubahan (Commit) dengan tanggal jam otomatis
git commit -m "Auto update: $(date '+%Y-%m-%d %H:%M:%S')"

# 3. Kirim ke GitHub (Push) menggunakan SSH Key yang ada di folder ini
GIT_SSH_COMMAND='ssh -i /home/oem/Documents/bail/github -o IdentitiesOnly=yes' git push

echo "✅ Berhasil update ke GitHub!"