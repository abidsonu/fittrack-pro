/**
 * FitTrack Pro - Six-Month Transformation Roadmap, Milestones & Badges
 */

const MilestoneManager = {
    // 12 Gamified Badges
    BADGES: [
        {
            id: 'first_log',
            title: 'First Step',
            desc: 'Logged your very first workout or meal',
            icon: '🎯',
            category: 'Beginner'
        },
        {
            id: 'streak_7',
            title: '7-Day Warrior',
            desc: 'Maintained a 7-day uninterrupted tracking streak',
            icon: '🔥',
            category: 'Consistency'
        },
        {
            id: 'streak_30',
            title: 'Iron Discipline',
            desc: 'Crushed a 30-day consistent tracking streak',
            icon: '⚡',
            category: 'Consistency'
        },
        {
            id: 'protein_pro',
            title: 'Anabolic Ace',
            desc: 'Hit 100% of your daily protein target',
            icon: '🥩',
            category: 'Nutrition'
        },
        {
            id: 'hydration_hero',
            title: 'Hydration Hero',
            desc: 'Drank 3.5+ Litres of water in a single day',
            icon: '💧',
            category: 'Lifestyle'
        },
        {
            id: 'pr_crusher',
            title: 'PR Crusher',
            desc: 'Achieved a new personal record on a compound lift',
            icon: '🏋️',
            category: 'Strength'
        },
        {
            id: 'photo_starter',
            title: 'Visual Proof',
            desc: 'Uploaded your Day 1 baseline transformation photo',
            icon: '📸',
            category: 'Physique'
        },
        {
            id: 'waist_trimmer',
            title: 'V-Taper Architect',
            desc: 'Reduced waist measurement by 3cm or more',
            icon: '📐',
            category: 'Physique'
        },
        {
            id: 'month_1_master',
            title: 'Foundation Champion',
            desc: 'Completed all Month 1 milestones & foundation habits',
            icon: '🥇',
            category: 'Milestone'
        },
        {
            id: 'month_2_master',
            title: 'Consistency King',
            desc: 'Completed Month 2 with verified progressive overload',
            icon: '🏆',
            category: 'Milestone'
        },
        {
            id: 'month_3_master',
            title: 'Midway Metamorphosis',
            desc: 'Completed Month 3 and reached 50% program completion',
            icon: '⭐',
            category: 'Milestone'
        },
        {
            id: 'transformation_elite',
            title: 'Aesthetic Legend',
            desc: 'Completed all 6 months of the transformation journey',
            icon: '👑',
            category: 'Milestone'
        }
    ],

    /**
     * Generate Default 6-Month Roadmap based on user goal
     */
    getDefaultRoadmap(profile) {
        const goal = profile ? profile.primaryGoal : 'lean_muscle_gain';
        const targetWaist = profile ? profile.targetWaist : 78;
        const targetWeight = profile ? profile.targetWeight : 72;

        return {
            month1: {
                title: 'MONTH 1 – FOUNDATION',
                subtitle: 'Establish Habits, Nutrition & Technique',
                status: 'in_progress',
                badgeId: 'month_1_master',
                objectives: [
                    'Master proper lifting technique on all compound exercises',
                    'Log 100% of daily meals and hit daily protein target',
                    'Zero unexcused missed workouts for 4 consecutive weeks',
                    'Take starting baseline photos and body measurements'
                ],
                tasks: [
                    { id: 'm1_t1', text: 'Complete day 1 baseline photos & measurements', completed: true },
                    { id: 'm1_t2', text: 'Dial in meal prep routine & grocery list', completed: true },
                    { id: 'm1_t3', text: 'Perform 4 weeks of consistent workouts without skipping', completed: true },
                    { id: 'm1_t4', text: 'Track daily water intake and achieve 3L+ daily', completed: true },
                    { id: 'm1_t5', text: 'Month 1 progress review & measurement log', completed: true }
                ]
            },
            month2: {
                title: 'MONTH 2 – CONSISTENCY & PROGRESSIVE OVERLOAD',
                subtitle: 'Add Weight to the Bar & Refine Nutrition',
                status: 'in_progress',
                badgeId: 'month_2_master',
                objectives: [
                    'Increase training weights on primary lifts by 5-10%',
                    'Establish regular 7-8 hours sleep schedule for optimal recovery',
                    'Monitor waist reduction trend towards target',
                    'Achieve 80%+ adherence to daily calorie and macro goals'
                ],
                tasks: [
                    { id: 'm2_t1', text: 'Log a new PR on Bench Press, Squat or Row', completed: true },
                    { id: 'm2_t2', text: 'Take Month 2 front and side physique photos', completed: true },
                    { id: 'm2_t3', text: 'Record mid-program body measurements', completed: true },
                    { id: 'm2_t4', text: 'Eliminate all liquid empty calories and sugary snacks', completed: true },
                    { id: 'm2_t5', text: 'Evaluate energy levels and pre-workout nutrition timing', completed: false }
                ]
            },
            month3: {
                title: 'MONTH 3 – PROGRESS & MID-POINT CALIBRATION',
                subtitle: 'Visible Physique Changes & Metric Evaluation',
                status: 'pending',
                badgeId: 'month_3_master',
                objectives: [
                    `Evaluate waist progression (Current target: ${targetWaist} cm)`,
                    'Re-calculate BMR/TDEE based on current body composition',
                    'Noticeable muscle fullness and waist taper in mirror',
                    'Surpass 50% milestone of the transformation roadmap'
                ],
                tasks: [
                    { id: 'm3_t1', text: 'Comprehensive Month 3 body scan & measurement', completed: false },
                    { id: 'm3_t2', text: 'Mid-term photo comparison (Month 0 vs Month 3)', completed: false },
                    { id: 'm3_t3', text: 'Review calorie deficit/surplus and adjust macros if stalled', completed: false },
                    { id: 'm3_t4', text: 'Increase training intensity (drop sets / rest-pause)', completed: false },
                    { id: 'm3_t5', text: 'Ensure daily creatine & hydration consistency', completed: false }
                ]
            },
            month4: {
                title: 'MONTH 4 – HYPERTROPHY & DEVELOPMENT',
                subtitle: 'Sculpting Weak Points & Maximizing Volume',
                status: 'pending',
                badgeId: null,
                objectives: [
                    'Target lagging muscle groups (Lateral delts, upper chest, lats)',
                    'Maintain high workout intensity with zero joint pain',
                    'Achieve peak mind-muscle connection during isolation movements',
                    'Lock in consistent high-protein intake on rest days'
                ],
                tasks: [
                    { id: 'm4_t1', text: 'Introduce dedicated shoulder and arm hypertrophy volume', completed: false },
                    { id: 'm4_t2', text: 'Take Month 4 progress photos under consistent lighting', completed: false },
                    { id: 'm4_t3', text: 'Perform deload week if systemic fatigue is elevated', completed: false },
                    { id: 'm4_t4', text: 'Maintain minimum 8,000 to 10,000 steps daily', completed: false }
                ]
            },
            month5: {
                title: 'MONTH 5 – REFINEMENT & CONDITIONING',
                subtitle: 'Aesthetic Chiseled Details & Muscle Definition',
                status: 'pending',
                badgeId: null,
                objectives: [
                    'Sharpen abdominal definition and upper body vascularity',
                    'Fine-tune daily sodium, potassium and water balance',
                    'Maintain strength on heavy compound lifts while leaning out',
                    'Prepare for the final Month 6 transformation photoshoot'
                ],
                tasks: [
                    { id: 'm5_t1', text: 'Log Month 5 body measurements and skinfold/waist check', completed: false },
                    { id: 'm5_t2', text: 'Optimize post-workout recovery and sleep quality', completed: false },
                    { id: 'm5_t3', text: 'Ensure 100% adherence to weekend nutrition targets', completed: false },
                    { id: 'm5_t4', text: 'Month 5 physique check-in photo upload', completed: false }
                ]
            },
            month6: {
                title: 'MONTH 6 – TRANSFORMATION FINALE & REPORT',
                subtitle: 'Peak Aesthetic Condition & Program Completion',
                status: 'pending',
                badgeId: 'transformation_elite',
                objectives: [
                    `Achieve target weight (${targetWeight} kg) and aesthetic waist (${targetWaist} cm)`,
                    'Side-by-side comparison of Month 0 vs Month 6 physique',
                    'Export comprehensive 6-month Transformation PDF / Report',
                    'Establish long-term sustainable maintenance routine'
                ],
                tasks: [
                    { id: 'm6_t1', text: 'Take final 6-month transformation photoshoot (Front, Side, Back)', completed: false },
                    { id: 'm6_t2', text: 'Log final body measurements and calculate net changes', completed: false },
                    { id: 'm6_t3', text: 'Review strength gains and total volume lifted over 180 days', completed: false },
                    { id: 'm6_t4', text: 'Download & print official FitTrack Pro Transformation Report', completed: false },
                    { id: 'm6_t5', text: 'Transition to sustainable lean maintenance protocol', completed: false }
                ]
            }
        };
    },

    /**
     * Get or initialize milestones
     */
    getMilestonesData() {
        let data = StorageManager.getMilestones();
        if (!data || !data.months) {
            const profile = StorageManager.getProfile();
            data = {
                months: this.getDefaultRoadmap(profile),
                unlockedBadges: ['first_log', 'streak_7', 'protein_pro', 'photo_starter']
            };
            StorageManager.saveMilestones(data);
        }
        return data;
    },

    /**
     * Toggle a task completion
     */
    toggleTask(monthKey, taskId) {
        const data = this.getMilestonesData();
        if (data.months[monthKey]) {
            const task = data.months[monthKey].tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                this.checkMonthStatus(data, monthKey);
                StorageManager.saveMilestones(data);
                return task.completed;
            }
        }
        return false;
    },

    /**
     * Recheck month completion status and award badges
     */
    checkMonthStatus(data, monthKey) {
        const month = data.months[monthKey];
        if (!month) return;

        const total = month.tasks.length;
        const completedCount = month.tasks.filter(t => t.completed).length;

        if (completedCount === total) {
            month.status = 'completed';
            if (month.badgeId && !data.unlockedBadges.includes(month.badgeId)) {
                this.awardBadge(month.badgeId);
            }
        } else if (completedCount > 0) {
            month.status = 'in_progress';
        } else {
            month.status = 'pending';
        }
    },

    /**
     * Award an achievement badge
     */
    awardBadge(badgeId) {
        const data = this.getMilestonesData();
        if (!data.unlockedBadges.includes(badgeId)) {
            data.unlockedBadges.push(badgeId);
            StorageManager.saveMilestones(data);

            const badge = this.BADGES.find(b => b.id === badgeId);
            if (badge && typeof Utils !== 'undefined') {
                Utils.playBeep('success');
                Utils.showToast(`🏆 Badge Unlocked: ${badge.title} – ${badge.desc}!`, 'success', 5000);
            }
        }
    },

    /**
     * Calculate Month Completion Percentage
     */
    getMonthProgress(monthData) {
        if (!monthData || !monthData.tasks || monthData.tasks.length === 0) return 0;
        const done = monthData.tasks.filter(t => t.completed).length;
        return Math.round((done / monthData.tasks.length) * 100);
    },

    /**
     * Calculate Total 6-Month Roadmap Completion Percentage
     */
    getOverallProgress() {
        const data = this.getMilestonesData();
        let totalTasks = 0;
        let completedTasks = 0;

        Object.values(data.months).forEach(m => {
            totalTasks += m.tasks.length;
            completedTasks += m.tasks.filter(t => t.completed).length;
        });

        if (totalTasks === 0) return 0;
        return Math.round((completedTasks / totalTasks) * 100);
    }
};

window.MilestoneManager = MilestoneManager;
