/**
 * FitTrack Pro - Workout Tracker & Progressive Overload Planner
 */

const WorkoutController = {
    currentDate: null,
    activeSplit: 'Push',
    currentSession: null,
    restTimerInterval: null,
    restTimerSeconds: 0,
    restTimerTotal: 90,

    DEFAULT_EXERCISES: {
        'Chest': [
            { name: 'Barbell Bench Press', defaultSets: 4, defaultReps: 8 },
            { name: 'Incline Dumbbell Press', defaultSets: 3, defaultReps: 10 },
            { name: 'Cable Fly', defaultSets: 3, defaultReps: 12 }
        ],
        'Back': [
            { name: 'Lat Pulldown', defaultSets: 4, defaultReps: 10 },
            { name: 'Pull-ups', defaultSets: 3, defaultReps: 8 },
            { name: 'Barbell Row', defaultSets: 4, defaultReps: 8 },
            { name: 'Seated Cable Row', defaultSets: 3, defaultReps: 12 }
        ],
        'Shoulders': [
            { name: 'Overhead Shoulder Press', defaultSets: 4, defaultReps: 8 },
            { name: 'Dumbbell Lateral Raise', defaultSets: 4, defaultReps: 15 },
            { name: 'Rear Delt Fly', defaultSets: 3, defaultReps: 15 }
        ],
        'Biceps': [
            { name: 'Barbell Curls', defaultSets: 3, defaultReps: 10 },
            { name: 'Dumbbell Curls', defaultSets: 3, defaultReps: 12 },
            { name: 'Hammer Curls', defaultSets: 3, defaultReps: 12 }
        ],
        'Triceps': [
            { name: 'Triceps Pushdown', defaultSets: 3, defaultReps: 12 },
            { name: 'Overhead Triceps Extension', defaultSets: 3, defaultReps: 12 }
        ],
        'Legs': [
            { name: 'Barbell Back Squat', defaultSets: 4, defaultReps: 8 },
            { name: 'Leg Press', defaultSets: 3, defaultReps: 10 },
            { name: 'Leg Curls', defaultSets: 3, defaultReps: 12 },
            { name: 'Leg Extensions', defaultSets: 3, defaultReps: 12 },
            { name: 'Standing Calf Raises', defaultSets: 4, defaultReps: 15 }
        ],
        'Core': [
            { name: 'Planks', defaultSets: 3, defaultReps: 60 },
            { name: 'Hanging Leg Raises', defaultSets: 3, defaultReps: 12 },
            { name: 'Cable Crunches', defaultSets: 3, defaultReps: 15 }
        ]
    },

    SPLIT_TEMPLATES: {
        'Push': {
            name: 'Push (Chest, Shoulders & Triceps)',
            exercises: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Dumbbell Lateral Raise', 'Triceps Pushdown', 'Cable Fly']
        },
        'Pull': {
            name: 'Pull (Back, Rear Delts & Biceps)',
            exercises: ['Lat Pulldown', 'Barbell Row', 'Pull-ups', 'Rear Delt Fly', 'Barbell Curls', 'Hammer Curls']
        },
        'Legs': {
            name: 'Legs & Core',
            exercises: ['Barbell Back Squat', 'Leg Press', 'Leg Curls', 'Leg Extensions', 'Standing Calf Raises', 'Hanging Leg Raises']
        },
        'Upper': {
            name: 'Upper Body Power',
            exercises: ['Barbell Bench Press', 'Barbell Row', 'Overhead Shoulder Press', 'Lat Pulldown', 'Triceps Pushdown', 'Barbell Curls']
        },
        'Lower': {
            name: 'Lower Body & Core',
            exercises: ['Barbell Back Squat', 'Leg Press', 'Leg Curls', 'Standing Calf Raises', 'Planks']
        },
        'Full Body': {
            name: 'Full Body Compound Circuit',
            exercises: ['Barbell Back Squat', 'Barbell Bench Press', 'Barbell Row', 'Dumbbell Lateral Raise', 'Planks']
        }
    },

    init() {
        this.currentDate = Utils.getTodayDate();
        this.bindEvents();
        this.loadOrCreateSession();
        this.render();
    },

    bindEvents() {
        // Split selection buttons
        document.querySelectorAll('.btn-split-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const split = e.currentTarget.dataset.split;
                this.selectSplit(split);
            });
        });

        // Add custom exercise modal trigger
        const addExForm = document.getElementById('add-exercise-form');
        if (addExForm) {
            addExForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddNewExercise();
            });
        }
    },

    selectSplit(splitName) {
        this.activeSplit = splitName;
        document.querySelectorAll('.btn-split-tab').forEach(b => {
            b.classList.toggle('active', b.dataset.split === splitName);
        });

        // Check if there is an existing session for today with this split
        const workouts = StorageManager.getWorkouts();
        const existing = workouts.find(w => w.date === this.currentDate && w.split === splitName);
        if (existing) {
            this.currentSession = JSON.parse(JSON.stringify(existing));
        } else {
            this.initSessionFromTemplate(splitName);
        }
        this.render();
    },

    initSessionFromTemplate(splitName) {
        const template = this.SPLIT_TEMPLATES[splitName] || this.SPLIT_TEMPLATES['Push'];
        const exercises = [];

        template.exercises.forEach(name => {
            const prev = this.getPreviousExercisePerformance(name);
            const defaultWeight = prev ? prev.weight : 40;
            const defaultReps = prev ? prev.reps : 10;

            exercises.push({
                name: name,
                targetSets: 3,
                notes: '',
                sets: [
                    { reps: defaultReps, weight: defaultWeight, completed: false },
                    { reps: defaultReps, weight: defaultWeight, completed: false },
                    { reps: defaultReps, weight: defaultWeight, completed: false }
                ]
            });
        });

        this.currentSession = {
            id: Utils.generateId(),
            date: this.currentDate,
            split: splitName,
            workoutName: template.name,
            durationMin: 60,
            notes: '',
            exercises: exercises
        };
    },

    loadOrCreateSession() {
        const workouts = StorageManager.getWorkouts();
        const existingToday = workouts.find(w => w.date === this.currentDate);
        if (existingToday) {
            this.currentSession = JSON.parse(JSON.stringify(existingToday));
            this.activeSplit = this.currentSession.split || 'Push';
        } else {
            this.initSessionFromTemplate(this.activeSplit);
        }
    },

    /**
     * Look up previous session for progressive overload comparison
     */
    getPreviousExercisePerformance(exerciseName) {
        const workouts = StorageManager.getWorkouts();
        // Exclude current session
        const past = workouts.filter(w => w.date < this.currentDate || (w.id !== this.currentSession?.id));
        past.sort((a, b) => new Date(b.date) - new Date(a.date));

        for (const w of past) {
            if (w.exercises) {
                const match = w.exercises.find(e => e.name.toLowerCase() === exerciseName.toLowerCase());
                if (match && match.sets && match.sets.length > 0) {
                    const completedSets = match.sets.filter(s => s.completed || (s.weight > 0 && s.reps > 0));
                    if (completedSets.length > 0) {
                        // Return top set
                        completedSets.sort((a, b) => b.weight - a.weight);
                        return {
                            weight: completedSets[0].weight,
                            reps: completedSets[0].reps,
                            date: w.date
                        };
                    }
                }
            }
        }
        return null;
    },

    render() {
        this.renderSessionView();
        this.renderPRTable();
        this.renderHistory();
    },

    renderSessionView() {
        const container = document.getElementById('workout-session-container');
        if (!container || !this.currentSession) return;

        let totalVolume = 0;
        let totalSets = 0;
        let completedSets = 0;

        this.currentSession.exercises.forEach(ex => {
            ex.sets.forEach(s => {
                totalSets++;
                if (s.completed) {
                    completedSets++;
                    totalVolume += (s.weight * s.reps);
                }
            });
        });

        const completionPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

        // Header metrics
        const volDisplay = document.getElementById('workout-total-volume');
        const compDisplay = document.getElementById('workout-completion-pct');
        if (volDisplay) volDisplay.textContent = `${totalVolume.toLocaleString()} kg`;
        if (compDisplay) compDisplay.textContent = `${completionPct}%`;

        // Render Exercise Cards
        let html = '';
        this.currentSession.exercises.forEach((ex, exIdx) => {
            const prev = this.getPreviousExercisePerformance(ex.name);
            const prevText = prev ? `Previous Best: ${prev.weight}kg × ${prev.reps} reps (${Utils.formatDate(prev.date)})` : 'First time logged!';

            html += `
                <div class="exercise-card" data-ex-idx="${exIdx}">
                    <div class="exercise-header">
                        <div class="exercise-title-group">
                            <h4 class="exercise-title">${ex.name}</h4>
                            <span class="exercise-prev-best">${prevText}</span>
                        </div>
                        <div class="exercise-card-actions">
                            <button class="btn btn-sm btn-outline-cyan" onclick="WorkoutController.startRestTimer(90)">
                                ⏱ 90s Rest
                            </button>
                            <button class="btn-delete-item" onclick="WorkoutController.removeExercise(${exIdx})" title="Remove Exercise">
                                &times;
                            </button>
                        </div>
                    </div>

                    <div class="sets-table-wrapper">
                        <table class="sets-table">
                            <thead>
                                <tr>
                                    <th>SET</th>
                                    <th>PREV</th>
                                    <th>KG</th>
                                    <th>REPS</th>
                                    <th>OVERLOAD</th>
                                    <th>DONE</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ex.sets.map((set, sIdx) => {
                                    const isOverload = prev && set.completed && (
                                        set.weight > prev.weight || 
                                        (set.weight === prev.weight && set.reps > prev.reps)
                                    );

                                    return `
                                        <tr class="${set.completed ? 'set-completed' : ''}">
                                            <td class="set-num-col">#${sIdx + 1}</td>
                                            <td class="set-prev-col">${prev ? `${prev.weight}kg` : '-'}</td>
                                            <td>
                                                <input type="number" step="0.5" min="0" class="input-set-val" value="${set.weight}" 
                                                    onchange="WorkoutController.updateSet(${exIdx}, ${sIdx}, 'weight', this.value)">
                                            </td>
                                            <td>
                                                <input type="number" step="1" min="0" class="input-set-val" value="${set.reps}" 
                                                    onchange="WorkoutController.updateSet(${exIdx}, ${sIdx}, 'reps', this.value)">
                                            </td>
                                            <td>
                                                ${isOverload ? '<span class="badge-overload">🔥 +PR</span>' : '<span class="text-muted">-</span>'}
                                            </td>
                                            <td>
                                                <input type="checkbox" class="set-checkbox" ${set.completed ? 'checked' : ''} 
                                                    onchange="WorkoutController.toggleSetDone(${exIdx}, ${sIdx}, this.checked)">
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="exercise-footer">
                        <button class="btn btn-xs btn-outline-neon" onclick="WorkoutController.addSet(${exIdx})">
                            + Add Set
                        </button>
                        <input type="text" class="input-exercise-note" placeholder="Exercise notes (e.g. paused at bottom, drop set on last)..." 
                            value="${ex.notes || ''}" onchange="WorkoutController.updateExerciseNotes(${exIdx}, this.value)">
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    updateSet(exIdx, setIdx, field, value) {
        if (!this.currentSession || !this.currentSession.exercises[exIdx]) return;
        const val = parseFloat(value) || 0;
        this.currentSession.exercises[exIdx].sets[setIdx][field] = val;
    },

    toggleSetDone(exIdx, setIdx, isChecked) {
        if (!this.currentSession || !this.currentSession.exercises[exIdx]) return;
        this.currentSession.exercises[exIdx].sets[setIdx].completed = isChecked;
        
        if (isChecked) {
            Utils.playBeep('beep');
            this.startRestTimer(90); // Auto start 90s rest
        }

        this.renderSessionView();

        // Also check if PR achieved
        const ex = this.currentSession.exercises[exIdx];
        const s = ex.sets[setIdx];
        const prev = this.getPreviousExercisePerformance(ex.name);
        if (isChecked && prev && (s.weight > prev.weight || (s.weight === prev.weight && s.reps > prev.reps))) {
            MilestoneManager.awardBadge('pr_crusher');
        }
    },

    addSet(exIdx) {
        if (!this.currentSession || !this.currentSession.exercises[exIdx]) return;
        const sets = this.currentSession.exercises[exIdx].sets;
        const last = sets.length > 0 ? sets[sets.length - 1] : { weight: 40, reps: 10 };
        sets.push({ weight: last.weight, reps: last.reps, completed: false });
        this.renderSessionView();
    },

    removeExercise(exIdx) {
        if (!this.currentSession) return;
        this.currentSession.exercises.splice(exIdx, 1);
        this.renderSessionView();
    },

    updateExerciseNotes(exIdx, notes) {
        if (!this.currentSession || !this.currentSession.exercises[exIdx]) return;
        this.currentSession.exercises[exIdx].notes = notes;
    },

    saveCurrentWorkout() {
        if (!this.currentSession) return;
        StorageManager.saveWorkout(this.currentSession);
        Utils.playBeep('success');
        Utils.showToast('Workout successfully saved & PRs updated!', 'success');
        MilestoneManager.awardBadge('first_log');
        this.render();

        if (typeof DashboardController !== 'undefined') {
            DashboardController.render();
        }
    },

    /**
     * Interactive Rest Timer with Web Audio API chime
     */
    startRestTimer(seconds = 90) {
        const timerWidget = document.getElementById('floating-rest-timer');
        if (timerWidget) timerWidget.classList.add('active');

        this.restTimerTotal = seconds;
        this.restTimerSeconds = seconds;
        this.updateRestTimerUI();

        if (this.restTimerInterval) clearInterval(this.restTimerInterval);

        this.restTimerInterval = setInterval(() => {
            this.restTimerSeconds--;
            this.updateRestTimerUI();

            if (this.restTimerSeconds <= 0) {
                clearInterval(this.restTimerInterval);
                this.restTimerInterval = null;
                Utils.playBeep('timer_done');
                Utils.showToast('Rest time is up! Get back under the bar!', 'warning', 4000);
            }
        }, 1000);
    },

    stopRestTimer() {
        if (this.restTimerInterval) clearInterval(this.restTimerInterval);
        this.restTimerInterval = null;
        const timerWidget = document.getElementById('floating-rest-timer');
        if (timerWidget) timerWidget.classList.remove('active');
    },

    updateRestTimerUI() {
        const timeDisplay = document.getElementById('rest-timer-time');
        const progressBar = document.getElementById('rest-timer-bar');

        if (timeDisplay) {
            const mins = Math.floor(this.restTimerSeconds / 60);
            const secs = this.restTimerSeconds % 60;
            timeDisplay.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
        }

        if (progressBar && this.restTimerTotal > 0) {
            const pct = Math.max(0, Math.round((this.restTimerSeconds / this.restTimerTotal) * 100));
            progressBar.style.width = `${pct}%`;
        }
    },

    /**
     * Render PRs Hall of Fame Table
     */
    renderPRTable() {
        const tbody = document.getElementById('prs-table-body');
        if (!tbody) return;

        const prs = StorageManager.getPRs();
        const keys = Object.keys(prs);

        if (keys.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No PRs recorded yet. Complete your first workout to establish baseline records!</td></tr>`;
            return;
        }

        let html = '';
        keys.forEach(k => {
            const pr = prs[k];
            html += `
                <tr>
                    <td><strong>${k}</strong></td>
                    <td class="text-neon font-weight-bold">${pr.maxWeight} kg</td>
                    <td>${pr.maxRepsAtMax} reps</td>
                    <td><span class="badge badge-1rm">${pr.estimated1RM} kg</span></td>
                    <td class="text-muted">${Utils.formatDate(pr.date)}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    /**
     * Render Workout History List
     */
    renderHistory() {
        const container = document.getElementById('workout-history-list');
        if (!container) return;

        const workouts = StorageManager.getWorkouts();
        if (workouts.length === 0) {
            container.innerHTML = `<div class="empty-state"><span>No workout sessions recorded yet.</span></div>`;
            return;
        }

        let html = '';
        workouts.slice(0, 15).forEach(w => {
            let totalVolume = 0;
            let setsCount = 0;
            if (w.exercises) {
                w.exercises.forEach(ex => {
                    if (ex.sets) {
                        ex.sets.forEach(s => {
                            if (s.completed) {
                                setsCount++;
                                totalVolume += (s.weight * s.reps);
                            }
                        });
                    }
                });
            }

            html += `
                <div class="history-workout-card">
                    <div class="hw-header">
                        <div>
                            <span class="badge badge-split">${w.split || 'Workout'}</span>
                            <h4 class="hw-title">${w.workoutName || 'Training Session'}</h4>
                            <span class="hw-date">${Utils.formatDate(w.date)} &bull; ${w.durationMin || 60} mins</span>
                        </div>
                        <div class="hw-stats">
                            <div class="hw-stat-item">
                                <span class="hw-stat-label">Total Volume</span>
                                <span class="hw-stat-val">${totalVolume.toLocaleString()} kg</span>
                            </div>
                            <div class="hw-stat-item">
                                <span class="hw-stat-label">Completed Sets</span>
                                <span class="hw-stat-val">${setsCount} sets</span>
                            </div>
                            <button class="btn-delete-item" onclick="WorkoutController.deleteHistoryWorkout('${w.id}')" title="Delete session">&times;</button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    deleteHistoryWorkout(id) {
        if (confirm('Are you sure you want to delete this workout log?')) {
            StorageManager.deleteWorkout(id);
            this.render();
            Utils.showToast('Workout log deleted', 'info');
        }
    },

    openAddExerciseModal() {
        const modal = document.getElementById('add-exercise-modal');
        if (modal) modal.classList.add('active');
    },

    closeAddExerciseModal() {
        const modal = document.getElementById('add-exercise-modal');
        if (modal) modal.classList.remove('active');
    },

    handleAddNewExercise() {
        const nameInput = document.getElementById('new-exercise-name');
        const setsInput = document.getElementById('new-exercise-sets');
        const repsInput = document.getElementById('new-exercise-reps');
        const weightInput = document.getElementById('new-exercise-weight');

        const name = nameInput.value.trim();
        const setsCount = parseInt(setsInput.value) || 3;
        const reps = parseInt(repsInput.value) || 10;
        const weight = parseFloat(weightInput.value) || 30;

        if (!name) {
            Utils.showToast('Please enter an exercise name', 'warning');
            return;
        }

        const sets = [];
        for (let i = 0; i < setsCount; i++) {
            sets.push({ reps, weight, completed: false });
        }

        this.currentSession.exercises.push({
            name: name,
            targetSets: setsCount,
            notes: '',
            sets: sets
        });

        this.closeAddExerciseModal();
        this.renderSessionView();
        Utils.showToast(`Added ${name} to current workout!`, 'success');
    }
};

window.WorkoutController = WorkoutController;
