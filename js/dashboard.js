/**
 * FitTrack Pro - Main Dashboard Controller
 * Circular Progress Indicators, Transformation Summary, Daily Habits & Quick Actions
 */

const DashboardController = {
    currentDate: null,
    activeHabitCategory: 'all',

    // Core Discipline & Transformation Habits
    DEFAULT_HABITS: [
        {
            key: 'cold_bath',
            label: 'Cold Bath / Cold Shower',
            sub: '2–3 min cold exposure for dopamine reset, CNS stimulation & inflammation control',
            icon: '🧊',
            category: 'morning'
        },
        {
            key: 'protein',
            label: 'Eat Target Protein (2g+/kg)',
            sub: 'Reach daily target for muscle protein synthesis & lean mass retention',
            icon: '🥩',
            category: 'nutrition'
        },
        {
            key: 'veggies',
            label: 'Fresh Vegetables & Greens',
            sub: 'High micronutrient density, dietary fiber, potassium & gut microbiome health',
            icon: '🥦',
            category: 'nutrition'
        },
        {
            key: 'water',
            label: 'Drink 3.5L–4L Pure Water',
            sub: 'Maintain cellular hydration, muscle fullness and metabolic waste flush',
            icon: '💧',
            category: 'nutrition'
        },
        {
            key: 'sunlight',
            label: '10–15 Min Morning Sunlight',
            sub: 'Circadian rhythm alignment, cortisol modulation & natural Vitamin D synthesis',
            icon: '☀️',
            category: 'morning'
        },
        {
            key: 'creatine',
            label: 'Creatine Monohydrate (5g)',
            sub: 'ATP phosphocreatine saturation for muscular power & strength output',
            icon: '💊',
            category: 'nutrition'
        },
        {
            key: 'workout',
            label: 'Complete Daily Workout',
            sub: 'High-intensity resistance training with progressive overload or active rest',
            icon: '🏋️',
            category: 'training'
        },
        {
            key: 'steps',
            label: '8,000–10,000 Daily Steps',
            sub: 'Non-Exercise Activity Thermogenesis (NEAT) for lean conditioning',
            icon: '👟',
            category: 'training'
        },
        {
            key: 'stretch',
            label: 'Mobility & Stretching Routine',
            sub: '10 min hip, hamstring & shoulder mobility to prevent injury and speed recovery',
            icon: '🧘',
            category: 'training'
        },
        {
            key: 'sleep',
            label: '7–8 Hours Deep Sleep',
            sub: 'Anabolic repair, growth hormone release, testosterone and CNS restoration',
            icon: '🌙',
            category: 'training'
        },
        {
            key: 'clean_food',
            label: 'Zero Junk Food / No Added Sugar',
            sub: 'Eliminate empty processed calories, stabilize insulin and mental clarity',
            icon: '🚫',
            category: 'nutrition'
        },
        {
            key: 'journal',
            label: 'Fitness Journal & Mindset Review',
            sub: 'Track mental focus, gym performance, mind-muscle connection and gratitude',
            icon: '📝',
            category: 'morning'
        }
    ],

    MOTIVATIONAL_QUOTES: [
        { quote: "The last three or four reps is what makes the muscle grow. This area of pain divides a champion from someone who is not a champion.", author: "Arnold Schwarzenegger" },
        { quote: "There are no shortcuts. It takes time to build a better, stronger version of your physique.", author: "Ronnie Coleman" },
        { quote: "Discipline is doing what you hate to do, but nonetheless doing it like you love it.", author: "Mike Tyson" },
        { quote: "Continuity and consistency are the secrets. Do what must be done, every single day.", author: "Frank Zane" },
        { quote: "Success isn't always about greatness. It's about consistency. Consistent hard work leads to success.", author: "Dwayne Johnson" },
        { quote: "If you want something you've never had, you must be willing to do something you've never done.", author: "Thomas Jefferson" }
    ],

    init() {
        this.currentDate = Utils.getTodayDate();
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        // Quick water buttons
        document.querySelectorAll('.btn-quick-water').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseInt(e.currentTarget.dataset.amount) || 250;
                this.addWater(amount);
            });
        });

        // Quick weight update modal
        const logWeightForm = document.getElementById('quick-weight-form');
        if (logWeightForm) {
            logWeightForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleQuickWeightSave();
            });
        }

        // Daily Journal save
        const journalInput = document.getElementById('dash-journal-input');
        if (journalInput) {
            journalInput.addEventListener('change', (e) => {
                const dayLog = StorageManager.getDayLog(this.currentDate);
                dayLog.journal = e.target.value;
                StorageManager.saveDayLog(this.currentDate, dayLog);
                Utils.showToast('Journal notes saved', 'info');
            });
        }

        // Custom Habit Add Form
        const habitForm = document.getElementById('add-custom-habit-form');
        if (habitForm) {
            habitForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddCustomHabit();
            });
        }

        // Habit Category Filters
        document.querySelectorAll('.btn-habit-cat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cat = e.currentTarget.dataset.cat;
                this.setHabitCategory(cat);
            });
        });

        // Sleep duration input
        const sleepInput = document.getElementById('dash-sleep-hours');
        if (sleepInput) {
            sleepInput.addEventListener('change', (e) => {
                const dayLog = StorageManager.getDayLog(this.currentDate);
                if (!dayLog.sleep) dayLog.sleep = { hours: 0, quality: 'good' };
                dayLog.sleep.hours = parseFloat(e.target.value) || 0;
                StorageManager.saveDayLog(this.currentDate, dayLog);
                this.render();
            });
        }
    },

    render() {
        const profile = StorageManager.getProfile() || {
            name: 'Athlete',
            startingWeight: 80,
            currentWeight: 75,
            targetWeight: 72,
            calorieTarget: 2200,
            proteinTarget: 150,
            carbTarget: 250,
            fatTarget: 60,
            waterIntake: 3500,
            startDate: Utils.addDays(Utils.getTodayDate(), -30)
        };

        const dayLog = StorageManager.getDayLog(this.currentDate);

        // 1. Calculate Nutritional Totals for today
        const nutTotals = NutritionController ? NutritionController.calculateDayTotals(dayLog.nutrition) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

        // 2. Calculate Workout Completion for today
        const workouts = StorageManager.getWorkouts();
        const todayWorkout = workouts.find(w => w.date === this.currentDate);
        let workoutPct = 0;
        if (todayWorkout && todayWorkout.exercises && todayWorkout.exercises.length > 0) {
            let totalSets = 0;
            let doneSets = 0;
            todayWorkout.exercises.forEach(ex => {
                if (ex.sets) {
                    totalSets += ex.sets.length;
                    doneSets += ex.sets.filter(s => s.completed).length;
                }
            });
            workoutPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;
        }

        // 3. Render Top Transformation Banner
        this.renderTransformationSummary(profile, dayLog);

        // 4. Render Today's Overview Metrics & Circular Rings
        this.renderOverviewMetrics(nutTotals, workoutPct, dayLog, profile);

        // 5. Render Habits Checklist
        this.renderHabits(dayLog);

        // 6. Render Streak & Daily Motivational Quote
        this.renderStreakAndQuote();
    },

    /**
     * Render Transformation Summary Card
     */
    renderTransformationSummary(profile, dayLog) {
        const startW = profile.startingWeight || profile.currentWeight || 80;
        const targetW = profile.targetWeight || 72;
        const currentW = dayLog.weight || profile.currentWeight || startW;

        const totalDiff = Utils.round(currentW - startW, 1);
        const sign = totalDiff > 0 ? '+' : '';

        // Calculate days completed (Program is 180 days = 6 months)
        const startDate = profile.startDate || Utils.getTodayDate();
        const daysElapsed = Math.max(1, Utils.daysBetween(startDate, this.currentDate) + 1);
        const daysTotal = 180;
        const daysPct = Math.min(Math.round((daysElapsed / daysTotal) * 100), 100);

        // Milestone determine
        const monthNum = Math.min(6, Math.max(1, Math.ceil(daysElapsed / 30)));
        const milestoneNames = [
            'Month 1 – Foundation',
            'Month 2 – Consistency & Overload',
            'Month 3 – Progress Calibration',
            'Month 4 – Hypertrophy & Volume',
            'Month 5 – Refinement & Conditioning',
            'Month 6 – Transformation Finale'
        ];
        const currentMilestone = milestoneNames[monthNum - 1];

        // Overall progress percentage based on roadmap
        const overallRoadmapPct = MilestoneManager ? MilestoneManager.getOverallProgress() : daysPct;

        const setText = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };

        setText('dash-start-weight', `${startW} kg`);
        setText('dash-current-weight', `${currentW} kg`);
        setText('dash-target-weight', `${targetW} kg`);
        
        const deltaEl = document.getElementById('dash-weight-change');
        if (deltaEl) {
            deltaEl.textContent = `${sign}${totalDiff} kg`;
            deltaEl.className = totalDiff <= 0 ? 'text-neon font-weight-bold' : 'text-amber font-weight-bold';
        }

        setText('dash-days-completed', `Day ${daysElapsed} of ${daysTotal}`);
        setText('dash-current-milestone', currentMilestone);
        setText('dash-overall-pct', `${overallRoadmapPct}%`);

        const progBar = document.getElementById('dash-transformation-bar');
        if (progBar) progBar.style.width = `${overallRoadmapPct}%`;
    },

    /**
     * Render Today's Overview Numbers and Circular Rings
     */
    renderOverviewMetrics(nutTotals, workoutPct, dayLog, profile) {
        const calTarget = profile.calorieTarget || 2200;
        const calConsumed = nutTotals.calories;
        const calRem = calTarget - calConsumed;

        const protTarget = profile.proteinTarget || 150;
        const protConsumed = nutTotals.protein;
        const protRem = Utils.round(protTarget - protConsumed, 1);

        const carbTarget = profile.carbTarget || 250;
        const carbConsumed = nutTotals.carbs;

        const fatTarget = profile.fatTarget || 65;
        const fatConsumed = nutTotals.fat;

        const waterTarget = profile.waterIntake || 3500;
        const waterConsumed = dayLog.water || 0;

        const sleepHours = dayLog.sleep ? dayLog.sleep.hours : 0;

        // Populate Text
        const setText = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };

        setText('ring-cal-val', calConsumed);
        setText('ring-cal-rem', calRem >= 0 ? `${calRem} left` : `+${Math.abs(calRem)} over`);

        setText('ring-prot-val', `${protConsumed}g`);
        setText('ring-prot-rem', protRem > 0 ? `${protRem}g left` : 'Met 🔥');

        setText('ring-carb-val', `${carbConsumed}g`);
        setText('ring-carb-target', `/ ${carbTarget}g`);

        setText('ring-fat-val', `${fatConsumed}g`);
        setText('ring-fat-target', `/ ${fatTarget}g`);

        setText('ring-water-val', `${Utils.round(waterConsumed / 1000, 2)}L`);
        setText('ring-water-target', `/ ${Utils.round(waterTarget / 1000, 1)}L`);

        setText('ring-workout-val', `${workoutPct}%`);

        // Sleep input sync
        const sleepInput = document.getElementById('dash-sleep-hours');
        if (sleepInput) sleepInput.value = sleepHours || '';

        // Update Circular Progress SVG rings
        this.updateSvgRing('svg-ring-cal', calConsumed, calTarget);
        this.updateSvgRing('svg-ring-prot', protConsumed, protTarget);
        this.updateSvgRing('svg-ring-carb', carbConsumed, carbTarget);
        this.updateSvgRing('svg-ring-fat', fatConsumed, fatTarget);
        this.updateSvgRing('svg-ring-water', waterConsumed, waterTarget);
        this.updateSvgRing('svg-ring-workout', workoutPct, 100);

        // Journal sync
        const journalInput = document.getElementById('dash-journal-input');
        if (journalInput) journalInput.value = dayLog.journal || '';
    },

    /**
     * Update Circular SVG Stroke Dashoffset
     */
    updateSvgRing(elementId, current, total) {
        const circle = document.getElementById(elementId);
        if (!circle) return;

        const radius = circle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;

        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        const ratio = total > 0 ? Math.min(current / total, 1.0) : 0;
        const offset = circumference - (ratio * circumference);
        circle.style.strokeDashoffset = offset;
    },

    /**
     * Quick Water Increment
     */
    addWater(ml) {
        const dayLog = StorageManager.getDayLog(this.currentDate);
        dayLog.water = (dayLog.water || 0) + ml;
        StorageManager.saveDayLog(this.currentDate, dayLog);
        
        Utils.playBeep('beep');
        Utils.showToast(`Logged +${ml}ml water! Total: ${dayLog.water}ml`, 'info');

        // Check hydration badge
        if (dayLog.water >= 3500) {
            MilestoneManager.awardBadge('hydration_hero');
        }

        this.render();
    },

    /**
     * Quick Weight Check-in
     */
    openQuickWeightModal() {
        const modal = document.getElementById('quick-weight-modal');
        const input = document.getElementById('modal-weight-input');
        const dayLog = StorageManager.getDayLog(this.currentDate);
        if (input && dayLog.weight) input.value = dayLog.weight;
        if (modal) modal.classList.add('active');
    },

    closeQuickWeightModal() {
        const modal = document.getElementById('quick-weight-modal');
        if (modal) modal.classList.remove('active');
    },

    handleQuickWeightSave() {
        const input = document.getElementById('modal-weight-input');
        const weight = parseFloat(input.value);
        if (!weight || weight <= 0) {
            Utils.showToast('Please enter a valid weight in kg', 'warning');
            return;
        }

        const dayLog = StorageManager.getDayLog(this.currentDate);
        dayLog.weight = weight;
        StorageManager.saveDayLog(this.currentDate, dayLog);

        // Also add or update to body measurements
        StorageManager.saveBodyMeasurement({
            date: this.currentDate,
            weight: weight
        });

        // Update profile current weight
        const profile = StorageManager.getProfile();
        if (profile) {
            profile.currentWeight = weight;
            StorageManager.saveProfile(profile);
        }

        Utils.playBeep('beep');
        Utils.showToast(`Logged weight: ${weight} kg`, 'success');
        this.closeQuickWeightModal();
        this.render();
    },

    /**
     * Render Comprehensive Daily Habits Protocol Hub
     */
    renderHabits(dayLog) {
        const container = document.getElementById('dash-habits-checklist');
        if (!container) return;

        const customHabits = StorageManager.getCustomHabits();
        const allHabits = [...this.DEFAULT_HABITS, ...customHabits];
        const dayHabits = dayLog.habits || {};

        // Calculate Global Completion across all active habits
        const totalCount = allHabits.length;
        const completedCount = allHabits.filter(h => !!dayHabits[h.key || h.id]).length;
        const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        // Update Header Stats
        const countDisplay = document.getElementById('habits-score-text');
        const pctDisplay = document.getElementById('habits-pct-text');
        const progressBar = document.getElementById('habits-progress-bar');
        const badgeEl = document.getElementById('habits-discipline-badge');

        if (countDisplay) countDisplay.textContent = `${completedCount} of ${totalCount} Completed`;
        if (pctDisplay) pctDisplay.textContent = `${completionPct}%`;
        if (progressBar) {
            progressBar.style.width = `${completionPct}%`;
            progressBar.style.backgroundColor = completionPct === 100 ? '#00e676' : (completionPct >= 70 ? '#38bdf8' : '#f59e0b');
        }

        if (badgeEl) {
            if (completionPct === 100) {
                badgeEl.textContent = '🔥 100% DISCIPLINE CHAMPION';
                badgeEl.className = 'habit-discipline-badge badge-elite';
            } else if (completionPct >= 75) {
                badgeEl.textContent = '⚡ ON FIRE (HYPER-FOCUSED)';
                badgeEl.className = 'habit-discipline-badge badge-high';
            } else if (completionPct >= 50) {
                badgeEl.textContent = '💪 BUILDING MOMENTUM';
                badgeEl.className = 'habit-discipline-badge badge-mid';
            } else {
                badgeEl.textContent = '⏳ EXECUTE PROTOCOL';
                badgeEl.className = 'habit-discipline-badge badge-low';
            }
        }

        // Filter habits by category
        let visibleHabits = allHabits;
        if (this.activeHabitCategory && this.activeHabitCategory !== 'all') {
            visibleHabits = allHabits.filter(h => h.category === this.activeHabitCategory);
        }

        // Update Category Pills Active State
        document.querySelectorAll('.btn-habit-cat').forEach(b => {
            b.classList.toggle('active', b.dataset.cat === this.activeHabitCategory);
        });

        // Render Habit Cards
        let html = '';
        visibleHabits.forEach(h => {
            const habitKey = h.key || h.id;
            const checked = !!dayHabits[habitKey];
            const isCustom = !!h.id && !h.key;

            html += `
                <div class="habit-card-item ${checked ? 'habit-checked' : ''}" data-habit="${habitKey}">
                    <label class="habit-card-label">
                        <input type="checkbox" class="habit-checkbox-custom" ${checked ? 'checked' : ''} 
                            onchange="DashboardController.toggleHabit('${habitKey}', this.checked)">
                        <div class="habit-checkbox-indicator">
                            <span class="chk-mark">✓</span>
                        </div>
                        <div class="habit-icon-bubble">${h.icon || '⚡'}</div>
                        <div class="habit-card-content">
                            <div class="habit-card-header-line">
                                <span class="habit-card-title">${h.label}</span>
                                <span class="habit-tag-pill">${(h.category || 'Discipline').toUpperCase()}</span>
                            </div>
                            <p class="habit-card-sub">${h.sub || 'Custom physical & mental transformation habit'}</p>
                        </div>
                    </label>
                    ${isCustom ? `
                        <button class="btn-delete-habit" onclick="DashboardController.deleteCustomHabit('${h.id}')" title="Delete custom habit">
                            &times;
                        </button>
                    ` : ''}
                </div>
            `;
        });

        container.innerHTML = html;
    },

    setHabitCategory(category) {
        this.activeHabitCategory = category;
        const dayLog = StorageManager.getDayLog(this.currentDate);
        this.renderHabits(dayLog);
    },

    toggleHabit(key, isChecked) {
        const dayLog = StorageManager.getDayLog(this.currentDate);
        if (!dayLog.habits) dayLog.habits = {};
        dayLog.habits[key] = isChecked;
        StorageManager.saveDayLog(this.currentDate, dayLog);

        if (isChecked) {
            Utils.playBeep('beep');
        }

        this.renderHabits(dayLog);

        // Check if all habits completed
        const customHabits = StorageManager.getCustomHabits();
        const allHabits = [...this.DEFAULT_HABITS, ...customHabits];
        const completedCount = allHabits.filter(h => !!dayLog.habits[h.key || h.id]).length;
        if (completedCount === allHabits.length && allHabits.length > 0) {
            Utils.playBeep('success');
            Utils.showToast('🏆 100% Daily Habits Crushed! Maximum Discipline Achieved!', 'success', 5000);
            MilestoneManager.awardBadge('streak_7');
        }
    },

    handleAddCustomHabit() {
        const input = document.getElementById('new-habit-label');
        const iconInput = document.getElementById('new-habit-icon');
        const catInput = document.getElementById('new-habit-cat');
        const descInput = document.getElementById('new-habit-desc');

        const label = input ? input.value.trim() : '';
        const icon = iconInput ? (iconInput.value.trim() || '⚡') : '⚡';
        const category = catInput ? catInput.value : 'routine';
        const sub = descInput ? (descInput.value.trim() || 'Personal transformation discipline habit') : 'Personal transformation discipline habit';

        if (!label) {
            Utils.showToast('Please enter a habit title', 'warning');
            return;
        }

        const newHabit = {
            id: 'custom_h_' + Utils.generateId(),
            label: label,
            icon: icon,
            category: category,
            sub: sub
        };

        StorageManager.saveCustomHabit(newHabit);
        Utils.playBeep('beep');
        Utils.showToast(`Added habit "${label}" to your daily protocol!`, 'success');

        if (input) input.value = '';
        if (descInput) descInput.value = '';

        const dayLog = StorageManager.getDayLog(this.currentDate);
        this.renderHabits(dayLog);
    },

    deleteCustomHabit(id) {
        if (confirm('Remove this custom habit from your daily checklist?')) {
            StorageManager.deleteCustomHabit(id);
            Utils.showToast('Custom habit removed', 'info');
            const dayLog = StorageManager.getDayLog(this.currentDate);
            this.renderHabits(dayLog);
        }
    },

    /**
     * Render Daily Streak & Motivational Quote
     */
    renderStreakAndQuote() {
        // Calculate consecutive logged days
        const dailyLogs = StorageManager.getDailyLogs();
        const dates = Object.keys(dailyLogs).sort();
        let streak = 0;
        let d = Utils.getTodayDate();

        while (true) {
            const log = dailyLogs[d];
            if (log && ((log.nutrition && log.nutrition.length > 0) || log.water > 0 || log.weight)) {
                streak++;
                d = Utils.addDays(d, -1);
            } else {
                break;
            }
        }

        const streakEl = document.getElementById('dash-streak-count');
        if (streakEl) streakEl.textContent = `${streak} Days`;

        if (streak >= 7) MilestoneManager.awardBadge('streak_7');
        if (streak >= 30) MilestoneManager.awardBadge('streak_30');

        // Rotate quote based on day of year
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
        const quoteObj = this.MOTIVATIONAL_QUOTES[dayOfYear % this.MOTIVATIONAL_QUOTES.length];

        const quoteText = document.getElementById('dash-quote-text');
        const quoteAuthor = document.getElementById('dash-quote-author');
        if (quoteText) quoteText.textContent = `"${quoteObj.quote}"`;
        if (quoteAuthor) quoteAuthor.textContent = `— ${quoteObj.author}`;
    }
};

window.DashboardController = DashboardController;
