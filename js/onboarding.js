/**
 * FitTrack Pro - Multi-Step Onboarding System & Profile Architect
 */

const OnboardingController = {
    currentStep: 1,
    totalSteps: 4,

    init() {
        this.bindEvents();
        if (!StorageManager.hasProfile()) {
            this.openOnboarding();
        }
    },

    bindEvents() {
        // Step navigation buttons
        const nextBtn = document.getElementById('onboard-next-btn');
        const prevBtn = document.getElementById('onboard-prev-btn');
        const finishBtn = document.getElementById('onboard-finish-btn');

        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
        if (finishBtn) finishBtn.addEventListener('click', () => this.handleComplete());

        // Live calculation triggers on input changes
        const calcInputs = ['onboard-weight', 'onboard-height', 'onboard-age', 'onboard-gender', 'onboard-activity', 'onboard-goal'];
        calcInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.updateLivePreview());
                el.addEventListener('change', () => this.updateLivePreview());
            }
        });
    },

    openOnboarding(isEditMode = false) {
        const modal = document.getElementById('onboarding-modal');
        if (!modal) return;

        this.currentStep = 1;
        this.updateStepUI();

        if (isEditMode) {
            this.populateExistingProfile();
            const titleEl = document.getElementById('onboard-modal-title');
            if (titleEl) titleEl.textContent = 'Edit Profile & Fitness Plan';
        }

        modal.classList.add('active');
        this.updateLivePreview();
    },

    closeOnboarding() {
        const modal = document.getElementById('onboarding-modal');
        if (modal) modal.classList.remove('active');
    },

    nextStep() {
        if (!this.validateStep(this.currentStep)) return;

        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStepUI();
        }
    },

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepUI();
        }
    },

    updateStepUI() {
        // Toggle step contents
        for (let i = 1; i <= this.totalSteps; i++) {
            const stepEl = document.getElementById(`onboard-step-${i}`);
            const indicatorEl = document.getElementById(`step-indicator-${i}`);
            if (stepEl) stepEl.style.display = (i === this.currentStep) ? 'block' : 'none';
            if (indicatorEl) {
                indicatorEl.classList.toggle('active', i === this.currentStep);
                indicatorEl.classList.toggle('completed', i < this.currentStep);
            }
        }

        // Toggle buttons
        const prevBtn = document.getElementById('onboard-prev-btn');
        const nextBtn = document.getElementById('onboard-next-btn');
        const finishBtn = document.getElementById('onboard-finish-btn');

        if (prevBtn) prevBtn.style.display = (this.currentStep > 1) ? 'inline-block' : 'none';
        if (nextBtn) nextBtn.style.display = (this.currentStep < this.totalSteps) ? 'inline-block' : 'none';
        if (finishBtn) finishBtn.style.display = (this.currentStep === this.totalSteps) ? 'inline-block' : 'none';

        const stepText = document.getElementById('onboard-step-text');
        if (stepText) stepText.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;

        if (this.currentStep === 4) {
            this.updateLivePreview();
        }
    },

    validateStep(step) {
        if (step === 1) {
            const name = document.getElementById('onboard-name')?.value.trim();
            const age = parseFloat(document.getElementById('onboard-age')?.value);
            const height = parseFloat(document.getElementById('onboard-height')?.value);
            const weight = parseFloat(document.getElementById('onboard-weight')?.value);
            const targetWeight = parseFloat(document.getElementById('onboard-target-weight')?.value);

            if (!name) {
                Utils.showToast('Please enter your full name', 'warning');
                return false;
            }
            if (!age || age < 14 || age > 95) {
                Utils.showToast('Please enter a valid age between 14 and 95', 'warning');
                return false;
            }
            if (!height || height < 120 || height > 240) {
                Utils.showToast('Please enter a valid height in cm (120-240)', 'warning');
                return false;
            }
            if (!weight || weight < 35 || weight > 250) {
                Utils.showToast('Please enter a valid weight in kg (35-250)', 'warning');
                return false;
            }
            if (!targetWeight || targetWeight < 35 || targetWeight > 250) {
                Utils.showToast('Please enter a realistic target weight in kg', 'warning');
                return false;
            }
        } else if (step === 2) {
            const targetWaist = parseFloat(document.getElementById('onboard-target-waist')?.value);
            if (!targetWaist || targetWaist < 50 || targetWaist > 160) {
                Utils.showToast('Please enter a realistic target waist in cm (50-160)', 'warning');
                return false;
            }
        }
        return true;
    },

    updateLivePreview() {
        const weight = parseFloat(document.getElementById('onboard-weight')?.value) || 75;
        const height = parseFloat(document.getElementById('onboard-height')?.value) || 178;
        const age = parseFloat(document.getElementById('onboard-age')?.value) || 25;
        const gender = document.getElementById('onboard-gender')?.value || 'male';
        const activity = document.getElementById('onboard-activity')?.value || 'moderately_active';
        const goal = document.getElementById('onboard-goal')?.value || 'lean_muscle_gain';

        const plan = CalorieCalculator.calculatePlan({
            weightKg: weight,
            heightCm: height,
            age: age,
            gender: gender,
            activityLevel: activity,
            goal: goal
        });

        const setText = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };

        setText('onboard-prev-bmr', `${plan.bmr} kcal`);
        setText('onboard-prev-tdee', `${plan.tdee} kcal`);
        setText('onboard-prev-cal', `${plan.calorieTarget} kcal`);
        setText('onboard-prev-prot', `${plan.proteinTarget} g`);
        setText('onboard-prev-carb', `${plan.carbTarget} g`);
        setText('onboard-prev-fat', `${plan.fatTarget} g`);
        setText('onboard-prev-water', `${Utils.round(plan.waterTarget / 1000, 1)} L`);
        setText('onboard-prev-bmi', `${plan.bmi} (${plan.bmiCategory})`);
    },

    populateExistingProfile() {
        const p = StorageManager.getProfile();
        if (!p) return;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val !== undefined && val !== null) el.value = val;
        };

        setVal('onboard-name', p.name);
        setVal('onboard-age', p.age);
        setVal('onboard-gender', p.gender);
        setVal('onboard-height', p.height);
        setVal('onboard-weight', p.currentWeight);
        setVal('onboard-target-weight', p.targetWeight);
        setVal('onboard-country', p.country);
        setVal('onboard-activity', p.activityLevel);

        setVal('onboard-physique', p.currentPhysique);
        setVal('onboard-goal', p.primaryGoal);
        setVal('onboard-desired-physique', p.desiredPhysique);
        setVal('onboard-target-waist', p.targetWaist);
        setVal('onboard-six-month-goal', p.sixMonthGoal);

        setVal('onboard-workout-type', p.workoutType);
        setVal('onboard-available-days', p.availableDays);
        setVal('onboard-preferred-time', p.preferredTime);
        setVal('onboard-sleep', p.sleepDuration);
        setVal('onboard-diet-pref', p.dietaryPreference);
        setVal('onboard-allergies', p.allergies);
        setVal('onboard-meals-count', p.mealsPerDay);
        setVal('onboard-equipment', p.equipment);

        setVal('onboard-fitness-exp', p.fitnessExperience);
        setVal('onboard-current-exp', p.currentExperience);
        setVal('onboard-limitations', p.limitations);
    },

    handleComplete() {
        const weight = parseFloat(document.getElementById('onboard-weight').value);
        const height = parseFloat(document.getElementById('onboard-height').value);
        const age = parseFloat(document.getElementById('onboard-age').value);
        const gender = document.getElementById('onboard-gender').value;
        const activity = document.getElementById('onboard-activity').value;
        const goal = document.getElementById('onboard-goal').value;

        const calculated = CalorieCalculator.calculatePlan({
            weightKg: weight,
            heightCm: height,
            age: age,
            gender: gender,
            activityLevel: activity,
            goal: goal
        });

        const existingProfile = StorageManager.getProfile() || {};
        const startDate = existingProfile.startDate || Utils.getTodayDate();

        const profile = {
            name: document.getElementById('onboard-name').value.trim(),
            age: age,
            gender: gender,
            height: height,
            currentWeight: weight,
            startingWeight: existingProfile.startingWeight || weight,
            targetWeight: parseFloat(document.getElementById('onboard-target-weight').value),
            country: document.getElementById('onboard-country').value,
            activityLevel: activity,

            currentPhysique: document.getElementById('onboard-physique').value,
            primaryGoal: goal,
            desiredPhysique: document.getElementById('onboard-desired-physique').value.trim() || 'Aesthetic Muscular Physique',
            targetWaist: parseFloat(document.getElementById('onboard-target-waist').value) || 80,
            sixMonthGoal: document.getElementById('onboard-six-month-goal')?.value.trim() || 'Build clean muscle, drop waist fat, reach 12% body fat',

            workoutType: document.getElementById('onboard-workout-type').value,
            availableDays: parseInt(document.getElementById('onboard-available-days').value) || 5,
            preferredTime: document.getElementById('onboard-preferred-time').value || '18:00',
            sleepDuration: parseFloat(document.getElementById('onboard-sleep').value) || 8,
            dietaryPreference: document.getElementById('onboard-diet-pref').value,
            allergies: document.getElementById('onboard-allergies')?.value.trim() || 'None',
            mealsPerDay: parseInt(document.getElementById('onboard-meals-count').value) || 4,
            equipment: document.getElementById('onboard-equipment')?.value || 'Commercial Gym',

            fitnessExperience: document.getElementById('onboard-fitness-exp').value,
            currentExperience: document.getElementById('onboard-current-exp')?.value.trim() || '',
            limitations: document.getElementById('onboard-limitations')?.value.trim() || 'None',

            startDate: startDate,
            bmr: calculated.bmr,
            tdee: calculated.tdee,
            calorieTarget: calculated.calorieTarget,
            proteinTarget: calculated.proteinTarget,
            carbTarget: calculated.carbTarget,
            fatTarget: calculated.fatTarget,
            waterIntake: calculated.waterTarget
        };

        StorageManager.saveProfile(profile);

        // Also add starting body measurement if none exists
        const measurements = StorageManager.getBodyMeasurements();
        if (measurements.length === 0) {
            StorageManager.saveBodyMeasurement({
                date: startDate,
                weight: weight,
                waist: profile.targetWaist ? (profile.targetWaist + 8) : 88, // reasonable starting waist estimate
                chest: 100,
                shoulders: 115,
                armRight: 34,
                notes: 'Day 1 Starting baseline measurement.'
            });
        }

        Utils.playBeep('success');
        Utils.showToast(`Welcome ${profile.name}! Your personalized 6-month plan is generated.`, 'success', 5000);

        this.closeOnboarding();

        // Refresh all app controllers
        if (typeof DashboardController !== 'undefined') DashboardController.render();
        if (typeof NutritionController !== 'undefined') NutritionController.render();
        if (typeof WorkoutController !== 'undefined') WorkoutController.render();
        if (typeof PhysiqueController !== 'undefined') PhysiqueController.render();
        if (typeof AnalyticsController !== 'undefined') AnalyticsController.render();
    }
};

window.OnboardingController = OnboardingController;
