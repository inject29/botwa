#!/bin/bash

################################################################################
# 🤖 Bot WhatsApp - Auto Update Script (untuk Cron)
# 
# Fungsi: Pull latest code dari GitHub dan restart bot via PM2
# Penggunaan: Jalankan via cron atau manual
#
# Contoh cron setup:
# - Edit: crontab -e
# - Update setiap jam 2 pagi: 0 2 * * * bash ~/botwa/auto-update-bot.sh
# - Update setiap 6 jam: 0 */6 * * * bash ~/botwa/auto-update-bot.sh
################################################################################

# Configuration
BOT_NAME="botwa"
BOT_DIR="${HOME}/botwa"
LOG_FILE="${HOME}/botwa-auto-update.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
log() {
    echo -e "${BLUE}[${TIMESTAMP}]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}" | tee -a "$LOG_FILE"
}

# Check if directory exists
if [ ! -d "$BOT_DIR" ]; then
    log_error "Bot directory not found: $BOT_DIR"
    exit 1
fi

cd "$BOT_DIR"

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "🔄 Starting auto-update process..."
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Check if there are changes
log "📋 Checking for updates..."
git fetch origin main &>> "$LOG_FILE"

# Compare local vs remote
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    log_success "✓ Already up to date (commit: ${LOCAL:0:7})"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
fi

log "📥 New updates available!"
log "  Local commit:  ${LOCAL:0:7}"
log "  Remote commit: ${REMOTE:0:7}"

# 2. Create backup
log "💾 Creating backup..."
BACKUP_DIR="${HOME}/botwa-backups"
mkdir -p "$BACKUP_DIR"
BACKUP_NAME="botwa.backup.$(date +%Y%m%d_%H%M%S)"

if cp -r "$BOT_DIR" "$BACKUP_DIR/$BACKUP_NAME" 2>&1 | grep -v "cannot create"; then
    log_success "Backup created: $BACKUP_NAME"
else
    log_warning "Could not create full backup (disk space?), continuing anyway"
fi

# 3. Pull latest code
log "⬇️  Pulling latest code from GitHub..."
if ! git pull origin main 2>&1 | tee -a "$LOG_FILE"; then
    log_error "Failed to pull code!"
    log "Attempting to restore from backup..."
    rm -rf "$BOT_DIR"
    cp -r "$BACKUP_DIR/$BACKUP_NAME" "$BOT_DIR"
    exit 1
fi

log_success "Code pulled successfully"

# 4. Install/update dependencies
log "📦 Installing/updating dependencies..."
if npm install 2>&1 | grep -E "(added|up to date)" | tee -a "$LOG_FILE"; then
    log_success "Dependencies updated"
else
    log_warning "npm install completed with warnings"
fi

# 5. Restart bot via PM2
log "🔄 Restarting bot via PM2..."
if command -v pm2 &> /dev/null; then
    pm2 restart "$BOT_NAME" 2>&1 | tee -a "$LOG_FILE"
    
    if pm2 status "$BOT_NAME" | grep -q "online"; then
        log_success "Bot restarted successfully"
        sleep 2
        log "Bot status:"
        pm2 status "$BOT_NAME" | tee -a "$LOG_FILE"
    else
        log_error "Bot failed to start after restart!"
        exit 1
    fi
else
    log_warning "PM2 not found, skipping auto-restart"
    log "Restart manually with: pm2 restart $BOT_NAME"
fi

log_success "✅ Auto-update completed successfully!"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
