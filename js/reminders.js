/**
 * FitTrack Pro - Daily Diet Routine & Reminders Manager
 * Handles Meal Schedules, Water Alerts, Notification Permissions & Schedulers.
 */

const ReminderManager = {
    timerId: null,
    lastWaterAlertTime: 0,
    triggeredToday: {},

    init() {
        this.startScheduleLoop();
    },

    /**
     * Check current browser notification permission status
     */
    getPermissionStatus() {
        if (!('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission; // 'granted', 'denied', 'default'
    },

    /**
     * Request user permission for browser notifications
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            Utils.showToast('Browser notifications are not supported on this device/browser.', 'warning');
            return 'unsupported';
        }

        try {
            const permission = await Notification.requestPermission();
            const settings = StorageManager.getSettings();
            settings.notificationsEnabled = (permission === 'granted');
            StorageManager.saveSettings(settings);

            if (permission === 'granted') {
                Utils.showToast('Notifications enabled! FitTrack Pro will alert you for meals and hydration.', 'success');
                this.sendNotification('FitTrack Pro Active', 'Smart diet and hydration reminders are now activated!');
            } else {
                Utils.showToast('Notification permission was not granted. In-app alerts will be used instead.', 'warning');
            }
            return permission;
        } catch (e) {
            console.error('Error requesting notification permission:', e);
            return 'denied';
        }
    },

    /**
     * Send notification (System Notification if granted + In-App Toast)
     */
    sendNotification(title, body, icon = null) {
        // Always show in-app toast
        Utils.showToast(`${title}: ${body}`, 'info', 4500);

        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const n = new Notification(title, {
                    body: body,
                    icon: icon || 'assets/icons/icon-192.png',
                    tag: 'fittrack-' + Date.now()
                });
                n.onclick = () => {
                    window.focus();
                    n.close();
                };
            } catch (e) {
                console.warn('System notification dispatch failed:', e);
            }
        }
    },

    /**
     * Loop checking for meal times and hydration reminders
     */
    startScheduleLoop() {
        if (this.timerId) clearInterval(this.timerId);

        // Check every 30 seconds
        this.timerId = setInterval(() => {
            this.checkSchedules();
        }, 30000);

        // Run an immediate check on startup
        this.checkSchedules();
    },

    checkSchedules() {
        const settings = StorageManager.getSettings();
        const mealTimes = settings.mealTimes || {
            breakfast: '08:30',
            lunch: '13:00',
            snack: '17:30',
            dinner: '20:30'
        };

        const now = new Date();
        const currentHHMM = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        const todayStr = Utils.getTodayDate();

        // Check Meals
        const meals = [
            { key: 'breakfast', label: 'Breakfast', time: mealTimes.breakfast, msg: 'Time for your high-protein breakfast! Fuel your aesthetic transformation.' },
            { key: 'lunch', label: 'Lunch', time: mealTimes.lunch, msg: 'Lunchtime! Fuel muscle recovery with quality carbs and protein.' },
            { key: 'snack', label: 'Evening Snack', time: mealTimes.snack, msg: 'Pre-workout / Evening snack reminder. Keep your metabolic engine burning.' },
            { key: 'dinner', label: 'Dinner', time: mealTimes.dinner, msg: 'Dinner time! Hit your remaining protein target for overnight muscle protein synthesis.' }
        ];

        meals.forEach(m => {
            const triggerKey = `${todayStr}_${m.key}_${m.time}`;
            if (currentHHMM === m.time && !this.triggeredToday[triggerKey]) {
                this.triggeredToday[triggerKey] = true;
                this.sendNotification(`🍽️ ${m.label} Reminder`, m.msg);
            }
        });

        // Water reminder interval
        const intervalMs = (settings.waterReminderInterval || 60) * 60 * 1000;
        const nowMs = Date.now();
        if (nowMs - this.lastWaterAlertTime >= intervalMs) {
            // Check if user has already met water goal
            const dayLog = StorageManager.getDayLog(todayStr);
            const profile = StorageManager.getProfile();
            const targetWater = profile ? profile.waterIntake || 3500 : 3500;

            if (dayLog.water < targetWater && now.getHours() >= 8 && now.getHours() <= 22) {
                this.lastWaterAlertTime = nowMs;
                this.sendNotification('💧 Hydration Check', `Drink a glass of water! Current: ${dayLog.water}ml / Goal: ${targetWater}ml.`);
            }
        }
    },

    /**
     * Send test notification
     */
    testReminder() {
        Utils.playBeep('beep');
        this.sendNotification('FitTrack Pro Test Alert', 'Reminders are functioning properly! You will receive scheduled alerts throughout the day.');
    }
};

window.ReminderManager = ReminderManager;
