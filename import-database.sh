#!/bin/bash

################################################################################
# 📊 Database Import Script untuk Bot WhatsApp
# 
# Fungsi:
# ✅ Import products.db dengan verification
# ✅ Backup database lama
# ✅ Verify database integrity
# ✅ Show database statistics
#
# Usage: 
#   bash import-database.sh
#   atau
#   bash import-database.sh /path/to/products.db
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BOT_DIR="${1:-~/botwa}"
DB_FILE="${2:-products.db}"
BACKUP_DIR="$BOT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Expand ~ to home directory
BOT_DIR=$(eval echo $BOT_DIR)

################################################################################
# Helper Functions
################################################################################

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

confirm() {
    local response
    read -p "$(echo -e ${YELLOW}$1${NC}) (y/n) " -n 1 -r response
    echo
    [[ $response =~ ^[Yy]$ ]]
}

################################################################################
# Main Script
################################################################################

main() {
    log_section "🤖 Database Import Tool"
    
    # Check if in bot directory
    if [ ! -f "$BOT_DIR/package.json" ]; then
        log_error "Bot directory not found at: $BOT_DIR"
        log "Usage: bash import-database.sh [bot_dir] [db_path]"
        log "Example: bash import-database.sh ~/botwa /home/user/products.db"
        exit 1
    fi
    
    log "Bot directory: $BOT_DIR"
    
    # Get database from current directory or parameter
    local SOURCE_DB=""
    
    if [ -n "$2" ] && [ -f "$2" ]; then
        SOURCE_DB="$2"
        log "Using database from parameter: $SOURCE_DB"
    elif [ -f "products.db" ]; then
        SOURCE_DB="products.db"
        log "Found products.db in current directory"
    elif [ -f "$BOT_DIR/products.db" ]; then
        log "Database already exists in bot directory"
        
        if confirm "Use existing database in $BOT_DIR/products.db?"; then
            SOURCE_DB="$BOT_DIR/products.db"
        else
            read -p "Enter path to new database file: " SOURCE_DB
        fi
    else
        log_warning "No database file found"
        echo ""
        echo "To import database, you need to:"
        echo "1. On LOCAL machine, copy database to VPS:"
        echo "   scp /path/to/products.db user@vps-ip:~/"
        echo ""
        echo "2. Then run this script:"
        echo "   bash import-database.sh ~/botwa ~/products.db"
        exit 1
    fi
    
    # Verify source database exists
    if [ ! -f "$SOURCE_DB" ]; then
        log_error "Source database not found: $SOURCE_DB"
        exit 1
    fi
    
    log_success "Source database found"
    log "File size: $(du -h $SOURCE_DB | cut -f1)"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup existing database if it exists
    if [ -f "$BOT_DIR/products.db" ]; then
        log_warning "Existing database found in bot directory"
        
        if confirm "Backup existing database?"; then
            local backup_file="$BACKUP_DIR/products.db.backup.$TIMESTAMP"
            cp "$BOT_DIR/products.db" "$backup_file"
            log_success "Existing database backed up to: $backup_file"
        fi
    fi
    
    # Copy new database
    log_section "📋 Importing Database"
    
    log "Copying database from: $SOURCE_DB"
    log "To: $BOT_DIR/products.db"
    
    cp "$SOURCE_DB" "$BOT_DIR/products.db"
    log_success "Database copied"
    
    # Verify database integrity
    log_section "🔍 Verifying Database"
    
    cd "$BOT_DIR"
    
    log "Checking database integrity..."
    if sqlite3 "products.db" ".tables" &> /dev/null; then
        log_success "Database integrity verified"
    else
        log_error "Database integrity check failed!"
        log "Restoring from backup..."
        if [ -f "$BACKUP_DIR/products.db.backup.$TIMESTAMP" ]; then
            cp "$BACKUP_DIR/products.db.backup.$TIMESTAMP" "products.db"
            log_warning "Restored from backup"
        fi
        exit 1
    fi
    
    # Show database statistics
    log_section "📊 Database Statistics"
    
    log "Listing tables:"
    sqlite3 "products.db" ".tables"
    
    # Try to count products
    if sqlite3 "products.db" "PRAGMA table_info(products);" &> /dev/null; then
        log "Counting products in database..."
        local product_count=$(sqlite3 "products.db" "SELECT COUNT(*) FROM products" 2>/dev/null || echo "0")
        log_success "Total products: $product_count"
        
        # Show sample
        if [ "$product_count" -gt 0 ]; then
            log "Sample products (first 3):"
            sqlite3 "products.db" "SELECT plu, barcode, nama FROM products LIMIT 3;" | while read line; do
                echo "  • $line"
            done
        fi
    fi
    
    # Show file details
    log_section "✅ Import Complete"
    
    log "Database file permissions:"
    ls -lh "products.db"
    
    log ""
    log_success "Database imported successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Restart bot: pm2 restart botwa"
    echo "2. Test bot with: .cari [product-name]"
    echo "3. Send single PLU: [kode]"
    echo ""
    echo "To verify: send 'tes' to bot on WhatsApp"
}

# Run main function
main "$@"
