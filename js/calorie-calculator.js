/**
 * FitTrack Pro - Calorie, BMR, TDEE & Macronutrient Target Calculator
 * Uses the validated Mifflin-St Jeor equation and sports nutrition standards.
 */

const CalorieCalculator = {
    ACTIVITY_MULTIPLIERS: {
        sedentary: 1.2,          // Desk job, little to no exercise
        lightly_active: 1.375,   // Light exercise 1-3 days/week
        moderately_active: 1.55, // Moderate exercise 3-5 days/week
        very_active: 1.725,      // Heavy exercise 6-7 days/week
        extra_active: 1.9        // Very heavy exercise, 2x/day or physical job
    },

    GOAL_MODIFIERS: {
        fat_loss: {
            calorieDelta: -500,
            proteinPerKg: 2.2, // Higher protein to preserve lean muscle during deficit
            fatRatio: 0.25,    // 25% of calories from healthy fats
            label: 'Fat Loss (Aesthetic Cut)'
        },
        recomposition: {
            calorieDelta: -200,
            proteinPerKg: 2.3, // High protein for simultaneous fat loss & hypertrophy
            fatRatio: 0.25,
            label: 'Body Recomposition (Lose Fat, Build Muscle)'
        },
        muscle_gain: {
            calorieDelta: 350, // Controlled lean bulk to minimize fat gain
            proteinPerKg: 2.0,
            fatRatio: 0.25,
            label: 'Lean Muscle Gain (Clean Surplus)'
        },
        maintenance: {
            calorieDelta: 0,
            proteinPerKg: 2.0,
            fatRatio: 0.25,
            label: 'Maintenance / Performance'
        }
    },

    /**
     * Calculate Basal Metabolic Rate using Mifflin-St Jeor
     */
    calculateBMR(weightKg, heightCm, age, gender = 'male') {
        const w = parseFloat(weightKg);
        const h = parseFloat(heightCm);
        const a = parseFloat(age);

        if (!w || !h || !a) return 0;

        let bmr = (10 * w) + (6.25 * h) - (5 * a);
        if (gender.toLowerCase() === 'female') {
            bmr -= 161;
        } else {
            bmr += 5;
        }
        return Math.round(bmr);
    },

    /**
     * Calculate Total Daily Energy Expenditure (TDEE)
     */
    calculateTDEE(bmr, activityLevel = 'moderately_active') {
        const mult = this.ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
        return Math.round(bmr * mult);
    },

    /**
     * Calculate Body Mass Index (BMI) and Classification
     */
    calculateBMI(weightKg, heightCm) {
        const w = parseFloat(weightKg);
        const hM = parseFloat(heightCm) / 100;
        if (!w || !hM) return { bmi: 0, category: 'Unknown', color: '#94a3b8' };

        const bmi = Utils.round(w / (hM * hM), 1);
        let category = 'Normal weight';
        let color = '#00e676';

        if (bmi < 18.5) {
            category = 'Underweight';
            color = '#38bdf8';
        } else if (bmi >= 18.5 && bmi < 25) {
            category = 'Normal / Lean';
            color = '#00e676';
        } else if (bmi >= 25 && bmi < 30) {
            category = 'Overweight';
            color = '#f59e0b';
        } else {
            category = 'Obese';
            color = '#ef4444';
        }

        return { bmi, category, color };
    },

    /**
     * Calculate Complete Personalized Targets
     */
    calculatePlan({ weightKg, heightCm, age, gender = 'male', activityLevel = 'moderately_active', goal = 'lean_muscle_gain' }) {
        const bmr = this.calculateBMR(weightKg, heightCm, age, gender);
        const tdee = this.calculateTDEE(bmr, activityLevel);
        const bmiInfo = this.calculateBMI(weightKg, heightCm);

        // Normalize goal key
        let goalKey = 'recomposition';
        if (goal.includes('fat_loss') || goal.includes('cut')) goalKey = 'fat_loss';
        else if (goal.includes('muscle') || goal.includes('bulk') || goal.includes('gain')) goalKey = 'muscle_gain';
        else if (goal.includes('maintenance')) goalKey = 'maintenance';
        else goalKey = 'recomposition';

        const config = this.GOAL_MODIFIERS[goalKey];
        let targetCalories = tdee + config.calorieDelta;

        // Safety bound: never suggest below BMR for sustained periods
        if (targetCalories < bmr) {
            targetCalories = Math.max(bmr + 50, 1400);
        }

        // Calculate Macronutrients
        // 1. Protein: 2.0 - 2.3g per kg body weight
        const proteinGrams = Math.round(weightKg * config.proteinPerKg);
        const proteinCalories = proteinGrams * 4;

        // 2. Fat: ~25% of total target calories (minimum 0.7g/kg)
        let fatCalories = Math.round(targetCalories * config.fatRatio);
        let fatGrams = Math.round(fatCalories / 9);
        if (fatGrams < Math.round(weightKg * 0.75)) {
            fatGrams = Math.round(weightKg * 0.75);
            fatCalories = fatGrams * 9;
        }

        // 3. Carbohydrates: Remainder of calories
        let remainingCalories = targetCalories - (proteinCalories + fatCalories);
        if (remainingCalories < 0) remainingCalories = 0;
        const carbGrams = Math.round(remainingCalories / 4);

        // 4. Daily Water intake recommendation in ml
        const waterMl = Math.round((weightKg * 38) + 500); // 38ml/kg + 500ml exercise replenishment

        return {
            bmr,
            tdee,
            bmi: bmiInfo.bmi,
            bmiCategory: bmiInfo.category,
            calorieTarget: targetCalories,
            proteinTarget: proteinGrams,
            carbTarget: carbGrams,
            fatTarget: fatGrams,
            waterTarget: waterMl,
            goalLabel: config.label,
            disclaimer: 'Calculated targets are science-backed estimates via the Mifflin-St Jeor formula and ACSM guidelines. Individual metabolic variations occur.'
        };
    }
};

window.CalorieCalculator = CalorieCalculator;
