/**
 * AI Cache Manager
 * Menyimpan responses dari Groq untuk mengurangi API calls
 */

const fs = require('fs');
const crypto = require('crypto');

const CACHE_FILE = 'ai_cache.json';
const CACHE_EXPIRY_HOURS = parseInt(process.env.CACHE_EXPIRY_HOURS) || 720; // Default: 1 bulan (720 jam)

class AICache {
    constructor() {
        this.cache = this.loadCache();
    }

    /**
     * Load cache dari file
     */
    loadCache() {
        try {
            if (fs.existsSync(CACHE_FILE)) {
                const data = fs.readFileSync(CACHE_FILE, 'utf-8');
                return JSON.parse(data) || {};
            }
        } catch (err) {
            console.warn('⚠️ Gagal load cache:', err.message);
        }
        return {};
    }

    /**
     * Save cache ke file
     */
    saveCache() {
        try {
            fs.writeFileSync(CACHE_FILE, JSON.stringify(this.cache, null, 2), 'utf-8');
        } catch (err) {
            console.error('❌ Error saving cache:', err.message);
        }
    }

    /**
     * Generate hash key dari prompt
     */
    generateKey(prompt) {
        return crypto.createHash('md5').update(prompt).digest('hex');
    }

    /**
     * Get cached response
     */
    get(prompt) {
        const key = this.generateKey(prompt);
        const cached = this.cache[key];

        if (!cached) {
            return null;
        }

        // Check if cache expired
        const createdAt = new Date(cached.timestamp).getTime();
        const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
        const now = Date.now();

        if (now - createdAt > expiryTime) {
            // Cache expired, delete it
            delete this.cache[key];
            this.saveCache();
            return null;
        }

        cached.hits = (cached.hits || 0) + 1;
        this.saveCache();
        console.log(`📦 Cache HIT untuk prompt (hits: ${cached.hits})`);
        return cached.response;
    }

    /**
     * Set cache
     */
    set(prompt, response) {
        const key = this.generateKey(prompt);
        this.cache[key] = {
            prompt: prompt.substring(0, 100), // Store first 100 chars for reference
            response: response,
            timestamp: new Date().toISOString(),
            hits: 0
        };
        this.saveCache();
        console.log(`💾 Cache SAVED (total items: ${Object.keys(this.cache).length})`);
    }

    /**
     * Clear cache
     */
    clear() {
        this.cache = {};
        this.saveCache();
        console.log('🧹 Cache cleared');
    }

    /**
     * Get cache stats
     */
    getStats() {
        const entries = Object.values(this.cache);
        const totalHits = entries.reduce((sum, entry) => sum + (entry.hits || 0), 0);
        
        return {
            totalItems: entries.length,
            totalHits: totalHits,
            estimatedSavings: totalHits, // Setiap hit = 1 API call terhemat
            entries: entries.map(e => ({
                prompt: e.prompt,
                hits: e.hits,
                timestamp: e.timestamp
            }))
        };
    }

    /**
     * Format stats untuk ditampilkan
     */
    getStatsMessage() {
        const stats = this.getStats();
        return `📊 *Cache Statistics:*
✅ Total cached: ${stats.totalItems} responses
🎯 Cache hits: ${stats.totalHits} times
💰 API calls saved: ${stats.totalHits}
📈 Average efficiency: ${stats.totalItems > 0 ? (stats.totalHits / stats.totalItems).toFixed(2) : 0}x`;
    }
}

module.exports = new AICache();
