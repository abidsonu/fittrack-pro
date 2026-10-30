/**
 * FitTrack Pro - Master Application Controller
 * Handles Navigation, Views, Calendar, Six-Month Roadmap, Settings & Reports
 */

const App = {
    currentView: 'dashboard',
    calendarYear: 2026,
    calendarMonth: 9, // 0-indexed, so 9 is October

    async init() {
        console.log('Initializing FitTrack Pro...');
        
        // 1. Initialize Storage & IndexedDB
        await StorageManager.init();

        // 2. Set initial theme
        this.applyTheme();

        // 3. Initialize Sub-Controllers
        OnboardingController.init();
        ReminderManager.init();
        
        // 4. Set current calendar to current month
        const now = new Date();
        this.calendarYear = now.getFullYear();
        this.calendarMonth = now.getMonth();

        // 5. Bind Navigation and Top-level Events
        this.bindEvents();

        // 6. If user already has profile, render all views
        if (StorageManager.hasProfile()) {
            DashboardController.init();
            NutritionController.init();
            WorkoutController.init();
            PhysiqueController.init();
            AnalyticsController.init();
            this.renderMilestonesView();
            this.renderCalendarView();
            this.renderSettingsView();
        }

        // 7. Initialize Lucide icons if available
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }

        console.log('FitTrack Pro successfully initialized!');
    },

    bindEvents() {
        // Main Navigation Links (Desktop Sidebar & Mobile Bottom Nav)
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                if (view) this.switchView(view);
            });
        });

        // Mobile sidebar menu toggle
        const menuToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        // Close sidebar on click outside on mobile
        document.addEventListener('click', (e) => {
            if (sidebar && sidebar.classList.contains('open') && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });

        // Theme toggle button
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Calendar prev/next buttons
        const calPrev = document.getElementById('cal-prev-month');
        const calNext = document.getElementById('cal-next-month');
        if (calPrev) calPrev.addEventListener('click', () => this.changeCalendarMonth(-1));
        if (calNext) calNext.addEventListener('click', () => this.changeCalendarMonth(1));

        // Settings events
        this.bindSettingsEvents();
    },

    /**
     * Switch Active Main View
     */
    switchView(viewName) {
        this.currentView = viewName;

        // Update active class on nav links
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.view === viewName);
        });

        // Show corresponding view section
        document.querySelectorAll('.view-section').forEach(sec => {
            sec.style.display = (sec.id === `view-${viewName}`) ? 'block' : 'none';
        });

        // Trigger view-specific re-render
        if (viewName === 'dashboard') {
            DashboardController.render();
        } else if (viewName === 'nutrition') {
            NutritionController.render();
        } else if (viewName === 'workout') {
            WorkoutController.render();
        } else if (viewName === 'physique') {
            PhysiqueController.render();
        } else if (viewName === 'analytics') {
            AnalyticsController.render();
        } else if (viewName === 'milestones') {
            this.renderMilestonesView();
        } else if (viewName === 'calendar') {
            this.renderCalendarView();
        } else if (viewName === 'settings') {
            this.renderSettingsView();
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Close mobile sidebar if open
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('open');

        // Refresh icons
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    },

    /**
     * Apply Saved Theme (Dark charcoal default)
     */
    applyTheme() {
        const settings = StorageManager.getSettings();
        const theme = settings.theme || 'dark';
        document.documentElement.setAttribute('data-theme', theme);

        const iconEl = document.getElementById('theme-toggle-icon');
        if (iconEl) {
            iconEl.textContent = (theme === 'dark') ? '☀️' : '🌙';
        }
    },

    toggleTheme() {
        const settings = StorageManager.getSettings();
        const newTheme = (settings.theme === 'light') ? 'dark' : 'light';
        settings.theme = newTheme;
        StorageManager.saveSettings(settings);
        this.applyTheme();
        Utils.showToast(`Switched to ${newTheme} mode`, 'info');
    },

    // -------------------------------------------------------------
    // SIX-MONTH ROADMAP VIEW
    // -------------------------------------------------------------
    renderMilestonesView() {
        const container = document.getElementById('milestones-grid-container');
        const badgesContainer = document.getElementById('badges-grid-container');
        const overallBar = document.getElementById('roadmap-overall-bar');
        const overallText = document.getElementById('roadmap-overall-pct');

        if (!container) return;

        const data = MilestoneManager.getMilestonesData();
        const overallPct = MilestoneManager.getOverallProgress();

        if (overallBar) overallBar.style.width = `${overallPct}%`;
        if (overallText) overallText.textContent = `${overallPct}% Complete`;

        let html = '';
        Object.keys(data.months).forEach(mKey => {
            const m = data.months[mKey];
            const pct = MilestoneManager.getMonthProgress(m);

            html += `
                <div class="milestone-month-card ${m.status === 'completed' ? 'card-completed' : ''}">
                    <div class="m-card-header">
                        <div>
                            <span class="m-status-badge m-status-${m.status}">${m.status.replace('_', ' ').toUpperCase()}</span>
                            <h3 class="m-title">${m.title}</h3>
                            <p class="m-subtitle">${m.subtitle}</p>
                        </div>
                        <div class="m-pct-badge">${pct}%</div>
                    </div>

                    <div class="m-progress-bar-wrap">
                        <div class="m-progress-bar-fill" style="width: ${pct}%"></div>
                    </div>

                    <div class="m-objectives-box">
                        <strong>Key Objectives:</strong>
                        <ul>
                            ${m.objectives.map(obj => `<li>${obj}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="m-tasks-checklist">
                        <strong>Action Tasks:</strong>
                        ${m.tasks.map(t => `
                            <label class="m-task-item ${t.completed ? 'task-done' : ''}">
                                <input type="checkbox" ${t.completed ? 'checked' : ''} 
                                    onchange="App.handleToggleMilestoneTask('${mKey}', '${t.id}', this.checked)">
                                <span>${t.text}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Render Badges
        if (badgesContainer) {
            let bHtml = '';
            MilestoneManager.BADGES.forEach(badge => {
                const isUnlocked = data.unlockedBadges.includes(badge.id);
                bHtml += `
                    <div class="badge-card ${isUnlocked ? 'badge-unlocked' : 'badge-locked'}">
                        <div class="badge-icon">${badge.icon}</div>
                        <h4 class="badge-title">${badge.title}</h4>
                        <p class="badge-desc">${badge.desc}</p>
                        <span class="badge-state-tag">${isUnlocked ? '✓ Unlocked' : '🔒 Locked'}</span>
                    </div>
                `;
            });
            badgesContainer.innerHTML = bHtml;
        }
    },

    handleToggleMilestoneTask(monthKey, taskId, isChecked) {
        MilestoneManager.toggleTask(monthKey, taskId);
        Utils.playBeep(isChecked ? 'beep' : 'beep');
        this.renderMilestonesView();
        if (typeof DashboardController !== 'undefined') {
            DashboardController.render();
        }
    },

    // -------------------------------------------------------------
    // WORKOUT & NUTRITION CALENDAR VIEW
    // -------------------------------------------------------------
    changeCalendarMonth(delta) {
        this.calendarMonth += delta;
        if (this.calendarMonth < 0) {
            this.calendarMonth = 11;
            this.calendarYear--;
        } else if (this.calendarMonth > 11) {
            this.calendarMonth = 0;
            this.calendarYear++;
        }
        this.renderCalendarView();
    },

    renderCalendarView() {
        const grid = document.getElementById('calendar-days-grid');
        const monthTitle = document.getElementById('calendar-month-title');
        if (!grid) return;

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        if (monthTitle) {
            monthTitle.textContent = `${monthNames[this.calendarMonth]} ${this.calendarYear}`;
        }

        const firstDay = new Date(this.calendarYear, this.calendarMonth, 1).getDay();
        const daysInMonth = new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate();

        const dailyLogs = StorageManager.getDailyLogs();
        const workouts = StorageManager.getWorkouts();
        const profile = StorageManager.getProfile() || { calorieTarget: 2200 };
        const todayStr = Utils.getTodayDate();

        let html = '';

        // Empty cells for alignment
        for (let i = 0; i < firstDay; i++) {
            html += `<div class="cal-day-cell cal-empty"></div>`;
        }

        // Days of month
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;

            const log = dailyLogs[dateStr];
            const hasNutrition = log && log.nutrition && log.nutrition.length > 0;
            const hasWorkout = workouts.some(w => w.date === dateStr);
            const hasWater = log && log.water >= 3000;

            let cals = 0;
            if (hasNutrition) {
                cals = Math.round(log.nutrition.reduce((s, i) => s + (i.calories || 0), 0));
            }

            html += `
                <div class="cal-day-cell ${isToday ? 'cal-today' : ''} ${hasWorkout ? 'cal-has-workout' : ''}" 
                    onclick="App.openDayFromCalendar('${dateStr}')">
                    <div class="cal-day-num">${d}</div>
                    <div class="cal-indicators">
                        ${hasWorkout ? '<span class="cal-dot cal-dot-workout" title="Workout Logged">🏋️</span>' : ''}
                        ${hasNutrition ? `<span class="cal-dot cal-dot-food" title="${cals} kcal">🥗</span>` : ''}
                        ${hasWater ? '<span class="cal-dot cal-dot-water" title="Hydration Met">💧</span>' : ''}
                    </div>
                    ${hasNutrition ? `<div class="cal-cal-text">${cals} kcal</div>` : ''}
                </div>
            `;
        }

        grid.innerHTML = html;
    },

    openDayFromCalendar(dateStr) {
        // Switch to nutrition view for that date
        NutritionController.setDate(dateStr);
        this.switchView('nutrition');
        Utils.showToast(`Viewing log for ${Utils.formatDate(dateStr)}`, 'info');
    },

    // -------------------------------------------------------------
    // SETTINGS, BACKUP, EXPORT & PRINT REPORT
    // -------------------------------------------------------------
    bindSettingsEvents() {
        // Edit Profile
        const editProfileBtn = document.getElementById('settings-edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                OnboardingController.openOnboarding(true);
            });
        }

        // Macro Target adjustments
        const macroForm = document.getElementById('settings-macro-form');
        if (macroForm) {
            macroForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveMacroSettings();
            });
        }

        // Reminder settings
        const notifBtn = document.getElementById('settings-request-notif-btn');
        if (notifBtn) {
            notifBtn.addEventListener('click', () => {
                ReminderManager.requestPermission();
            });
        }

        const testNotifBtn = document.getElementById('settings-test-notif-btn');
        if (testNotifBtn) {
            testNotifBtn.addEventListener('click', () => {
                ReminderManager.testReminder();
            });
        }

        // Backup JSON download
        const backupBtn = document.getElementById('settings-backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', async () => {
                const data = await StorageManager.exportCompleteBackup();
                const filename = `fittrack_pro_backup_${Utils.getTodayDate()}.json`;
                Utils.downloadJSON(filename, data);
                Utils.showToast('Full application backup downloaded!', 'success');
            });
        }

        // Restore JSON upload
        const restoreInput = document.getElementById('settings-restore-file');
        if (restoreInput) {
            restoreInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (confirm('Restoring will overwrite current data. Do you want to proceed?')) {
                    try {
                        const json = await Utils.readJSONFile(file);
                        await StorageManager.restoreCompleteBackup(json);
                        Utils.showToast('Application restored successfully! Reloading...', 'success', 3000);
                        setTimeout(() => window.location.reload(), 1500);
                    } catch (err) {
                        Utils.showToast('Failed to restore file: ' + err.message, 'error');
                    }
                }
            });
        }

        // Export CSVs
        const expNutBtn = document.getElementById('settings-export-nutrition-csv');
        if (expNutBtn) expNutBtn.addEventListener('click', () => this.exportNutritionCSV());

        const expWorkBtn = document.getElementById('settings-export-workout-csv');
        if (expWorkBtn) expWorkBtn.addEventListener('click', () => this.exportWorkoutsCSV());

        const expMeasBtn = document.getElementById('settings-export-measurements-csv');
        if (expMeasBtn) expMeasBtn.addEventListener('click', () => this.exportMeasurementsCSV());

        // Export PDF / Print Transformation Report
        const printReportBtn = document.getElementById('settings-print-report-btn');
        if (printReportBtn) printReportBtn.addEventListener('click', () => this.generatePrintableReport());

        // Load Realistic 6-Month Demo Data
        const loadDemoBtn = document.getElementById('settings-load-demo-btn');
        if (loadDemoBtn) {
            loadDemoBtn.addEventListener('click', async () => {
                if (confirm('Load realistic 6-month sample transformation dataset? This will populate 60 days of nutrition logs, workouts, PRs, waist changes from 91cm to 81cm, and milestone photos!')) {
                    await StorageManager.loadDemoData();
                    Utils.playBeep('success');
                    Utils.showToast('Realistic 6-month transformation data loaded! Reloading...', 'success', 3000);
                    setTimeout(() => window.location.reload(), 1200);
                }
            });
        }

        // Reset All Data
        const resetBtn = document.getElementById('settings-reset-data-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                if (confirm('DANGER: This will permanently wipe all logs, photos, and profile settings. Are you absolutely sure?')) {
                    await StorageManager.resetAllData();
                    Utils.showToast('All application data reset. Reloading...', 'warning', 3000);
                    setTimeout(() => window.location.reload(), 1200);
                }
            });
        }
    },

    renderSettingsView() {
        const p = StorageManager.getProfile();
        if (!p) return;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
        };

        setVal('settings-cal-target', p.calorieTarget || 2200);
        setVal('settings-prot-target', p.proteinTarget || 150);
        setVal('settings-carb-target', p.carbTarget || 250);
        setVal('settings-fat-target', p.fatTarget || 65);
        setVal('settings-water-target', p.waterIntake || 3500);

        // Meal times
        const s = StorageManager.getSettings();
        if (s.mealTimes) {
            setVal('settings-breakfast-time', s.mealTimes.breakfast || '08:30');
            setVal('settings-lunch-time', s.mealTimes.lunch || '13:00');
            setVal('settings-snack-time', s.mealTimes.snack || '17:30');
            setVal('settings-dinner-time', s.mealTimes.dinner || '20:30');
        }

        // Notification permission status pill
        const statusEl = document.getElementById('settings-notif-status');
        if (statusEl) {
            const perm = ReminderManager.getPermissionStatus();
            statusEl.textContent = `Status: ${perm.toUpperCase()}`;
            statusEl.className = `badge ${perm === 'granted' ? 'badge-success' : 'badge-warning'}`;
        }
    },

    handleSaveMacroSettings() {
        const p = StorageManager.getProfile();
        if (!p) return;

        p.calorieTarget = parseInt(document.getElementById('settings-cal-target').value) || 2200;
        p.proteinTarget = parseInt(document.getElementById('settings-prot-target').value) || 150;
        p.carbTarget = parseInt(document.getElementById('settings-carb-target').value) || 250;
        p.fatTarget = parseInt(document.getElementById('settings-fat-target').value) || 65;
        p.waterIntake = parseInt(document.getElementById('settings-water-target').value) || 3500;

        StorageManager.saveProfile(p);

        // Meal times save
        const s = StorageManager.getSettings();
        s.mealTimes = {
            breakfast: document.getElementById('settings-breakfast-time').value,
            lunch: document.getElementById('settings-lunch-time').value,
            snack: document.getElementById('settings-snack-time').value,
            dinner: document.getElementById('settings-dinner-time').value
        };
        StorageManager.saveSettings(s);

        Utils.playBeep('beep');
        Utils.showToast('Target macros and meal reminders updated!', 'success');

        DashboardController.render();
        NutritionController.render();
    },

    exportNutritionCSV() {
        const dailyLogs = StorageManager.getDailyLogs();
        const headers = ['Date', 'Meal', 'Food Name', 'Quantity', 'Unit', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Fibre (g)'];
        const rows = [];

        Object.keys(dailyLogs).sort().forEach(d => {
            const log = dailyLogs[d];
            if (log.nutrition) {
                log.nutrition.forEach(item => {
                    rows.push([
                        d,
                        item.mealCategory,
                        item.foodName,
                        item.quantity,
                        item.unit,
                        item.calories,
                        item.protein,
                        item.carbs,
                        item.fat,
                        item.fibre || 0
                    ]);
                });
            }
        });

        Utils.downloadCSV(`fittrack_nutrition_${Utils.getTodayDate()}.csv`, headers, rows);
        Utils.showToast('Nutrition history exported to CSV', 'success');
    },

    exportWorkoutsCSV() {
        const workouts = StorageManager.getWorkouts();
        const headers = ['Date', 'Split', 'Workout Name', 'Exercise', 'Set #', 'Weight (kg)', 'Reps', 'Completed'];
        const rows = [];

        workouts.forEach(w => {
            if (w.exercises) {
                w.exercises.forEach(ex => {
                    if (ex.sets) {
                        ex.sets.forEach((s, idx) => {
                            rows.push([
                                w.date,
                                w.split,
                                w.workoutName,
                                ex.name,
                                idx + 1,
                                s.weight,
                                s.reps,
                                s.completed ? 'YES' : 'NO'
                            ]);
                        });
                    }
                });
            }
        });

        Utils.downloadCSV(`fittrack_workouts_${Utils.getTodayDate()}.csv`, headers, rows);
        Utils.showToast('Workout history exported to CSV', 'success');
    },

    exportMeasurementsCSV() {
        const list = StorageManager.getBodyMeasurements();
        const headers = ['Date', 'Weight (kg)', 'Waist (cm)', 'Chest (cm)', 'Shoulders (cm)', 'Right Arm (cm)', 'Thighs (cm)', 'Calves (cm)', 'Body Fat (%)', 'Notes'];
        const rows = list.map(m => [
            m.date,
            m.weight || '',
            m.waist || '',
            m.chest || '',
            m.shoulders || '',
            m.armRight || '',
            m.thighs || '',
            m.calves || '',
            m.bodyFat || '',
            m.notes || ''
        ]);

        Utils.downloadCSV(`fittrack_measurements_${Utils.getTodayDate()}.csv`, headers, rows);
        Utils.showToast('Body measurements exported to CSV', 'success');
    },

    /**
     * Generate Comprehensive Printable / PDF Transformation Report
     */
    generatePrintableReport() {
        const p = StorageManager.getProfile() || { name: 'Athlete', currentWeight: 75, startingWeight: 82, targetWeight: 72 };
        const measurements = StorageManager.getBodyMeasurements();
        const prs = StorageManager.getPRs();
        const workouts = StorageManager.getWorkouts();
        const overallRoadmapPct = MilestoneManager.getOverallProgress();

        const firstMeas = measurements.length > 0 ? measurements[0] : {};
        const lastMeas = measurements.length > 0 ? measurements[measurements.length - 1] : {};

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            Utils.showToast('Popup blocker prevented opening report window. Please allow popups.', 'warning');
            return;
        }

        const reportHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>FitTrack Pro - Transformation Report - ${p.name}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; padding: 40px; margin: 0; }
                    .header { border-bottom: 3px solid #00e676; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
                    .brand { font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
                    .brand span { color: #10b981; }
                    .tagline { color: #64748b; font-size: 13px; margin-top: 4px; }
                    .report-date { font-size: 14px; color: #64748b; }
                    .section-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 30px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
                    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
                    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
                    .card-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; }
                    .card-val { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 5px; }
                    .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    .table th, .table td { border: 1px solid #e2e8f0; padding: 8px 12px; font-size: 13px; text-align: left; }
                    .table th { background: #f1f5f9; font-weight: 600; color: #334155; }
                    .highlight { color: #10b981; font-weight: 700; }
                    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
                    @media print {
                        body { padding: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="margin-bottom: 20px; text-align: right;">
                    <button onclick="window.print()" style="background: #10b981; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                        🖨️ Print / Save as PDF
                    </button>
                </div>

                <div class="header">
                    <div>
                        <div class="brand">FITTRACK <span>PRO</span></div>
                        <div class="tagline">Official 6-Month Personal Physique Transformation Report</div>
                    </div>
                    <div class="report-date">
                        Generated on: <strong>${Utils.getTodayDate()}</strong>
                    </div>
                </div>

                <div class="section-title">Athlete Profile & Goals</div>
                <div class="grid">
                    <div class="card"><div class="card-label">Athlete Name</div><div class="card-val">${p.name}</div></div>
                    <div class="card"><div class="card-label">Transformation Goal</div><div class="card-val" style="font-size: 16px;">${p.primaryGoal?.replace('_', ' ').toUpperCase()}</div></div>
                    <div class="card"><div class="card-label">Target Physique</div><div class="card-val" style="font-size: 14px;">${p.desiredPhysique || 'Aesthetic V-Taper'}</div></div>
                    <div class="card"><div class="card-label">Program Progress</div><div class="card-val highlight">${overallRoadmapPct}%</div></div>
                </div>

                <div class="section-title">Body Composition Progress (Start vs Current)</div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Starting Baseline</th>
                            <th>Current Status</th>
                            <th>Net Change</th>
                            <th>Target</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Body Weight</strong></td>
                            <td>${firstMeas.weight || p.startingWeight || '-'} kg</td>
                            <td>${lastMeas.weight || p.currentWeight || '-'} kg</td>
                            <td class="highlight">${Utils.round((lastMeas.weight || 0) - (firstMeas.weight || 0), 1)} kg</td>
                            <td>${p.targetWeight} kg</td>
                        </tr>
                        <tr>
                            <td><strong>Waist Circumference</strong></td>
                            <td>${firstMeas.waist || '-'} cm</td>
                            <td>${lastMeas.waist || '-'} cm</td>
                            <td class="highlight">${Utils.round((lastMeas.waist || 0) - (firstMeas.waist || 0), 1)} cm</td>
                            <td>${p.targetWaist} cm</td>
                        </tr>
                        <tr>
                            <td><strong>Chest Circumference</strong></td>
                            <td>${firstMeas.chest || '-'} cm</td>
                            <td>${lastMeas.chest || '-'} cm</td>
                            <td class="highlight">+${Utils.round((lastMeas.chest || 0) - (firstMeas.chest || 0), 1)} cm</td>
                            <td>Development</td>
                        </tr>
                        <tr>
                            <td><strong>Right Arm</strong></td>
                            <td>${firstMeas.armRight || '-'} cm</td>
                            <td>${lastMeas.armRight || '-'} cm</td>
                            <td class="highlight">+${Utils.round((lastMeas.armRight || 0) - (firstMeas.armRight || 0), 1)} cm</td>
                            <td>Peak Hypertrophy</td>
                        </tr>
                    </tbody>
                </table>

                <div class="section-title">Personal Records & Compound Strength Gains</div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Exercise</th>
                            <th>Max Weight Lifted</th>
                            <th>Reps at Max</th>
                            <th>Estimated 1-Rep Max</th>
                            <th>Date Achieved</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.keys(prs).length === 0 ? '<tr><td colspan="5">No PRs recorded yet.</td></tr>' : 
                            Object.keys(prs).map(k => `
                                <tr>
                                    <td><strong>${k}</strong></td>
                                    <td>${prs[k].maxWeight} kg</td>
                                    <td>${prs[k].maxRepsAtMax} reps</td>
                                    <td class="highlight">${prs[k].estimated1RM} kg</td>
                                    <td>${prs[k].date}</td>
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>

                <div class="footer">
                    FitTrack Pro &bull; Personal Fitness & Physique Transformation Management System &bull; Private & Secure Local Storage
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(reportHtml);
        printWindow.document.close();
    }
};

// Bootstrap application on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;
