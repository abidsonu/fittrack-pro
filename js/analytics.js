/**
 * FitTrack Pro - Analytics, Performance Summaries & 8 Chart.js Visualizations
 */

const AnalyticsController = {
    activeRangeDays: 30,
    charts: {},

    init() {
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document.querySelectorAll('.btn-analytics-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const days = e.currentTarget.dataset.range;
                this.setTimeRange(days, e.currentTarget);
            });
        });

        const customRangeApply = document.getElementById('analytics-custom-apply');
        if (customRangeApply) {
            customRangeApply.addEventListener('click', () => {
                this.applyCustomRange();
            });
        }
    },

    setTimeRange(days, buttonEl) {
        document.querySelectorAll('.btn-analytics-filter').forEach(b => b.classList.remove('active'));
        if (buttonEl) buttonEl.classList.add('active');

        if (days === 'custom') {
            const wrap = document.getElementById('analytics-custom-date-wrap');
            if (wrap) wrap.style.display = 'flex';
            return;
        } else {
            const wrap = document.getElementById('analytics-custom-date-wrap');
            if (wrap) wrap.style.display = 'none';
        }

        this.activeRangeDays = parseInt(days);
        this.render();
    },

    applyCustomRange() {
        const startInput = document.getElementById('analytics-start-date');
        const endInput = document.getElementById('analytics-end-date');

        if (!startInput.value || !endInput.value) {
            Utils.showToast('Please select both start and end dates', 'warning');
            return;
        }

        const diff = Utils.daysBetween(startInput.value, endInput.value);
        if (diff < 1) {
            Utils.showToast('End date must be after start date', 'warning');
            return;
        }

        this.activeRangeDays = diff;
        this.render(startInput.value, endInput.value);
    },

    render(customStartDate = null, customEndDate = null) {
        const today = Utils.getTodayDate();
        let startDate = customStartDate || Utils.addDays(today, -this.activeRangeDays);
        let endDate = customEndDate || today;

        // Gather all date keys in range
        const dateList = [];
        let curr = startDate;
        while (curr <= endDate) {
            dateList.push(curr);
            curr = Utils.addDays(curr, 1);
        }

        const dailyLogs = StorageManager.getDailyLogs();
        const profile = StorageManager.getProfile() || { calorieTarget: 2200, proteinTarget: 150, targetWeight: 72 };
        const workouts = StorageManager.getWorkouts();
        const measurements = StorageManager.getBodyMeasurements();

        // 1. Calculate Summary Stats
        this.renderSummaryStats(dateList, dailyLogs, workouts, measurements, profile);

        // 2. Render 8 Charts
        this.renderWeightChart(measurements, profile, dateList);
        this.renderCalorieChart(dateList, dailyLogs, profile);
        this.renderProteinChart(dateList, dailyLogs, profile);
        this.renderCarbsFatChart(dateList, dailyLogs);
        this.renderWorkoutConsistencyChart(dateList, workouts, profile);
        this.renderMeasurementsChart(measurements, dateList);
        this.renderWaterChart(dateList, dailyLogs, profile);
        this.renderStrengthChart(workouts, dateList);
    },

    renderSummaryStats(dateList, dailyLogs, workouts, measurements, profile) {
        let totalCals = 0;
        let totalProtein = 0;
        let totalWater = 0;
        let daysWithLogs = 0;

        dateList.forEach(d => {
            const log = dailyLogs[d];
            if (log && log.nutrition && log.nutrition.length > 0) {
                daysWithLogs++;
                const cals = log.nutrition.reduce((sum, item) => sum + (item.calories || 0), 0);
                const prot = log.nutrition.reduce((sum, item) => sum + (item.protein || 0), 0);
                totalCals += cals;
                totalProtein += prot;
            }
            if (log && log.water) {
                totalWater += log.water;
            }
        });

        const avgCals = daysWithLogs > 0 ? Math.round(totalCals / daysWithLogs) : 0;
        const avgProt = daysWithLogs > 0 ? Utils.round(totalProtein / daysWithLogs, 1) : 0;
        const avgWater = dateList.length > 0 ? Utils.round((totalWater / dateList.length) / 1000, 1) : 0;

        const workoutsInRange = workouts.filter(w => w.date >= dateList[0] && w.date <= dateList[dateList.length - 1]);
        let totalVolumeLifted = 0;
        workoutsInRange.forEach(w => {
            if (w.exercises) {
                w.exercises.forEach(ex => {
                    if (ex.sets) {
                        ex.sets.forEach(s => {
                            if (s.completed) totalVolumeLifted += (s.weight * s.reps);
                        });
                    }
                });
            }
        });

        // Set text
        const setText = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };

        setText('analytics-avg-cals', `${avgCals} kcal`);
        setText('analytics-avg-prot', `${avgProt} g`);
        setText('analytics-workouts-count', workoutsInRange.length);
        setText('analytics-total-volume', `${Math.round(totalVolumeLifted / 1000)}k kg`);
        setText('analytics-avg-water', `${avgWater} L`);
    },

    destroyChart(key) {
        if (this.charts[key]) {
            this.charts[key].destroy();
            delete this.charts[key];
        }
    },

    // 1. Weight Progression Chart
    renderWeightChart(measurements, profile, dateList) {
        const canvas = document.getElementById('chart-weight');
        if (!canvas || typeof Chart === 'undefined') return;
        this.destroyChart('weight');

        const inRange = measurements.filter(m => m.date >= dateList[0] && m.date <= dateList[dateList.length - 1] && m.weight);
        const labels = inRange.map(m => Utils.formatDate(m.date, { month: 'short', day: 'numeric' }));
        const weights = inRange.map(m => m.weight);
        const targetWeights = inRange.map(() => profile.targetWeight || 72);

        const ctx = canvas.getContext('2d');
        this.charts['weight'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Weight (kg)',
                        data: weights,
                        borderColor: '#00e676',
                        backgroundColor: 'rgba(0, 230, 118, 0.1)',
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: '#00e676',
                        pointRadius: 4
                    },
                    {
                        label: 'Target Weight',
                        data: targetWeights,
                        borderColor: '#f59e0b',
                        borderDash: [6, 6],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: this.getChartOptions('Weight (kg)')
        });
    },

    // 2. Calorie Consumption Chart
    renderCalorieChart(dateList, dailyLogs, profile) {
        const canvas = document.getElementById('chart-calories');
        if (!canvas || typeof Chart === 'undefined') return;
        this.destroyChart('calories');

        const labels = dateList.map(d => Utils.formatDate(d, { month: 'short', day: 'numeric' }));
        const calories = dateList.map(d => {
            const log = dailyLogs[d];
            return log && log.nutrition ? Math.round(log.nutrition.reduce((s, i) => s + (i.calories || 0), 0)) : 0;
        });
        const targets = dateList.map(() => profile.calorieTarget || 2200);

        const ctx = canvas.getContext('2d');
        this.charts['calories'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Calories Consumed',
                        data: calories,
                        backgroundColor: calories.map(c => (c > (profile.calorieTarget || 2200) + 200) ? 'rgba(239, 68, 68, 0.7)' : 'rgba(0, 230, 118, 0.7)'),
                        borderRadius: 4
                    },
                    {
                        type: 'line',
                        label: 'Daily Target',
                        data: targets,
                        borderColor: '#38bdf8',
                        borderDash: [4, 4],
                        pointRadius: 0
                    }
                ]
            },
            options: this.getChartOptions('Calories (kcal)')
        });
    },

    // 3. Protein Intake Chart
    renderProteinChart(dateList, dailyLogs, profile) {
        const canvas = document.getElementById('chart-protein');
        if (!canvas || typeof Chart === 'undefined') return;
        this.destroyChart('protein');

        const labels = dateList.map(d => Utils.formatDate(d, { month: 'short', day: 'numeric' }));
        const proteins = dateList.map(d => {
            const log = dailyLogs[d];
            return log && log.nutrition ? Utils.round(log.nutrition.reduce((s, i) => s + (i.protein || 0), 0), 1) : 0;
        });
        const targetLine = dateList.map(() => profile.proteinTarget || 150);

        const ctx = canvas.getContext('2d');
        this.charts['protein'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Protein (g)',
                        data: proteins,
                        backgroundColor: 'rgba(56, 189, 248, 0.75)',
                        borderRadius: 4
                    },
                    {
                        type: 'line',
                        label: 'Target (g)',
                        data: targetLine,
                        borderColor: '#00e676',
                        borderDash: [5, 5],
                        pointRadius: 0
                    }
                ]
            },
            options: this.getChartOptions('Protein (g)')
        });
    },

    // 4. Carbs & Fat Comparison Chart
    renderCarbsFatChart(dateList, dailyLogs) {
        const canvas = document.getElementById('chart-carbs-fat');
        if (!canvas || typeof Chart === 'undefined') return;
        this.destroyChart('carbsFat');

        const labels = dateList.map(d => Utils.formatDate(d, { month: 'short', day: 'numeric' }));
        const carbs = dateList.map(d => {
            const log = dailyLogs[d];
            return log && log.nutrition ? Utils.round(log.nutrition.reduce((s, i) => s + (i.carbs || 0), 0), 1) : 0;
        });
        const fats = dateList.map(d => {
            const log = dailyLogs[d];
            return log && log.nutrition ? Utils.round(log.nutrition.reduce((s, i) => s + (i.fat || 0), 0), 1) : 0;
        });

        const ctx = canvas.getContext('2d');
        this.charts['carbsFat'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Carbs (g)',
                        data: carbs,
                        borderColor: '#38bdf8',
                        tension: 0.3,
                        pointRadius: 2
                    },
                    {
                        label: 'Fat (g)',
                        data: fats,
                        borderColor: '#f59e0b',
                        tension: 0.3,
                        pointRadius: 2
                    }
                ]
            },
            options: this.getChartOptions('Grams (g)')
        });
    },

    // 5. Weekly Workout Consistency Chart
    renderWorkoutConsistencyChart(dateList, workouts, profile) {
        const canvas = document.getElementById('chart-workout-completion');
        if (!canvas || typeof Chart === 'undefined') return;
        this.destroyChart('workoutComp');

        // Group dates into 7-day chunks (weeks)
        const weeks = [];
        let curChunk = [];
        dateList.forEach(d => {
            curChunk.push(d);
            if (curChunk.length === 7) {
                weeks.push(curChunk);
                curChunk = [];
            }
        });
        if (curChunk.length > 0) weeks.push(curChunk);

        const labels = weeks.map((w, idx) => `Week ${idx + 1}`);
        const workoutCounts = weeks.map(wDates => {
            return workouts.filter(w => wDates.includes(w.date)).length;
        });
        const targetDays = weeks.map(() => profile.availableDays || 5);

        const ctx = canvas.getContext('2d');
        this.charts['workoutComp'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Workouts Completed',
                        data: workoutCounts,
                        backgroundColor: '#00e676',
                        borderRadius: 4
                    },
                    {
                        type: 'line',
                        label: 'Goal (Days/Week)',
                        data: targetDays,
                        borderColor: '#a855f7',
                        borderDash: [5, 5],
                        pointRadius: 0
                    }
                ]
            },
            options: this.getChartOptions('Sessions')
        });
    },

    // 6. Body Measurements Progression Chart
    renderMeasurementsChart(measurements, dateList) {
        const canvas = document.getElementById('chart-measurements');
        if (!canvas || typeof Chart === 'undefined') return;
        this.destroyChart('measurements');

        const inRange = measurements.filter(m => m.date >= dateList[0] && m.date <= dateList[dateList.length - 1]);
        const labels = inRange.map(m => Utils.formatDate(m.date, { month: 'short', day: 'numeric' }));
        const waists = inRange.map(m => m.waist || null);
        const chests = inRange.map(m => m.chest || null);
        const arms = inRange.map(m => m.armRight || null);

        const ctx = canvas.getContext('2d');
        this.charts['measurements'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Waist (cm)', data: waists, borderColor: '#f59e0b', tension: 0.3 },
                    { label: 'Chest (cm)', data: chests, borderColor: '#38bdf8', tension: 0.3 },
                    { label: 'Arms (cm)', data: arms, borderColor: '#a855f7', tension: 0.3 }
                ]
            },
            options: this.getChartOptions('Circumference (cm)')
        });
    },

    // 7. Water Intake Chart
    renderWaterChart(dateList, dailyLogs, profile) {
        const canvas = document.getElementById('chart-water');
        if (!canvas || typeof Chart === 'undefined') return;
        this.destroyChart('water');

        const labels = dateList.map(d => Utils.formatDate(d, { month: 'short', day: 'numeric' }));
        const waters = dateList.map(d => {
            const log = dailyLogs[d];
            return log ? Utils.round((log.water || 0) / 1000, 2) : 0;
        });
        const goalLitres = dateList.map(() => Utils.round((profile.waterIntake || 3500) / 1000, 2));

        const ctx = canvas.getContext('2d');
        this.charts['water'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Water Intake (L)',
                        data: waters,
                        backgroundColor: 'rgba(6, 182, 212, 0.75)',
                        borderRadius: 4
                    },
                    {
                        type: 'line',
                        label: 'Hydration Goal (L)',
                        data: goalLitres,
                        borderColor: '#00e676',
                        borderDash: [5, 5],
                        pointRadius: 0
                    }
                ]
            },
            options: this.getChartOptions('Litres (L)')
        });
    },

    // 8. Big Lifts Strength Progression Chart
    renderStrengthChart(workouts, dateList) {
        const canvas = document.getElementById('chart-strength');
        if (!canvas || typeof Chart === 'undefined') return;
        this.destroyChart('strength');

        const inRange = workouts.filter(w => w.date >= dateList[0] && w.date <= dateList[dateList.length - 1]);
        inRange.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Track max weight over time for Bench, Squat, Lat Pulldown
        const dataPoints = [];
        inRange.forEach(w => {
            if (w.exercises) {
                let bench = null;
                let squat = null;
                let lat = null;

                w.exercises.forEach(ex => {
                    const name = ex.name.toLowerCase();
                    const maxSet = ex.sets ? Math.max(...ex.sets.filter(s => s.completed).map(s => s.weight), 0) : 0;
                    if (maxSet > 0) {
                        if (name.includes('bench')) bench = maxSet;
                        if (name.includes('squat')) squat = maxSet;
                        if (name.includes('lat') || name.includes('pulldown') || name.includes('row')) lat = maxSet;
                    }
                });

                if (bench || squat || lat) {
                    dataPoints.push({
                        date: Utils.formatDate(w.date, { month: 'short', day: 'numeric' }),
                        bench,
                        squat,
                        lat
                    });
                }
            }
        });

        const ctx = canvas.getContext('2d');
        this.charts['strength'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dataPoints.map(d => d.date),
                datasets: [
                    { label: 'Bench Press (kg)', data: dataPoints.map(d => d.bench), borderColor: '#00e676', tension: 0.25, spanGaps: true },
                    { label: 'Squat (kg)', data: dataPoints.map(d => d.squat), borderColor: '#f59e0b', tension: 0.25, spanGaps: true },
                    { label: 'Lat Pulldown / Row (kg)', data: dataPoints.map(d => d.lat), borderColor: '#38bdf8', tension: 0.25, spanGaps: true }
                ]
            },
            options: this.getChartOptions('Max Lift (kg)')
        });
    },

    getChartOptions(yTitle = '') {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#94a3b8', font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#64748b', maxRotation: 45 },
                    grid: { color: 'rgba(255, 255, 255, 0.04)' }
                },
                y: {
                    title: { display: !!yTitle, text: yTitle, color: '#94a3b8' },
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                }
            }
        };
    }
};

window.AnalyticsController = AnalyticsController;
