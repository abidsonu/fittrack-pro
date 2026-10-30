/**
 * FitTrack Pro - Nutrition & Food Tracker Controller
 */

const NutritionController = {
    currentDate: null,
    macroChart: null,
    selectedFood: null,

    init() {
        this.currentDate = Utils.getTodayDate();
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        // Date switchers in nutrition view
        const prevBtn = document.getElementById('nutrition-prev-day');
        const nextBtn = document.getElementById('nutrition-next-day');
        const todayBtn = document.getElementById('nutrition-today-btn');
        const dateInput = document.getElementById('nutrition-date-picker');

        if (prevBtn) prevBtn.addEventListener('click', () => this.changeDate(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.changeDate(1));
        if (todayBtn) todayBtn.addEventListener('click', () => this.setDate(Utils.getTodayDate()));
        if (dateInput) {
            dateInput.addEventListener('change', (e) => {
                if (e.target.value) this.setDate(e.target.value);
            });
        }

        // Add food modal triggers
        const foodSearchInput = document.getElementById('food-search-input');
        if (foodSearchInput) {
            foodSearchInput.addEventListener('input', Utils.debounce((e) => {
                this.renderFoodSearchResults(e.target.value);
            }, 250));
        }

        const foodCategoryFilter = document.getElementById('food-category-filter');
        if (foodCategoryFilter) {
            foodCategoryFilter.addEventListener('change', (e) => {
                const searchVal = document.getElementById('food-search-input')?.value || '';
                this.renderFoodSearchResults(searchVal, e.target.value);
            });
        }

        const foodQuantityInput = document.getElementById('food-quantity-input');
        const foodUnitSelect = document.getElementById('food-unit-select');
        if (foodQuantityInput && foodUnitSelect) {
            foodQuantityInput.addEventListener('input', () => this.updateFoodPreview());
            foodUnitSelect.addEventListener('change', () => this.updateFoodPreview());
        }

        const addFoodForm = document.getElementById('add-food-form');
        if (addFoodForm) {
            addFoodForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveFoodEntry();
            });
        }

        const customFoodForm = document.getElementById('create-custom-food-form');
        if (customFoodForm) {
            customFoodForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveCustomFood();
            });
        }
    },

    setDate(dateStr) {
        this.currentDate = dateStr;
        this.render();
    },

    changeDate(delta) {
        this.currentDate = Utils.addDays(this.currentDate, delta);
        this.render();
    },

    /**
     * Main Render Function for Nutrition View
     */
    render() {
        const datePicker = document.getElementById('nutrition-date-picker');
        const dateDisplay = document.getElementById('nutrition-current-date-text');
        if (datePicker) datePicker.value = this.currentDate;
        if (dateDisplay) {
            const isToday = this.currentDate === Utils.getTodayDate();
            dateDisplay.textContent = isToday ? `Today (${Utils.formatDate(this.currentDate)})` : Utils.formatDate(this.currentDate);
        }

        const dayLog = StorageManager.getDayLog(this.currentDate);
        const profile = StorageManager.getProfile() || { calorieTarget: 2200, proteinTarget: 150, carbTarget: 250, fatTarget: 60 };

        // 1. Calculate Totals
        const totals = this.calculateDayTotals(dayLog.nutrition);

        // 2. Render Macro Summary Cards & Remaining
        this.renderSummaryCards(totals, profile);

        // 3. Render Meal Category Lists
        this.renderMealSections(dayLog);

        // 4. Render Micronutrient Table
        this.renderMicronutrients(totals);

        // 5. Render Macro Donut Chart
        this.renderMacroChart(totals);
    },

    /**
     * Calculate sum of nutrients for the day
     */
    calculateDayTotals(foodEntries = []) {
        const totals = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fibre: 0,
            sugar: 0,
            satFat: 0,
            sodium: 0,
            vitA: 0,
            vitC: 0,
            vitD: 0,
            vitE: 0,
            vitK: 0,
            calcium: 0,
            iron: 0,
            magnesium: 0,
            potassium: 0,
            zinc: 0,
            vitBList: []
        };

        foodEntries.forEach(item => {
            totals.calories += (item.calories || 0);
            totals.protein += (item.protein || 0);
            totals.carbs += (item.carbs || 0);
            totals.fat += (item.fat || 0);
            totals.fibre += (item.fibre || 0);
            totals.sugar += (item.sugar || 0);
            totals.satFat += (item.satFat || 0);
            totals.sodium += (item.sodium || 0);
            totals.vitA += (item.vitA || 0);
            totals.vitC += (item.vitC || 0);
            totals.vitD += (item.vitD || 0);
            totals.vitE += (item.vitE || 0);
            totals.vitK += (item.vitK || 0);
            totals.calcium += (item.calcium || 0);
            totals.iron += (item.iron || 0);
            totals.magnesium += (item.magnesium || 0);
            totals.potassium += (item.potassium || 0);
            totals.zinc += (item.zinc || 0);
            if (item.vitB && item.vitB !== 'Data unavailable' && !totals.vitBList.includes(item.vitB)) {
                totals.vitBList.push(item.vitB);
            }
        });

        // Round values
        totals.calories = Math.round(totals.calories);
        totals.protein = Utils.round(totals.protein, 1);
        totals.carbs = Utils.round(totals.carbs, 1);
        totals.fat = Utils.round(totals.fat, 1);
        totals.fibre = Utils.round(totals.fibre, 1);
        totals.sugar = Utils.round(totals.sugar, 1);
        totals.satFat = Utils.round(totals.satFat, 1);
        totals.sodium = Math.round(totals.sodium);
        totals.vitA = Math.round(totals.vitA);
        totals.vitC = Utils.round(totals.vitC, 1);
        totals.vitD = Math.round(totals.vitD);
        totals.vitE = Utils.round(totals.vitE, 1);
        totals.vitK = Utils.round(totals.vitK, 1);
        totals.calcium = Math.round(totals.calcium);
        totals.iron = Utils.round(totals.iron, 1);
        totals.magnesium = Math.round(totals.magnesium);
        totals.potassium = Math.round(totals.potassium);
        totals.zinc = Utils.round(totals.zinc, 1);

        return totals;
    },

    /**
     * Render Top Nutrition Summary Numbers & Remaining
     */
    renderSummaryCards(totals, profile) {
        const calTarget = profile.calorieTarget || 2200;
        const calRem = calTarget - totals.calories;
        const protTarget = profile.proteinTarget || 150;
        const protRem = protTarget - totals.protein;
        const carbTarget = profile.carbTarget || 250;
        const carbRem = carbTarget - totals.carbs;
        const fatTarget = profile.fatTarget || 65;
        const fatRem = fatTarget - totals.fat;

        // Populate elements
        const setText = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };

        setText('nut-cal-consumed', totals.calories);
        setText('nut-cal-target', calTarget);
        setText('nut-cal-remaining', calRem >= 0 ? `${calRem} kcal remaining` : `${Math.abs(calRem)} kcal surplus`);
        
        const calBar = document.getElementById('nut-cal-bar');
        if (calBar) {
            const pct = Math.min(Math.round((totals.calories / calTarget) * 100), 100);
            calBar.style.width = `${pct}%`;
            calBar.style.backgroundColor = calRem < 0 ? '#ef4444' : '#00e676';
        }

        setText('nut-prot-consumed', totals.protein + 'g');
        setText('nut-prot-target', protTarget + 'g');
        setText('nut-prot-remaining', protRem > 0 ? `${Utils.round(protRem, 1)}g left` : 'Target Met! 🔥');

        setText('nut-carb-consumed', totals.carbs + 'g');
        setText('nut-carb-target', carbTarget + 'g');
        setText('nut-carb-remaining', carbRem > 0 ? `${Utils.round(carbRem, 1)}g left` : 'Target Met');

        setText('nut-fat-consumed', totals.fat + 'g');
        setText('nut-fat-target', fatTarget + 'g');
        setText('nut-fat-remaining', fatRem > 0 ? `${Utils.round(fatRem, 1)}g left` : 'Target Met');

        // Check if daily protein target achieved for badge
        if (totals.protein >= protTarget && protTarget > 0) {
            MilestoneManager.awardBadge('protein_pro');
        }
    },

    /**
     * Render 6 Meal Categories
     */
    renderMealSections(dayLog) {
        const categories = [
            { key: 'breakfast', label: 'Breakfast', icon: '☕' },
            { key: 'morning_snack', label: 'Morning Snack', icon: '🍎' },
            { key: 'lunch', label: 'Lunch', icon: '🍛' },
            { key: 'evening_snack', label: 'Evening Snack', icon: '🥪' },
            { key: 'dinner', label: 'Dinner', icon: '🍗' },
            { key: 'other', label: 'Other Meals / Supplements', icon: '🥛' }
        ];

        const container = document.getElementById('meal-sections-container');
        if (!container) return;

        let html = '';

        categories.forEach(cat => {
            const items = dayLog.nutrition.filter(i => i.mealCategory === cat.key);
            const isCompleted = dayLog.completedMeals ? !!dayLog.completedMeals[cat.key] : false;

            const mealCalories = Math.round(items.reduce((sum, item) => sum + (item.calories || 0), 0));
            const mealProtein = Utils.round(items.reduce((sum, item) => sum + (item.protein || 0), 0), 1);
            const mealCarbs = Utils.round(items.reduce((sum, item) => sum + (item.carbs || 0), 0), 1);
            const mealFat = Utils.round(items.reduce((sum, item) => sum + (item.fat || 0), 0), 1);

            html += `
                <div class="meal-card ${isCompleted ? 'meal-completed' : ''}" data-meal="${cat.key}">
                    <div class="meal-header">
                        <div class="meal-title-group">
                            <span class="meal-icon">${cat.icon}</span>
                            <div>
                                <h4 class="meal-name">${cat.label}</h4>
                                <span class="meal-macro-preview">${mealCalories} kcal &bull; P: ${mealProtein}g &bull; C: ${mealCarbs}g &bull; F: ${mealFat}g</span>
                            </div>
                        </div>
                        <div class="meal-actions-group">
                            <label class="meal-complete-checkbox" title="Mark meal eaten">
                                <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="NutritionController.toggleMealCompleted('${cat.key}', this.checked)">
                                <span>Done</span>
                            </label>
                            <button class="btn btn-sm btn-outline-neon" onclick="NutritionController.openAddFoodModal('${cat.key}')">
                                + Add Food
                            </button>
                        </div>
                    </div>

                    <div class="meal-items-list">
                        ${items.length === 0 ? `
                            <div class="empty-meal-state">
                                <span>No foods logged for ${cat.label} yet.</span>
                            </div>
                        ` : items.map(item => `
                            <div class="food-item-row">
                                <div class="food-item-info">
                                    <span class="food-item-name">${item.foodName}</span>
                                    <span class="food-item-details">${item.quantity} ${item.unit} &bull; ${item.time || ''}</span>
                                </div>
                                <div class="food-item-macros">
                                    <span class="food-item-cal">${item.calories} kcal</span>
                                    <span class="food-item-macro-breakdown">P: ${item.protein}g | C: ${item.carbs}g | F: ${item.fat}g</span>
                                </div>
                                <button class="btn-delete-item" onclick="NutritionController.deleteFoodItem('${item.id}')" title="Delete entry">
                                    &times;
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * Render Micronutrient Details Breakdown
     */
    renderMicronutrients(totals) {
        const micronutrientsContainer = document.getElementById('micronutrients-table-body');
        if (!micronutrientsContainer) return;

        // Estimated Adult Male/Female RDA values for comparison
        const rda = {
            fibre: { target: 30, unit: 'g' },
            sugar: { target: 36, unit: 'g (max)' },
            satFat: { target: 20, unit: 'g (max)' },
            sodium: { target: 2000, unit: 'mg' },
            vitA: { target: 900, unit: 'mcg' },
            vitC: { target: 90, unit: 'mg' },
            vitD: { target: 600, unit: 'IU' },
            vitE: { target: 15, unit: 'mg' },
            vitK: { target: 120, unit: 'mcg' },
            calcium: { target: 1000, unit: 'mg' },
            iron: { target: 18, unit: 'mg' },
            magnesium: { target: 400, unit: 'mg' },
            potassium: { target: 3500, unit: 'mg' },
            zinc: { target: 11, unit: 'mg' }
        };

        const rows = [
            { name: 'Dietary Fibre', val: totals.fibre, rda: rda.fibre },
            { name: 'Sugar', val: totals.sugar, rda: rda.sugar },
            { name: 'Saturated Fat', val: totals.satFat, rda: rda.satFat },
            { name: 'Sodium', val: totals.sodium, rda: rda.sodium },
            { name: 'Vitamin A', val: totals.vitA, rda: rda.vitA },
            { name: 'Vitamin C', val: totals.vitC, rda: rda.vitC },
            { name: 'Vitamin D', val: totals.vitD, rda: rda.vitD },
            { name: 'Vitamin E', val: totals.vitE, rda: rda.vitE },
            { name: 'Vitamin K', val: totals.vitK, rda: rda.vitK },
            { name: 'Calcium', val: totals.calcium, rda: rda.calcium },
            { name: 'Iron', val: totals.iron, rda: rda.iron },
            { name: 'Magnesium', val: totals.magnesium, rda: rda.magnesium },
            { name: 'Potassium', val: totals.potassium, rda: rda.potassium },
            { name: 'Zinc', val: totals.zinc, rda: rda.zinc }
        ];

        let html = '';
        rows.forEach(r => {
            const pct = Math.min(Math.round((r.val / r.rda.target) * 100), 100);
            html += `
                <tr>
                    <td><strong>${r.name}</strong></td>
                    <td>${r.val} ${r.rda.unit}</td>
                    <td>${r.rda.target} ${r.rda.unit}</td>
                    <td>
                        <div class="micro-progress-wrap">
                            <div class="micro-progress-bar" style="width: ${pct}%"></div>
                            <span class="micro-pct-text">${pct}%</span>
                        </div>
                    </td>
                </tr>
            `;
        });

        micronutrientsContainer.innerHTML = html;

        // Render B vitamins note
        const bCompText = document.getElementById('b-complex-notes');
        if (bCompText) {
            bCompText.textContent = totals.vitBList.length > 0 
                ? totals.vitBList.join(' | ') 
                : 'Natural B-Vitamins present in grains, eggs and meats.';
        }
    },

    /**
     * Render Macro Donut Chart using Chart.js
     */
    renderMacroChart(totals) {
        const canvas = document.getElementById('nutrition-macro-donut');
        if (!canvas || typeof Chart === 'undefined') return;

        const pCals = (totals.protein * 4);
        const cCals = (totals.carbs * 4);
        const fCals = (totals.fat * 9);
        const sum = pCals + cCals + fCals;

        const pPct = sum > 0 ? Math.round((pCals / sum) * 100) : 30;
        const cPct = sum > 0 ? Math.round((cCals / sum) * 100) : 45;
        const fPct = sum > 0 ? Math.round((fCals / sum) * 100) : 25;

        if (this.macroChart) {
            this.macroChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        this.macroChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [`Protein (${pPct}%)`, `Carbs (${cPct}%)`, `Fat (${fPct}%)`],
                datasets: [{
                    data: sum > 0 ? [pCals, cCals, fCals] : [30, 45, 25],
                    backgroundColor: ['#00e676', '#38bdf8', '#f59e0b'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
                            padding: 14
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ` ${ctx.label}: ${Math.round(ctx.raw)} kcal`;
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * Toggle Meal Completed
     */
    toggleMealCompleted(mealCategory, isCompleted) {
        const dayLog = StorageManager.getDayLog(this.currentDate);
        if (!dayLog.completedMeals) dayLog.completedMeals = {};
        dayLog.completedMeals[mealCategory] = isCompleted;
        StorageManager.saveDayLog(this.currentDate, dayLog);
        this.render();
        if (isCompleted) {
            Utils.playBeep('beep');
            Utils.showToast(`${mealCategory.replace('_', ' ').toUpperCase()} marked completed!`, 'success');
        }
    },

    /**
     * Open Add Food Modal for a specific meal category
     */
    openAddFoodModal(mealCategory = 'breakfast') {
        const modal = document.getElementById('add-food-modal');
        const mealSelect = document.getElementById('modal-meal-category');
        const timeInput = document.getElementById('modal-meal-time');
        const searchInput = document.getElementById('food-search-input');

        if (mealSelect) mealSelect.value = mealCategory;
        if (timeInput) {
            const now = new Date();
            timeInput.value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        }
        if (searchInput) searchInput.value = '';

        this.selectedFood = null;
        this.renderFoodSearchResults('');
        this.updateFoodPreview();

        if (modal) {
            modal.classList.add('active');
            if (searchInput) searchInput.focus();
        }
    },

    closeAddFoodModal() {
        const modal = document.getElementById('add-food-modal');
        if (modal) modal.classList.remove('active');
    },

    /**
     * Render Food Search Dropdown / List
     */
    renderFoodSearchResults(query = '', category = 'All') {
        const list = FoodDatabase.searchFoods(query, category);
        const container = document.getElementById('food-search-results-list');
        if (!container) return;

        if (list.length === 0) {
            container.innerHTML = `
                <div class="no-food-match">
                    <span>No matches found for "${query}".</span>
                    <button type="button" class="btn btn-sm btn-neon mt-2" onclick="NutritionController.openCustomFoodTab()">
                        + Create Custom Food
                    </button>
                </div>
            `;
            return;
        }

        let html = '';
        list.slice(0, 20).forEach(food => {
            const isSelected = this.selectedFood && this.selectedFood.id === food.id;
            html += `
                <div class="food-search-item ${isSelected ? 'selected' : ''}" onclick="NutritionController.selectFood('${food.id}')">
                    <div class="food-search-item-header">
                        <strong class="food-search-name">${food.name}</strong>
                        <span class="badge badge-category">${food.category}</span>
                    </div>
                    <div class="food-search-item-macros">
                        <span>${food.calories} kcal/100g</span> &bull; 
                        <span>P: ${food.protein}g</span> &bull; 
                        <span>C: ${food.carbs}g</span> &bull; 
                        <span>F: ${food.fat}g</span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Auto select first item if none selected
        if (!this.selectedFood && list.length > 0) {
            this.selectFood(list[0].id);
        }
    },

    /**
     * Select food from list
     */
    selectFood(foodId) {
        const food = FoodDatabase.getFoodById(foodId);
        if (!food) return;

        this.selectedFood = food;

        // Populate unit select options
        const unitSelect = document.getElementById('food-unit-select');
        const quantityInput = document.getElementById('food-quantity-input');

        if (unitSelect) {
            let options = [];
            if (food.unitWeights) {
                Object.keys(food.unitWeights).forEach(u => {
                    options.push(`<option value="${u}">${u}</option>`);
                });
            } else {
                options.push(`<option value="g">grams (g)</option>`);
            }
            unitSelect.innerHTML = options.join('');
            unitSelect.value = food.defaultUnit || 'g';
        }

        if (quantityInput) {
            quantityInput.value = (food.defaultUnit === 'piece' || food.defaultUnit === 'cup' || food.defaultUnit === 'scoop') ? 1 : (food.servingWeightG || 100);
        }

        // Highlight in list
        document.querySelectorAll('.food-search-item').forEach(el => el.classList.remove('selected'));
        const activeItem = document.querySelector(`.food-search-item[onclick*="${foodId}"]`);
        if (activeItem) activeItem.classList.add('selected');

        this.updateFoodPreview();
    },

    /**
     * Live preview of calculated nutrients
     */
    updateFoodPreview() {
        const previewContainer = document.getElementById('food-calc-preview');
        if (!previewContainer) return;

        if (!this.selectedFood) {
            previewContainer.innerHTML = `<span class="text-muted">Select a food to preview estimated nutrients.</span>`;
            return;
        }

        const qty = parseFloat(document.getElementById('food-quantity-input')?.value || 1);
        const unit = document.getElementById('food-unit-select')?.value || 'g';

        const nutrients = FoodDatabase.calculateNutrients(this.selectedFood, qty, unit);
        if (!nutrients) return;

        previewContainer.innerHTML = `
            <div class="calculated-preview-grid">
                <div class="prev-item prev-cal">
                    <span class="prev-label">Calories</span>
                    <strong class="prev-val">${nutrients.calories} kcal</strong>
                </div>
                <div class="prev-item prev-prot">
                    <span class="prev-label">Protein</span>
                    <strong class="prev-val">${nutrients.protein}g</strong>
                </div>
                <div class="prev-item prev-carb">
                    <span class="prev-label">Carbs</span>
                    <strong class="prev-val">${nutrients.carbs}g</strong>
                </div>
                <div class="prev-item prev-fat">
                    <span class="prev-label">Fats</span>
                    <strong class="prev-val">${nutrients.fat}g</strong>
                </div>
            </div>
            <div class="micro-preview-pill">
                Fibre: ${nutrients.fibre}g &bull; Calcium: ${nutrients.calcium}mg &bull; Iron: ${nutrients.iron}mg &bull; Potassium: ${nutrients.potassium}mg
            </div>
        `;
    },

    /**
     * Save logged food entry to day log
     */
    handleSaveFoodEntry() {
        if (!this.selectedFood) {
            Utils.showToast('Please select a food item', 'warning');
            return;
        }

        const qty = parseFloat(document.getElementById('food-quantity-input').value);
        const unit = document.getElementById('food-unit-select').value;
        const mealCategory = document.getElementById('modal-meal-category').value;
        const time = document.getElementById('modal-meal-time').value;

        if (!qty || qty <= 0) {
            Utils.showToast('Please enter a valid quantity', 'warning');
            return;
        }

        const nutrients = FoodDatabase.calculateNutrients(this.selectedFood, qty, unit);

        const entry = {
            id: Utils.generateId(),
            foodId: this.selectedFood.id,
            foodName: this.selectedFood.name,
            mealCategory: mealCategory,
            quantity: qty,
            unit: unit,
            time: time,
            ...nutrients
        };

        const dayLog = StorageManager.getDayLog(this.currentDate);
        dayLog.nutrition.push(entry);
        StorageManager.saveDayLog(this.currentDate, dayLog);

        MilestoneManager.awardBadge('first_log');
        Utils.playBeep('beep');
        Utils.showToast(`Logged ${this.selectedFood.name} (${nutrients.calories} kcal)`, 'success');

        this.closeAddFoodModal();
        this.render();

        // Also update dashboard if present
        if (typeof DashboardController !== 'undefined') {
            DashboardController.render();
        }
    },

    /**
     * Delete a food item entry
     */
    deleteFoodItem(itemId) {
        const dayLog = StorageManager.getDayLog(this.currentDate);
        dayLog.nutrition = dayLog.nutrition.filter(i => i.id !== itemId);
        StorageManager.saveDayLog(this.currentDate, dayLog);
        this.render();
        Utils.showToast('Food entry deleted', 'info');

        if (typeof DashboardController !== 'undefined') {
            DashboardController.render();
        }
    },

    /**
     * Switch to custom food creation modal
     */
    openCustomFoodTab() {
        const modal = document.getElementById('custom-food-modal');
        if (modal) modal.classList.add('active');
    },

    closeCustomFoodModal() {
        const modal = document.getElementById('custom-food-modal');
        if (modal) modal.classList.remove('active');
    },

    handleSaveCustomFood() {
        const name = document.getElementById('custom-name').value.trim();
        const category = document.getElementById('custom-category').value;
        const cals = parseFloat(document.getElementById('custom-cal').value);
        const prot = parseFloat(document.getElementById('custom-prot').value);
        const carbs = parseFloat(document.getElementById('custom-carbs').value);
        const fat = parseFloat(document.getElementById('custom-fat').value);
        const fibre = parseFloat(document.getElementById('custom-fibre')?.value || 0);

        if (!name || isNaN(cals) || isNaN(prot) || isNaN(carbs) || isNaN(fat)) {
            Utils.showToast('Please fill in required fields (Name, Calories, Protein, Carbs, Fat)', 'warning');
            return;
        }

        const newFood = {
            id: 'custom_' + Utils.generateId(),
            name: name,
            category: category,
            servingWeightG: 100,
            defaultUnit: 'g',
            unitWeights: { g: 1, cup: 150, tbsp: 15 },
            calories: cals,
            protein: prot,
            carbs: carbs,
            fat: fat,
            fibre: fibre,
            sugar: 0,
            satFat: 0,
            sodium: 0,
            vitA: 0,
            vitB: 'Custom entry',
            vitC: 0,
            vitD: 0,
            vitE: 0,
            vitK: 0,
            calcium: 0,
            iron: 0,
            magnesium: 0,
            potassium: 0,
            zinc: 0
        };

        StorageManager.saveCustomFood(newFood);
        Utils.showToast(`Saved "${name}" to your Food Database!`, 'success');
        this.closeCustomFoodModal();

        // Refresh search list
        this.renderFoodSearchResults(name);
        this.selectFood(newFood.id);
    }
};

window.NutritionController = NutritionController;
