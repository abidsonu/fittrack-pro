/**
 * FitTrack Pro - Data Storage & IndexedDB Manager
 */

const StorageManager = {
    KEYS: {
        PROFILE: 'ftp_profile',
        DAILY_LOGS: 'ftp_daily_logs',
        WORKOUTS: 'ftp_workouts',
        BODY_MEASUREMENTS: 'ftp_body_measurements',
        CUSTOM_FOODS: 'ftp_custom_foods',
        CUSTOM_HABITS: 'ftp_custom_habits',
        MILESTONES: 'ftp_milestones',
        SETTINGS: 'ftp_settings',
        PRS: 'ftp_prs'
    },

    db: null,

    /**
     * Initialize LocalStorage defaults and IndexedDB connection
     */
    async init() {
        this.initSettings();
        await this.initIndexedDB();
    },

    // -------------------------------------------------------------
    // LOCAL STORAGE HELPERS
    // -------------------------------------------------------------
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error(`Error reading ${key} from LocalStorage:`, e);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Error writing ${key} to LocalStorage:`, e);
            return false;
        }
    },

    // -------------------------------------------------------------
    // PROFILE
    // -------------------------------------------------------------
    getProfile() {
        return this.get(this.KEYS.PROFILE, null);
    },

    saveProfile(profileData) {
        return this.set(this.KEYS.PROFILE, profileData);
    },

    hasProfile() {
        return !!this.getProfile();
    },

    // -------------------------------------------------------------
    // SETTINGS
    // -------------------------------------------------------------
    initSettings() {
        const defaults = {
            theme: 'dark',
            notificationsEnabled: false,
            mealTimes: {
                breakfast: '08:30',
                lunch: '13:00',
                snack: '17:30',
                dinner: '20:30'
            },
            waterReminderInterval: 60, // minutes
            unitSystem: 'metric'
        };
        const current = this.get(this.KEYS.SETTINGS);
        if (!current) {
            this.set(this.KEYS.SETTINGS, defaults);
        }
    },

    getSettings() {
        return this.get(this.KEYS.SETTINGS, {});
    },

    saveSettings(settings) {
        return this.set(this.KEYS.SETTINGS, settings);
    },

    // -------------------------------------------------------------
    // DAILY LOGS (keyed by YYYY-MM-DD)
    // -------------------------------------------------------------
    getDailyLogs() {
        return this.get(this.KEYS.DAILY_LOGS, {});
    },

    getDayLog(dateStr) {
        const logs = this.getDailyLogs();
        if (!logs[dateStr]) {
            return {
                date: dateStr,
                nutrition: [],
                water: 0,
                sleep: { hours: 0, quality: 'good' },
                weight: null,
                journal: '',
                habits: {
                    cold_bath: false,
                    protein: false,
                    veggies: false,
                    water: false,
                    sunlight: false,
                    creatine: false,
                    workout: false,
                    steps: false,
                    stretch: false,
                    sleep: false,
                    clean_food: false,
                    journal: false
                },
                completedMeals: {
                    breakfast: false,
                    morning_snack: false,
                    lunch: false,
                    evening_snack: false,
                    dinner: false,
                    other: false
                }
            };
        }
        return logs[dateStr];
    },

    saveDayLog(dateStr, dayData) {
        const logs = this.getDailyLogs();
        logs[dateStr] = { ...this.getDayLog(dateStr), ...dayData, date: dateStr };
        return this.set(this.KEYS.DAILY_LOGS, logs);
    },

    // -------------------------------------------------------------
    // WORKOUTS
    // -------------------------------------------------------------
    getWorkouts() {
        return this.get(this.KEYS.WORKOUTS, []);
    },

    saveWorkout(workoutData) {
        const workouts = this.getWorkouts();
        if (!workoutData.id) workoutData.id = Utils.generateId();
        const existingIdx = workouts.findIndex(w => w.id === workoutData.id);
        if (existingIdx >= 0) {
            workouts[existingIdx] = workoutData;
        } else {
            workouts.unshift(workoutData);
        }
        this.set(this.KEYS.WORKOUTS, workouts);
        this.updatePRsFromWorkout(workoutData);
        return workoutData;
    },

    deleteWorkout(id) {
        let workouts = this.getWorkouts();
        workouts = workouts.filter(w => w.id !== id);
        return this.set(this.KEYS.WORKOUTS, workouts);
    },

    // -------------------------------------------------------------
    // PERSONAL RECORDS (PRs)
    // -------------------------------------------------------------
    getPRs() {
        return this.get(this.KEYS.PRS, {});
    },

    updatePRsFromWorkout(workout) {
        if (!workout || !workout.exercises) return;
        const prs = this.getPRs();
        let changed = false;

        workout.exercises.forEach(ex => {
            const exName = ex.name.trim();
            if (!prs[exName]) {
                prs[exName] = { maxWeight: 0, maxRepsAtMax: 0, estimated1RM: 0, date: workout.date };
            }

            if (ex.sets && Array.isArray(ex.sets)) {
                ex.sets.forEach(s => {
                    if (s.completed && s.weight > 0 && s.reps > 0) {
                        // Epley formula for 1RM: Weight * (1 + Reps/30)
                        const e1rm = Math.round(s.weight * (1 + s.reps / 30));
                        if (s.weight > prs[exName].maxWeight || e1rm > prs[exName].estimated1RM) {
                            prs[exName] = {
                                maxWeight: Math.max(s.weight, prs[exName].maxWeight),
                                maxRepsAtMax: s.weight >= prs[exName].maxWeight ? s.reps : prs[exName].maxRepsAtMax,
                                estimated1RM: Math.max(e1rm, prs[exName].estimated1RM),
                                date: workout.date
                            };
                            changed = true;
                        }
                    }
                });
            }
        });

        if (changed) {
            this.set(this.KEYS.PRS, prs);
        }
    },

    // -------------------------------------------------------------
    // BODY MEASUREMENTS
    // -------------------------------------------------------------
    getBodyMeasurements() {
        const list = this.get(this.KEYS.BODY_MEASUREMENTS, []);
        return list.sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    saveBodyMeasurement(record) {
        const list = this.get(this.KEYS.BODY_MEASUREMENTS, []);
        if (!record.id) record.id = Utils.generateId();
        const idx = list.findIndex(m => m.id === record.id || m.date === record.date);
        if (idx >= 0) {
            list[idx] = { ...list[idx], ...record };
        } else {
            list.push(record);
        }
        list.sort((a, b) => new Date(a.date) - new Date(b.date));
        this.set(this.KEYS.BODY_MEASUREMENTS, list);

        // Also sync weight with today's daily log if applicable
        if (record.weight) {
            const dayLog = this.getDayLog(record.date);
            dayLog.weight = parseFloat(record.weight);
            this.saveDayLog(record.date, dayLog);
        }
        return record;
    },

    deleteBodyMeasurement(id) {
        let list = this.get(this.KEYS.BODY_MEASUREMENTS, []);
        list = list.filter(m => m.id !== id);
        return this.set(this.KEYS.BODY_MEASUREMENTS, list);
    },

    // -------------------------------------------------------------
    // CUSTOM FOODS
    // -------------------------------------------------------------
    getCustomFoods() {
        return this.get(this.KEYS.CUSTOM_FOODS, []);
    },

    saveCustomFood(food) {
        const list = this.getCustomFoods();
        if (!food.id) food.id = 'custom_' + Utils.generateId();
        const idx = list.findIndex(f => f.id === food.id);
        if (idx >= 0) {
            list[idx] = food;
        } else {
            list.push(food);
        }
        this.set(this.KEYS.CUSTOM_FOODS, list);
        return food;
    },

    deleteCustomFood(id) {
        let list = this.getCustomFoods();
        list = list.filter(f => f.id !== id);
        return this.set(this.KEYS.CUSTOM_FOODS, list);
    },

    // -------------------------------------------------------------
    // CUSTOM HABITS
    // -------------------------------------------------------------
    getCustomHabits() {
        return this.get(this.KEYS.CUSTOM_HABITS, []);
    },

    saveCustomHabit(habit) {
        const list = this.getCustomHabits();
        if (!habit.id) habit.id = 'habit_' + Utils.generateId();
        list.push(habit);
        this.set(this.KEYS.CUSTOM_HABITS, list);
        return habit;
    },

    deleteCustomHabit(id) {
        let list = this.getCustomHabits();
        list = list.filter(h => h.id !== id);
        return this.set(this.KEYS.CUSTOM_HABITS, list);
    },

    // -------------------------------------------------------------
    // MILESTONES & BADGES
    // -------------------------------------------------------------
    getMilestones() {
        return this.get(this.KEYS.MILESTONES, null);
    },

    saveMilestones(data) {
        return this.set(this.KEYS.MILESTONES, data);
    },

    // -------------------------------------------------------------
    // INDEXEDDB FOR PROGRESS PHOTOS
    // -------------------------------------------------------------
    initIndexedDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.warn('IndexedDB not supported in this browser. Fallback storage will be used.');
                resolve(null);
                return;
            }

            const request = indexedDB.open('FitTrackProDB', 1);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('photos')) {
                    const store = db.createObjectStore('photos', { keyPath: 'id' });
                    store.createIndex('date', 'date', { unique: false });
                    store.createIndex('month', 'month', { unique: false });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };

            request.onerror = (e) => {
                console.error('IndexedDB open error:', e);
                resolve(null);
            };
        });
    },

    async savePhoto(photoRecord) {
        if (!photoRecord.id) photoRecord.id = Utils.generateId();
        if (!this.db) {
            // LocalStorage fallback for small size
            const photos = this.get('ftp_photos_fallback', []);
            photos.push(photoRecord);
            this.set('ftp_photos_fallback', photos);
            return photoRecord;
        }

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['photos'], 'readwrite');
            const store = tx.objectStore('photos');
            const request = store.put(photoRecord);
            request.onsuccess = () => resolve(photoRecord);
            request.onerror = (e) => reject(e);
        });
    },

    async getAllPhotos() {
        if (!this.db) {
            return this.get('ftp_photos_fallback', []);
        }

        return new Promise((resolve) => {
            const tx = this.db.transaction(['photos'], 'readonly');
            const store = tx.objectStore('photos');
            const request = store.getAll();
            request.onsuccess = (e) => {
                const results = e.target.result || [];
                results.sort((a, b) => new Date(a.date) - new Date(b.date));
                resolve(results);
            };
            request.onerror = () => resolve([]);
        });
    },

    async deletePhoto(id) {
        if (!this.db) {
            let photos = this.get('ftp_photos_fallback', []);
            photos = photos.filter(p => p.id !== id);
            this.set('ftp_photos_fallback', photos);
            return true;
        }

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['photos'], 'readwrite');
            const store = tx.objectStore('photos');
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
        });
    },

    async clearPhotos() {
        if (!this.db) {
            localStorage.removeItem('ftp_photos_fallback');
            return true;
        }
        return new Promise((resolve) => {
            const tx = this.db.transaction(['photos'], 'readwrite');
            const store = tx.objectStore('photos');
            store.clear();
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    },

    // -------------------------------------------------------------
    // COMPLETE BACKUP & RESTORE
    // -------------------------------------------------------------
    async exportCompleteBackup() {
        const photos = await this.getAllPhotos();
        const backup = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            profile: this.getProfile(),
            dailyLogs: this.getDailyLogs(),
            workouts: this.getWorkouts(),
            bodyMeasurements: this.getBodyMeasurements(),
            customFoods: this.getCustomFoods(),
            milestones: this.getMilestones(),
            settings: this.getSettings(),
            prs: this.getPRs(),
            photos: photos
        };
        return backup;
    },

    async restoreCompleteBackup(backupData) {
        if (!backupData || typeof backupData !== 'object') {
            throw new Error('Invalid backup file');
        }

        if (backupData.profile) this.saveProfile(backupData.profile);
        if (backupData.dailyLogs) this.set(this.KEYS.DAILY_LOGS, backupData.dailyLogs);
        if (backupData.workouts) this.set(this.KEYS.WORKOUTS, backupData.workouts);
        if (backupData.bodyMeasurements) this.set(this.KEYS.BODY_MEASUREMENTS, backupData.bodyMeasurements);
        if (backupData.customFoods) this.set(this.KEYS.CUSTOM_FOODS, backupData.customFoods);
        if (backupData.milestones) this.set(this.KEYS.MILESTONES, backupData.milestones);
        if (backupData.settings) this.set(this.KEYS.SETTINGS, backupData.settings);
        if (backupData.prs) this.set(this.KEYS.PRS, backupData.prs);

        if (Array.isArray(backupData.photos)) {
            await this.clearPhotos();
            for (const p of backupData.photos) {
                await this.savePhoto(p);
            }
        }

        return true;
    },

    async resetAllData() {
        Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
        localStorage.removeItem('ftp_photos_fallback');
        await this.clearPhotos();
        this.initSettings();
    },

    // -------------------------------------------------------------
    // LOAD REALISTIC SAMPLE 6-MONTH TRANSFORMATION DATA
    // -------------------------------------------------------------
    async loadDemoData() {
        const today = Utils.getTodayDate();
        // Assume program started ~60 days ago
        const startDate = Utils.addDays(today, -60);

        const profile = {
            name: "Alex Rivera",
            age: 26,
            gender: "male",
            height: 178,
            currentWeight: 75.5,
            targetWeight: 72.0,
            startingWeight: 82.0,
            country: "India",
            activityLevel: "moderately_active",
            currentPhysique: "skinny_fat",
            primaryGoal: "lean_muscle_gain",
            desiredPhysique: "Aesthetic V-Taper, 10-12% Body Fat with visible abs and full chest",
            targetWaist: 78,
            startDate: startDate,
            workoutType: "gym",
            availableDays: 5,
            preferredTime: "18:00",
            sleepDuration: 8,
            waterIntake: 3500,
            dietaryPreference: "non_vegetarian",
            allergies: "None",
            mealsPerDay: 4,
            equipment: "Full Commercial Gym Access",
            fitnessExperience: "intermediate",
            currentExperience: "1 year intermittent gym training",
            limitations: "None",
            bmr: 1765,
            tdee: 2735,
            calorieTarget: 2500,
            proteinTarget: 165,
            carbTarget: 280,
            fatTarget: 65
        };
        this.saveProfile(profile);

        // Generate past 30 days of rich daily logs
        const dailyLogs = {};
        let currentWeight = 82.0;

        for (let i = 60; i >= 0; i--) {
            const dateStr = Utils.addDays(today, -i);
            const progressRatio = (60 - i) / 60;
            currentWeight = Math.round((82.0 - progressRatio * 6.5) * 10) / 10;

            const isRestDay = (i % 7 === 0 || i % 7 === 4);
            const waterConsumed = 2800 + Math.floor(Math.random() * 800);
            const sleepHrs = Math.round((7 + Math.random() * 1.5) * 10) / 10;

            dailyLogs[dateStr] = {
                date: dateStr,
                weight: currentWeight,
                water: waterConsumed,
                sleep: { hours: sleepHrs, quality: sleepHrs >= 7.5 ? 'good' : 'average' },
                journal: i === 0 ? "Felt incredible today! Hit new PR on Incline Dumbbell Press. Nutrition on point." : "",
                habits: {
                    cold_bath: Math.random() > 0.2,
                    protein: Math.random() > 0.1,
                    veggies: Math.random() > 0.15,
                    water: waterConsumed >= 3000,
                    sunlight: Math.random() > 0.2,
                    creatine: true,
                    workout: !isRestDay,
                    steps: Math.random() > 0.15,
                    stretch: !isRestDay,
                    sleep: sleepHrs >= 7.5,
                    clean_food: Math.random() > 0.15,
                    journal: i === 0 || Math.random() > 0.4
                },
                completedMeals: {
                    breakfast: true,
                    morning_snack: true,
                    lunch: true,
                    evening_snack: true,
                    dinner: true,
                    other: false
                },
                nutrition: [
                    {
                        id: 'nut_' + i + '_1',
                        foodName: 'Oats with Milk & Banana',
                        mealCategory: 'breakfast',
                        quantity: 80,
                        unit: 'g',
                        time: '08:30',
                        calories: 420,
                        protein: 22,
                        carbs: 68,
                        fat: 8,
                        fibre: 7.2,
                        sugar: 18,
                        satFat: 2.1,
                        sodium: 120,
                        vitA: 150,
                        vitB: 'High',
                        vitC: 12,
                        vitD: 80,
                        vitE: 1.2,
                        vitK: 3.5,
                        calcium: 280,
                        iron: 3.8,
                        magnesium: 110,
                        potassium: 540,
                        zinc: 2.8
                    },
                    {
                        id: 'nut_' + i + '_2',
                        foodName: 'Whole Eggs & Whites Boiled',
                        mealCategory: 'breakfast',
                        quantity: 3,
                        unit: 'piece',
                        time: '09:00',
                        calories: 220,
                        protein: 20,
                        carbs: 1.5,
                        fat: 14,
                        fibre: 0,
                        sugar: 1,
                        satFat: 4.5,
                        sodium: 180,
                        vitA: 260,
                        vitB: 'High',
                        vitC: 0,
                        vitD: 82,
                        vitE: 1.0,
                        vitK: 0.3,
                        calcium: 56,
                        iron: 2.2,
                        magnesium: 20,
                        potassium: 190,
                        zinc: 1.8
                    },
                    {
                        id: 'nut_' + i + '_3',
                        foodName: 'Matta Rice with Fish Curry & Thoran',
                        mealCategory: 'lunch',
                        quantity: 200,
                        unit: 'g',
                        time: '13:15',
                        calories: 680,
                        protein: 45,
                        carbs: 85,
                        fat: 16,
                        fibre: 6.5,
                        sugar: 3.2,
                        satFat: 3.8,
                        sodium: 480,
                        vitA: 310,
                        vitB: 'High',
                        vitC: 18,
                        vitD: 180,
                        vitE: 2.4,
                        vitK: 15,
                        calcium: 120,
                        iron: 4.1,
                        magnesium: 95,
                        potassium: 620,
                        zinc: 2.9
                    },
                    {
                        id: 'nut_' + i + '_4',
                        foodName: 'Whey Protein & Almonds',
                        mealCategory: 'evening_snack',
                        quantity: 1,
                        unit: 'scoop',
                        time: '17:30',
                        calories: 280,
                        protein: 30,
                        carbs: 12,
                        fat: 12,
                        fibre: 3.1,
                        sugar: 2.0,
                        satFat: 1.2,
                        sodium: 140,
                        vitA: 0,
                        vitB: 'Med',
                        vitC: 0,
                        vitD: 0,
                        vitE: 6.5,
                        vitK: 0,
                        calcium: 160,
                        iron: 1.5,
                        magnesium: 75,
                        potassium: 280,
                        zinc: 1.4
                    },
                    {
                        id: 'nut_' + i + '_5',
                        foodName: 'Chicken Breast with Chapati & Curd',
                        mealCategory: 'dinner',
                        quantity: 200,
                        unit: 'g',
                        time: '20:45',
                        calories: 740,
                        protein: 56,
                        carbs: 72,
                        fat: 18,
                        fibre: 8.0,
                        sugar: 4.5,
                        satFat: 4.2,
                        sodium: 520,
                        vitA: 180,
                        vitB: 'High',
                        vitC: 6,
                        vitD: 15,
                        vitE: 1.1,
                        vitK: 2.0,
                        calcium: 210,
                        iron: 3.6,
                        magnesium: 85,
                        potassium: 710,
                        zinc: 3.2
                    }
                ]
            };
        }
        this.set(this.KEYS.DAILY_LOGS, dailyLogs);

        // Bi-weekly body measurements over the past 2 months
        const measurements = [
            {
                id: 'meas_0',
                date: Utils.addDays(today, -60),
                weight: 82.0,
                waist: 91.5,
                chest: 99.0,
                shoulders: 114.0,
                armLeft: 33.5,
                armRight: 34.0,
                forearm: 28.0,
                thighs: 59.0,
                calves: 37.0,
                neck: 39.0,
                bodyFat: 22.5,
                notes: 'Starting baseline measurement. Target: drop waist to 78cm and build chest/arms.'
            },
            {
                id: 'meas_1',
                date: Utils.addDays(today, -45),
                weight: 80.2,
                waist: 88.0,
                chest: 100.0,
                shoulders: 115.5,
                armLeft: 34.0,
                armRight: 34.5,
                forearm: 28.5,
                thighs: 58.5,
                calves: 37.0,
                neck: 38.5,
                bodyFat: 20.8,
                notes: 'Week 2 check-in: Waist already down 3.5cm! Energy levels are great.'
            },
            {
                id: 'meas_2',
                date: Utils.addDays(today, -30),
                weight: 78.5,
                waist: 85.5,
                chest: 101.5,
                shoulders: 117.0,
                armLeft: 35.0,
                armRight: 35.2,
                forearm: 29.0,
                thighs: 58.0,
                calves: 37.5,
                neck: 38.0,
                bodyFat: 19.0,
                notes: 'Month 1 Completed. Clear definition in shoulders and upper chest.'
            },
            {
                id: 'meas_3',
                date: Utils.addDays(today, -15),
                weight: 77.0,
                waist: 83.0,
                chest: 102.5,
                shoulders: 118.0,
                armLeft: 35.5,
                armRight: 35.8,
                forearm: 29.2,
                thighs: 58.0,
                calves: 37.5,
                neck: 38.0,
                bodyFat: 17.5,
                notes: 'Week 6: Upper abs starting to show in morning light. Strength increasing.'
            },
            {
                id: 'meas_4',
                date: today,
                weight: 75.5,
                waist: 81.0,
                chest: 104.0,
                shoulders: 119.5,
                armLeft: 36.2,
                armRight: 36.5,
                forearm: 29.8,
                thighs: 58.5,
                calves: 38.0,
                neck: 38.0,
                bodyFat: 16.0,
                notes: 'Month 2 Completed! Lost 10.5cm off waist while adding 4cm to chest and 2.5cm to arms!'
            }
        ];
        this.set(this.KEYS.BODY_MEASUREMENTS, measurements);

        // Past Workouts with Progressive Overload
        const workouts = [
            {
                id: 'w_demo_1',
                date: today,
                split: 'Push',
                workoutName: 'Chest, Shoulders & Triceps Hypertrophy',
                durationMin: 65,
                notes: 'Felt explosive! Increased bench by 2.5kg for 8 clean reps.',
                exercises: [
                    {
                        name: 'Barbell Bench Press',
                        targetSets: 4,
                        sets: [
                            { reps: 10, weight: 75, completed: true },
                            { reps: 8, weight: 82.5, completed: true },
                            { reps: 8, weight: 85, completed: true },
                            { reps: 6, weight: 87.5, completed: true }
                        ]
                    },
                    {
                        name: 'Incline Dumbbell Press',
                        targetSets: 3,
                        sets: [
                            { reps: 10, weight: 30, completed: true },
                            { reps: 10, weight: 32, completed: true },
                            { reps: 8, weight: 34, completed: true }
                        ]
                    },
                    {
                        name: 'Dumbbell Lateral Raise',
                        targetSets: 4,
                        sets: [
                            { reps: 15, weight: 12, completed: true },
                            { reps: 15, weight: 12, completed: true },
                            { reps: 12, weight: 14, completed: true },
                            { reps: 12, weight: 14, completed: true }
                        ]
                    },
                    {
                        name: 'Triceps Pushdown',
                        targetSets: 3,
                        sets: [
                            { reps: 12, weight: 35, completed: true },
                            { reps: 12, weight: 37.5, completed: true },
                            { reps: 10, weight: 40, completed: true }
                        ]
                    }
                ]
            },
            {
                id: 'w_demo_2',
                date: Utils.addDays(today, -1),
                split: 'Pull',
                workoutName: 'Back & Biceps Width & Thickness',
                durationMin: 70,
                notes: 'Lat stretch was insane. Form on weighted pull-ups feeling effortless.',
                exercises: [
                    {
                        name: 'Lat Pulldown',
                        targetSets: 4,
                        sets: [
                            { reps: 12, weight: 65, completed: true },
                            { reps: 10, weight: 72.5, completed: true },
                            { reps: 8, weight: 80, completed: true },
                            { reps: 8, weight: 82.5, completed: true }
                        ]
                    },
                    {
                        name: 'Barbell Row',
                        targetSets: 4,
                        sets: [
                            { reps: 10, weight: 65, completed: true },
                            { reps: 10, weight: 70, completed: true },
                            { reps: 8, weight: 75, completed: true },
                            { reps: 8, weight: 77.5, completed: true }
                        ]
                    },
                    {
                        name: 'Barbell Curls',
                        targetSets: 3,
                        sets: [
                            { reps: 12, weight: 32.5, completed: true },
                            { reps: 10, weight: 35, completed: true },
                            { reps: 8, weight: 37.5, completed: true }
                        ]
                    }
                ]
            },
            {
                id: 'w_demo_3',
                date: Utils.addDays(today, -2),
                split: 'Legs',
                workoutName: 'Quad & Hamstring Power',
                durationMin: 60,
                notes: 'Heavy squats felt locked in. Knee stability is 100%.',
                exercises: [
                    {
                        name: 'Barbell Back Squat',
                        targetSets: 4,
                        sets: [
                            { reps: 10, weight: 90, completed: true },
                            { reps: 8, weight: 105, completed: true },
                            { reps: 8, weight: 110, completed: true },
                            { reps: 6, weight: 115, completed: true }
                        ]
                    },
                    {
                        name: 'Leg Press',
                        targetSets: 3,
                        sets: [
                            { reps: 12, weight: 180, completed: true },
                            { reps: 10, weight: 210, completed: true },
                            { reps: 10, weight: 220, completed: true }
                        ]
                    },
                    {
                        name: 'Leg Curls',
                        targetSets: 3,
                        sets: [
                            { reps: 12, weight: 45, completed: true },
                            { reps: 12, weight: 50, completed: true },
                            { reps: 10, weight: 52.5, completed: true }
                        ]
                    }
                ]
            }
        ];
        this.set(this.KEYS.WORKOUTS, workouts);

        // PRs
        const prs = {
            'Barbell Bench Press': { maxWeight: 87.5, maxRepsAtMax: 6, estimated1RM: 105, date: today },
            'Incline Dumbbell Press': { maxWeight: 34, maxRepsAtMax: 8, estimated1RM: 43, date: today },
            'Barbell Back Squat': { maxWeight: 115, maxRepsAtMax: 6, estimated1RM: 138, date: Utils.addDays(today, -2) },
            'Barbell Row': { maxWeight: 77.5, maxRepsAtMax: 8, estimated1RM: 98, date: Utils.addDays(today, -1) },
            'Lat Pulldown': { maxWeight: 82.5, maxRepsAtMax: 8, estimated1RM: 104, date: Utils.addDays(today, -1) },
            'Barbell Curls': { maxWeight: 37.5, maxRepsAtMax: 8, estimated1RM: 47, date: Utils.addDays(today, -1) }
        };
        this.set(this.KEYS.PRS, prs);

        // Sample SVGs for demo progress photos
        const createSilhouetteSVG = (monthNum, waistCm, chestCm, fill) => {
            return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="520" viewBox="0 0 400 520">
                <defs>
                    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="%23131722"/>
                        <stop offset="100%" stop-color="%230b0e14"/>
                    </linearGradient>
                    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="${fill}"/>
                        <stop offset="100%" stop-color="%2300b4d8"/>
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(%23bg)" rx="16"/>
                <circle cx="200" cy="85" r="42" fill="url(%23glow)" opacity="0.9"/>
                <!-- Neck -->
                <path d="M 185 125 L 215 125 L 218 145 L 182 145 Z" fill="url(%23glow)" opacity="0.9"/>
                <!-- Torso with progressive taper -->
                <path d="M 125 155 Q 200 145 275 155 L ${200 + (chestCm - 80) * 1.0} 220 L ${200 + (waistCm - 60) * 0.9} 310 L 175 310 L ${200 - (waistCm - 60) * 0.9} 310 L ${200 - (chestCm - 80) * 1.0} 220 Z" fill="url(%23glow)" opacity="0.9"/>
                <!-- Legs -->
                <path d="M 165 315 L 155 460 L 180 460 L 195 350 L 205 350 L 220 460 L 245 460 L 235 315 Z" fill="url(%23glow)" opacity="0.85"/>
                <!-- Arms -->
                <path d="M 120 160 L 95 270 L 115 275 L 140 185 Z" fill="url(%23glow)" opacity="0.85"/>
                <path d="M 280 160 L 305 270 L 285 275 L 260 185 Z" fill="url(%23glow)" opacity="0.85"/>
                <!-- Badge text -->
                <rect x="25" y="25" width="130" height="32" rx="6" fill="%231e293b" opacity="0.8"/>
                <text x="35" y="47" fill="%2300e676" font-family="sans-serif" font-weight="bold" font-size="14">MONTH ${monthNum}</text>
                <text x="35" y="490" fill="%2394a3b8" font-family="sans-serif" font-size="13">Waist: ${waistCm}cm | Chest: ${chestCm}cm</text>
            </svg>`;
        };

        const demoPhotos = [
            {
                id: 'photo_demo_0',
                date: Utils.addDays(today, -60),
                month: 0,
                pose: 'Front',
                weight: 82.0,
                notes: 'Starting day 1 physique. High body fat around midsection, soft chest.',
                dataUrl: createSilhouetteSVG(0, 91.5, 99.0, '%2364748b')
            },
            {
                id: 'photo_demo_1',
                date: Utils.addDays(today, -30),
                month: 1,
                pose: 'Front',
                weight: 78.5,
                notes: 'Month 1 check-in. Waist dropped by 6cm, shoulders capping out nicely.',
                dataUrl: createSilhouetteSVG(1, 85.5, 101.5, '%2310b981')
            },
            {
                id: 'photo_demo_2',
                date: today,
                month: 2,
                pose: 'Front',
                weight: 75.5,
                notes: 'Month 2 check-in. Tight waistline, upper abs visible, significant V-taper!',
                dataUrl: createSilhouetteSVG(2, 81.0, 104.0, '%2300e676')
            }
        ];

        await this.clearPhotos();
        for (const p of demoPhotos) {
            await this.savePhoto(p);
        }

        return true;
    }
};

window.StorageManager = StorageManager;
