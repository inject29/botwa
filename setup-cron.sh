#!/bin/bash

################################################################################
# 🤖 Bot WhatsApp - Setup Cron Auto-Update
# 
# Script ini mengatur auto-update otomatis via cron job
# Jalankan sekali untuk setup, kemudian cron akan berjalan otomatis
################################################################################

set -e

BOT_DIR="${HOME}/botwa"
SCRIPT_NAME="auto-update-bot.sh"
LOG_FILE="${HOME}/botwa-cron.log"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 Bot WhatsApp - Cron Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if botwa directory exists
if [ ! -d "$BOT_DIR" ]; then
    echo "❌ Bot directory not found: $BOT_DIR"
    echo "Please clone/setup bot first"
    exit 1
fi

# Make script executable
if [ -f "$BOT_DIR/$SCRIPT_NAME" ]; then
    chmod +x "$BOT_DIR/$SCRIPT_NAME"
    echo "✅ Made script executable: $SCRIPT_NAME"
else
    echo "❌ Script not found: $BOT_DIR/$SCRIPT_NAME"
    exit 1
fi

echo ""
echo "📋 Cron Schedule Options:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Every day at 2 AM (recommended):"
echo "   0 2 * * * bash ${BOT_DIR}/${SCRIPT_NAME} >> ${LOG_FILE} 2>&1"
echo ""
echo "2️⃣  Every 6 hours:"
echo "   0 */6 * * * bash ${BOT_DIR}/${SCRIPT_NAME} >> ${LOG_FILE} 2>&1"
echo ""
echo "3️⃣  Every 12 hours:"
echo "   0 */12 * * * bash ${BOT_DIR}/${SCRIPT_NAME} >> ${LOG_FILE} 2>&1"
echo ""
echo "4️⃣  Every hour:"
echo "   0 * * * * bash ${BOT_DIR}/${SCRIPT_NAME} >> ${LOG_FILE} 2>&1"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Setup Instructions:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Edit crontab:"
echo "   crontab -e"
echo ""
echo "2. Add one of the schedule lines above (Pilih schedule yang diinginkan)"
echo ""
echo "3. Save and exit"
echo ""
echo "4. Verify cron job:"
echo "   crontab -l"
echo ""
echo "5. Monitor logs:"
echo "   tail -f ${LOG_FILE}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Setup complete!"
echo "   Script: ${BOT_DIR}/${SCRIPT_NAME}"
echo "   Logs:   ${LOG_FILE}"
echo ""
echo "📊 Test run (dry run):"
echo "   bash ${BOT_DIR}/${SCRIPT_NAME}"
echo ""
