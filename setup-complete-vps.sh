#!/bin/bash

################################################################################
# 🤖 Bot WhatsApp Elaina - COMPLETE VPS SETUP SCRIPT
# 
# Fitur:
# ✅ System dependencies install
# ✅ Node.js setup
# ✅ Database import
# ✅ Bot installation
# ✅ PM2 auto-start configuration
# ✅ Backup management
#
# Usage: bash setup-complete-vps.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BOT_DIR="~/botwa"
BOT_NAME="botwa"
DB_FILE="products.db"
BACKUP_DIR="~/botwa-backups"
LOG_FILE="/tmp/botwa-setup.log"

################################################################################
# Helper Functions
################################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_section() {
    echo "" | tee -a "$LOG_FILE"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}📋 $1${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$LOG_FILE"
}

confirm() {
    local prompt="$1"
    local response
    read -p "$(echo -e ${YELLOW}$prompt${NC}) (y/n) " -n 1 -r response
    echo
    [[ $response =~ ^[Yy]$ ]]
}

################################################################################
# System Updates
################################################################################

setup_system() {
    log_section "STEP 1: System Update & Preparation"
    
    log "Updating package lists..."
    sudo apt-get update
    log_success "System updated"
    
    log "Installing essential packages..."
    sudo apt-get upgrade -y
    log_success "System upgraded"
    
    log "Installing base dependencies..."
    sudo apt-get install -y \
        curl wget git vim \
        build-essential \
        python3 python3-dev python3-pip \
        libssl-dev libffi-dev
    log_success "Base dependencies installed"
}

################################################################################
# Node.js Installation
################################################################################

setup_nodejs() {
    log_section "STEP 2: Node.js Installation"
    
    # Check if Node.js already installed
    if command -v node &> /dev/null; then
        local node_version=$(node -v)
        log "Node.js already installed: $node_version"
        
        if confirm "Update to Node.js 20 LTS?"; then
            log "Installing Node.js 20 LTS..."
            curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
            log_success "Node.js updated to $(node -v)"
        fi
    else
        log "Installing Node.js 20 LTS..."
        curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
        log_success "Node.js installed: $(node -v)"
    fi
    
    log_success "npm version: $(npm -v)"
}

################################################################################
# Sharp & SQLite Dependencies (CRITICAL!)
################################################################################

setup_sharp_dependencies() {
    log_section "STEP 3: Sharp & System Dependencies (CRITICAL!)"
    
    log "Installing build tools..."
    sudo apt-get install -y \
        build-essential \
        g++ gcc make \
        autoconf automake libtool
    log_success "Build tools installed"
    
    log "Installing SQLite development files..."
    sudo apt-get install -y \
        sqlite3 \
        libsqlite3-dev
    log_success "SQLite development files installed"
    
    log "Installing pkg-config (required for verification)..."
    sudo apt-get install -y pkg-config
    log_success "pkg-config installed"
    
    log "Installing libvips (for Sharp image processing)..."
    # Try to install libvips multiple times with different approaches
    if ! sudo apt-get install -y libvips libvips-dev; then
        log_warning "First libvips install attempt failed, retrying..."
        sudo apt-get update
        sudo apt-get install -y libvips libvips-dev
    fi
    log_success "libvips installation attempted"
    
    log "Installing glib development headers (for Sharp)..."
    sudo apt-get install -y \
        libglib2.0-dev \
        libglib2.0-0 \
        pkg-config
    log_success "glib development headers installed"
    
    # Verify Sharp can be built - with fallback checks
    log "Verifying Sharp dependencies..."
    
    # Check method 1: pkg-config libvips
    if pkg-config --modversion libvips &> /dev/null; then
        log_success "libvips verified via pkg-config: $(pkg-config --modversion libvips)"
    # Check method 2: file existence
    elif [ -f /usr/include/vips/vips.h ]; then
        log_success "libvips headers found at /usr/include/vips/vips.h"
    # Check method 3: library file
    elif [ -f /usr/lib/x86_64-linux-gnu/libvips.so ] || [ -f /usr/lib/x86_64-linux-gnu/libvips.so.42 ]; then
        log_success "libvips library file found"
    else
        log_error "libvips not properly installed!"
        log "Attempting manual installation from source..."
        sudo apt-get install -y libvips-dev
        
        # Final check
        if pkg-config --modversion libvips &> /dev/null || [ -f /usr/include/vips/vips.h ]; then
            log_success "libvips installed successfully on retry"
        else
            log_error "libvips installation still failed after retry!"
            return 1
        fi
    fi
}

################################################################################
# Clone Repository
################################################################################

setup_repository() {
    log_section "STEP 4: Clone Repository"
    
    # Expand ~ to home directory
    BOT_DIR=$(eval echo $BOT_DIR)
    BACKUP_DIR=$(eval echo $BACKUP_DIR)
    
    if [ -d "$BOT_DIR" ]; then
        log_warning "Directory $BOT_DIR already exists"
        
        if confirm "Remove and clone fresh?"; then
            log "Backing up existing directory..."
            sudo cp -r "$BOT_DIR" "$BACKUP_DIR/botwa.backup.$(date +%Y%m%d_%H%M%S)"
            rm -rf "$BOT_DIR"
        else
            log "Using existing directory at $BOT_DIR"
            return 0
        fi
    fi
    
    log "Creating backup directory..."
    mkdir -p "$BACKUP_DIR"
    
    log "Cloning repository from GitHub..."
    git clone https://github.com/inject29/botwa.git "$BOT_DIR"
    log_success "Repository cloned successfully"
    
    cd "$BOT_DIR"
    log_success "Changed directory to: $(pwd)"
}

################################################################################
# Install NPM Dependencies
################################################################################

setup_npm_dependencies() {
    log_section "STEP 5: Install NPM Dependencies"
    
    cd "$BOT_DIR"
    
    log "Cleaning npm cache..."
    npm cache clean --force
    
    log "Installing dependencies (this may take 3-5 minutes)..."
    log "Building from source for Sharp & SQLite3..."
    
    # Set environment variables for Sharp build
    export SHARP_IGNORE_GLOBAL_LIBVIPS=1
    export npm_config_build_from_source=true
    
    if npm install --build-from-source 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Dependencies installed successfully"
    else
        log_warning "First npm install attempt had issues, retrying..."
        log "Attempt 2: Installing with verbose output..."
        
        if npm install --build-from-source --verbose 2>&1 | tee -a "$LOG_FILE"; then
            log_success "Dependencies installed successfully on retry"
        else
            log_error "Failed to install dependencies on both attempts!"
            log "Troubleshooting:"
            log "  1. Check disk space: df -h"
            log "  2. Check memory: free -h"
            log "  3. Manual install: cd $BOT_DIR && npm install"
            return 1
        fi
    fi
    
    # Verify critical packages
    log "Verifying critical packages..."
    if npm ls sharp &> /dev/null; then
        log_success "Sharp package verified: $(npm ls sharp | head -2 | tail -1)"
    else
        log_warning "Sharp package verification returned non-zero, but may still work"
    fi
    
    if npm ls sqlite3 &> /dev/null; then
        log_success "SQLite3 package verified"
    else
        log_warning "SQLite3 package verification returned non-zero, but may still work"
    fi
}

################################################################################
# Database Setup & Import
################################################################################

setup_database() {
    log_section "STEP 6: Database Setup"
    
    cd "$BOT_DIR"
    
    if [ -f "$DB_FILE" ]; then
        log_warning "Database file already exists: $DB_FILE"
        log "Current database size: $(du -h $DB_FILE | cut -f1)"
        
        if confirm "Backup existing database?"; then
            local backup_name="${DB_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
            cp "$DB_FILE" "$backup_name"
            log_success "Database backed up to: $backup_name"
        fi
    else
        log_warning "Database file NOT found"
        echo ""
        log "📥 To import database:"
        log "   On your LOCAL machine, run:"
        echo "   scp /path/to/products.db user@vps-ip:~/botwa/"
        echo ""
        
        if confirm "Continue without database? (bot can run but won't find products)"; then
            log "⏭️  Skipping database import"
        else
            log_error "Setup cancelled - database required"
            return 1
        fi
    fi
    
    # Verify database if exists
    if [ -f "$DB_FILE" ]; then
        log "Verifying database integrity..."
        if sqlite3 "$DB_FILE" ".tables" &> /dev/null; then
            local table_count=$(sqlite3 "$DB_FILE" ".tables" | wc -w)
            log_success "Database verified with $table_count tables"
            
            # Count products
            if sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM products" &> /dev/null 2>&1; then
                local product_count=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM products" 2>/dev/null || echo "unknown")
                log_success "Found $product_count products in database"
            fi
        else
            log_error "Database verification failed!"
            return 1
        fi
    fi
}

################################################################################
# PM2 Setup (Auto-start)
################################################################################

setup_pm2() {
    log_section "STEP 7: PM2 Setup & Auto-start Configuration"
    
    log "Installing PM2 globally..."
    sudo npm install -g pm2
    log_success "PM2 installed: $(pm2 -v)"
    
    cd "$BOT_DIR"
    
    log "Stopping any existing bot instances..."
    pm2 stop "$BOT_NAME" 2>/dev/null || true
    pm2 delete "$BOT_NAME" 2>/dev/null || true
    
    log "Starting bot with PM2..."
    pm2 start index.js \
        --name "$BOT_NAME" \
        --max-memory-restart 256M \
        --watch \
        --ignore-watch "node_modules,baileys_auth_info,Barcode_generator" \
        --merge-logs \
        --log-date-format "YYYY-MM-DD HH:mm:ss"
    
    log_success "Bot started with PM2"
    
    log "Saving PM2 configuration..."
    pm2 save
    
    log "Setting up PM2 to restart on reboot..."
    sudo pm2 startup -u $USER --hp /home/$USER
    log_success "PM2 auto-start configured"
    
    log "Current PM2 services:"
    pm2 status
}

################################################################################
# Post-Installation Verification
################################################################################

verify_installation() {
    log_section "STEP 8: Verification & Testing"
    
    cd "$BOT_DIR"
    
    # Check file structure
    log "Checking project structure..."
    local files_ok=true
    
    for file in "index.js" "package.json" ".gitignore"; do
        if [ -f "$file" ]; then
            log_success "✓ Found: $file"
        else
            log_error "✗ Missing: $file"
            files_ok=false
        fi
    done
    
    if [ $files_ok = false ]; then
        log_error "Project structure incomplete!"
        return 1
    fi
    
    # Check database
    log "Checking database..."
    if [ -f "$DB_FILE" ]; then
        log_success "✓ Database found: $(du -h $DB_FILE | cut -f1)"
    else
        log_warning "⚠  Database not found - bot will run but won't find products"
    fi
    
    # Check folders
    log "Checking required folders..."
    mkdir -p "Barcode_generator"
    log_success "✓ Barcode_generator folder ready"
    
    # Check PM2 status
    log "Checking PM2 status..."
    if pm2 list | grep -q "$BOT_NAME"; then
        log_success "✓ Bot is running via PM2"
        pm2 logs "$BOT_NAME" --lines 10
    else
        log_error "Bot is not running!"
        return 1
    fi
    
    # Check logs
    log "Latest bot logs:"
    pm2 logs "$BOT_NAME" --lines 5 --nostream
}

################################################################################
# Summary & Next Steps
################################################################################

show_summary() {
    log_section "SETUP COMPLETE! 🎉"
    
    cat << EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Bot Installation Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ System Dependencies:  Installed
✅ Node.js:              $(node -v)
✅ npm:                  $(npm -v)
✅ PM2:                  $(pm2 -v)
✅ Bot:                  Running
✅ Database:             $([ -f "$BOT_DIR/$DB_FILE" ] && echo "Ready" || echo "Pending - See below")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📂 Bot Location:         $BOT_DIR
🗄️  Database:            $BOT_DIR/$DB_FILE
📊 PM2 Config:           ~/.pm2/conf.js
📝 Logs:                 ~/.pm2/logs/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Next Steps:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  IMPORT DATABASE (if not done yet):
   On your LOCAL machine:
   scp /path/to/products.db user@vps-ip:~/botwa/
   
   Then on VPS, restart bot:
   pm2 restart botwa

2️⃣  SCAN QR CODE & CONNECT WHATSAPP:
   pm2 logs botwa
   
   Look for QR code in terminal and scan with WhatsApp
   
3️⃣  TEST BOT:
   Send "tes" to bot on WhatsApp
   Expected: "🤖 Bot OK. Koneksi aktif. Halo [nama]!"
   
4️⃣  MANAGE BOT:
   View status:      pm2 status
   View logs:        pm2 logs botwa
   Restart bot:      pm2 restart botwa
   Stop bot:         pm2 stop botwa
   Start bot:        pm2 start botwa

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Documentation:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Full Docs:     ~/botwa/README.md
Install Help:  ~/botwa/INSTALL_VPS.md
Update Guide:  ~/botwa/UPDATE_VPS.md
Cheatsheet:    ~/botwa/CHEATSHEET.md
Sharp Issues:  ~/botwa/TROUBLESHOOTING_SHARP.md

📖 Online: https://github.com/inject29/botwa

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ Common Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Monitor bot
pm2 logs botwa -f

# Update bot
cd ~/botwa && git pull && npm install && pm2 restart botwa

# Backup database
cp ~/botwa/products.db ~/botwa/products.db.backup.\$(date +%Y%m%d)

# View all PM2 services
pm2 status

# Full logs
journalctl -u botwa -f  (if using systemd)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Setup log saved to: $LOG_FILE

EOF

    log_success "Setup completed successfully!"
}

################################################################################
# Error Handling
################################################################################

cleanup_on_error() {
    log_error "Setup failed! Check logs: $LOG_FILE"
    echo ""
    log "Troubleshooting tips:"
    log "1. Check internet connection"
    log "2. Ensure sudo access"
    log "3. Try running manually to see full errors"
    log "4. Check: https://github.com/inject29/botwa/blob/main/TROUBLESHOOTING_SHARP.md"
    exit 1
}

trap cleanup_on_error ERR

################################################################################
# Main Execution
################################################################################

main() {
    clear
    
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  🤖 Bot WhatsApp Elaina - COMPLETE VPS SETUP v1.0       ║
║                                                           ║
║  Automated Installation & Configuration Script           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

EOF

    echo "Starting setup process..."
    echo "Setup log: $LOG_FILE"
    echo ""
    
    # Run setup steps
    setup_system              || cleanup_on_error
    setup_nodejs              || cleanup_on_error
    setup_sharp_dependencies  || cleanup_on_error
    setup_repository          || cleanup_on_error
    setup_npm_dependencies    || cleanup_on_error
    setup_database            || cleanup_on_error
    setup_pm2                 || cleanup_on_error
    verify_installation       || cleanup_on_error
    
    # Show summary
    show_summary
}

# Run main function
main "$@"
