/**
 * FitTrack Pro - Utility Functions & Helpers
 */

const Utils = {
    /**
     * Get current local date in YYYY-MM-DD format
     */
    getTodayDate() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Format ISO date string into human readable string
     */
    formatDate(dateStr, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            return date.toLocaleDateString('en-US', options);
        }
        return dateStr;
    },

    /**
     * Add or subtract days to a YYYY-MM-DD string
     */
    addDays(dateStr, days) {
        const parts = dateStr.split('-');
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        date.setDate(date.getDate() + days);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Difference in days between two date strings (d2 - d1)
     */
    daysBetween(dateStr1, dateStr2) {
        const p1 = dateStr1.split('-');
        const p2 = dateStr2.split('-');
        const d1 = new Date(parseInt(p1[0]), parseInt(p1[1]) - 1, parseInt(p1[2]));
        const d2 = new Date(parseInt(p2[0]), parseInt(p2[1]) - 1, parseInt(p2[2]));
        const diffTime = d2.getTime() - d1.getTime();
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Format time (HH:mm) to 12-hour AM/PM format
     */
    formatTime(timeStr) {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${minutes} ${ampm}`;
    },

    /**
     * Round number to decimals
     */
    round(val, decimals = 1) {
        if (val === null || val === undefined || isNaN(val)) return 0;
        const factor = Math.pow(10, decimals);
        return Math.round(val * factor) / factor;
    },

    /**
     * Generate unique random ID
     */
    generateId() {
        return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    },

    /**
     * In-App Toast Notification
     */
    showToast(message, type = 'info', duration = 3500) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;
        
        let iconHtml = '🔔';
        if (type === 'success') iconHtml = '✓';
        else if (type === 'warning') iconHtml = '⚠';
        else if (type === 'error') iconHtml = '✕';

        toast.innerHTML = `
            <span class="toast-icon">${iconHtml}</span>
            <div class="toast-content">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('toast-fade-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Web Audio API Synthesizer Beep (for rest timer and achievement sounds)
     */
    playBeep(type = 'beep') {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            
            if (type === 'beep') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.35);
            } else if (type === 'timer_done') {
                // 3 short pleasant chimes
                [0, 0.15, 0.3].forEach((delay, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(idx === 2 ? 1046.5 : 880, ctx.currentTime + delay);
                    gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + delay);
                    osc.stop(ctx.currentTime + delay + 0.25);
                });
            } else if (type === 'success') {
                // Chord fanfare
                [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + (idx * 0.08));
                    gain.gain.setValueAtTime(0.2, ctx.currentTime + (idx * 0.08));
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (idx * 0.08) + 0.4);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + (idx * 0.08));
                    osc.stop(ctx.currentTime + (idx * 0.08) + 0.4);
                });
            }
        } catch (e) {
            console.warn('Audio playback error:', e);
        }
    },

    /**
     * Download text / CSV file
     */
    downloadCSV(filename, headers, rows) {
        const processRow = (row) => row.map(val => {
            if (val === null || val === undefined) return '""';
            let str = String(val).replace(/"/g, '""');
            if (str.search(/("|,|\n)/g) >= 0) {
                str = `"${str}"`;
            }
            return str;
        }).join(',');

        const csvContent = 'data:text/csv;charset=utf-8,' + 
            [headers.join(','), ...rows.map(processRow)].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    /**
     * Download JSON data
     */
    downloadJSON(filename, data) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', filename);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    },

    /**
     * Read JSON file uploaded via input[type="file"]
     */
    readJSONFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const parsed = JSON.parse(e.target.result);
                    resolve(parsed);
                } catch (err) {
                    reject(new Error('Invalid JSON format'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    },

    /**
     * Convert Image File to base64 Data URL
     */
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read image'));
            reader.readAsDataURL(file);
        });
    },

    /**
     * Debounce helper
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

window.Utils = Utils;
