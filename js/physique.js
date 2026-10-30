/**
 * FitTrack Pro - Body Measurements & Progress Photo Studio
 */

const PhysiqueController = {
    measurementChart: null,
    currentPhotos: [],
    comparePhotoAId: null,
    comparePhotoBId: null,

    async init() {
        this.bindEvents();
        await this.render();
    },

    bindEvents() {
        const measForm = document.getElementById('body-measurement-form');
        if (measForm) {
            measForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveMeasurement();
            });
        }

        const photoForm = document.getElementById('upload-photo-form');
        if (photoForm) {
            photoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSavePhoto();
            });
        }

        const photoFileInput = document.getElementById('photo-file-input');
        if (photoFileInput) {
            photoFileInput.addEventListener('change', (e) => {
                this.handleFileSelected(e);
            });
        }

        const photoFilterMonth = document.getElementById('photo-filter-month');
        if (photoFilterMonth) {
            photoFilterMonth.addEventListener('change', () => {
                this.renderPhotoGallery();
            });
        }

        const compSelectA = document.getElementById('compare-select-a');
        const compSelectB = document.getElementById('compare-select-b');
        if (compSelectA && compSelectB) {
            compSelectA.addEventListener('change', (e) => {
                this.comparePhotoAId = e.target.value;
                this.renderComparisonView();
            });
            compSelectB.addEventListener('change', (e) => {
                this.comparePhotoBId = e.target.value;
                this.renderComparisonView();
            });
        }
    },

    async render() {
        this.renderMeasurementCards();
        this.renderMeasurementChart();
        this.renderMeasurementHistory();
        await this.loadAndRenderPhotos();
    },

    /**
     * Render Summary Delta Cards (Starting vs Current)
     */
    renderMeasurementCards() {
        const measurements = StorageManager.getBodyMeasurements();
        const profile = StorageManager.getProfile();

        if (measurements.length === 0) return;

        const first = measurements[0];
        const last = measurements[measurements.length - 1];

        const setDelta = (idVal, idDiff, startVal, endVal, unit = 'cm', reverseGood = false) => {
            const elVal = document.getElementById(idVal);
            const elDiff = document.getElementById(idDiff);
            if (!elVal || !elDiff) return;

            elVal.textContent = `${endVal || '-'} ${unit}`;
            if (startVal && endVal) {
                const diff = Utils.round(endVal - startVal, 1);
                const isGood = reverseGood ? (diff < 0) : (diff > 0);
                const sign = diff > 0 ? '+' : '';
                elDiff.textContent = `${sign}${diff} ${unit} net`;
                elDiff.className = `stat-delta ${isGood ? 'text-neon' : 'text-amber'}`;
            } else {
                elDiff.textContent = '-';
            }
        };

        setDelta('physique-weight-current', 'physique-weight-diff', first.weight, last.weight, 'kg', true);
        setDelta('physique-waist-current', 'physique-waist-diff', first.waist, last.waist, 'cm', true);
        setDelta('physique-chest-current', 'physique-chest-diff', first.chest, last.chest, 'cm', false);
        setDelta('physique-arms-current', 'physique-arms-diff', first.armRight, last.armRight, 'cm', false);

        // Check if waist reduction milestone badge unlocked
        if (first.waist && last.waist && (first.waist - last.waist) >= 3.0) {
            MilestoneManager.awardBadge('waist_trimmer');
        }
    },

    /**
     * Render Interactive Multi-Metric Chart using Chart.js
     */
    renderMeasurementChart() {
        const canvas = document.getElementById('physique-trend-chart');
        if (!canvas || typeof Chart === 'undefined') return;

        const measurements = StorageManager.getBodyMeasurements();
        if (measurements.length === 0) return;

        const labels = measurements.map(m => Utils.formatDate(m.date, { month: 'short', day: 'numeric' }));
        const weights = measurements.map(m => m.weight);
        const waists = measurements.map(m => m.waist);
        const chests = measurements.map(m => m.chest);
        const arms = measurements.map(m => m.armRight);

        if (this.measurementChart) {
            this.measurementChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        this.measurementChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Weight (kg)',
                        data: weights,
                        borderColor: '#00e676',
                        backgroundColor: 'rgba(0, 230, 118, 0.1)',
                        tension: 0.3,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Waist (cm)',
                        data: waists,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderDash: [5, 5],
                        tension: 0.3,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Chest (cm)',
                        data: chests,
                        borderColor: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        tension: 0.3,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Arms (cm)',
                        data: arms,
                        borderColor: '#a855f7',
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        tension: 0.3,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        labels: { color: '#94a3b8', font: { family: "'Plus Jakarta Sans', sans-serif" } }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#64748b' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Weight (kg)', color: '#00e676' },
                        ticks: { color: '#00e676' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Circumference (cm)', color: '#94a3b8' },
                        ticks: { color: '#94a3b8' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    },

    /**
     * Render Measurement History Table
     */
    renderMeasurementHistory() {
        const tbody = document.getElementById('measurements-table-body');
        if (!tbody) return;

        const list = StorageManager.getBodyMeasurements();
        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted">No measurements recorded yet. Add your baseline to start tracking!</td></tr>`;
            return;
        }

        // Display newest first
        const reversed = [...list].reverse();
        let html = '';
        reversed.forEach(m => {
            html += `
                <tr>
                    <td><strong>${Utils.formatDate(m.date)}</strong></td>
                    <td class="text-neon font-weight-bold">${m.weight ? `${m.weight} kg` : '-'}</td>
                    <td class="text-amber">${m.waist ? `${m.waist} cm` : '-'}</td>
                    <td>${m.chest ? `${m.chest} cm` : '-'}</td>
                    <td>${m.shoulders ? `${m.shoulders} cm` : '-'}</td>
                    <td>${m.armRight ? `${m.armRight} cm` : '-'}</td>
                    <td>${m.thighs ? `${m.thighs} cm` : '-'}</td>
                    <td>${m.calves ? `${m.calves} cm` : '-'}</td>
                    <td>${m.bodyFat ? `${m.bodyFat}%` : '-'}</td>
                    <td>
                        <button class="btn-delete-item" onclick="PhysiqueController.deleteMeasurement('${m.id}')" title="Delete record">&times;</button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    handleSaveMeasurement() {
        const date = document.getElementById('meas-date').value || Utils.getTodayDate();
        const weight = parseFloat(document.getElementById('meas-weight').value) || null;
        const waist = parseFloat(document.getElementById('meas-waist').value) || null;
        const chest = parseFloat(document.getElementById('meas-chest').value) || null;
        const shoulders = parseFloat(document.getElementById('meas-shoulders').value) || null;
        const armRight = parseFloat(document.getElementById('meas-arms').value) || null;
        const thighs = parseFloat(document.getElementById('meas-thighs').value) || null;
        const calves = parseFloat(document.getElementById('meas-calves').value) || null;
        const neck = parseFloat(document.getElementById('meas-neck')?.value) || null;
        const notes = document.getElementById('meas-notes')?.value || '';

        if (!weight && !waist && !chest) {
            Utils.showToast('Please enter at least Weight or Waist measurement', 'warning');
            return;
        }

        const record = {
            id: Utils.generateId(),
            date: date,
            weight: weight,
            waist: waist,
            chest: chest,
            shoulders: shoulders,
            armLeft: armRight,
            armRight: armRight,
            thighs: thighs,
            calves: calves,
            neck: neck,
            notes: notes
        };

        StorageManager.saveBodyMeasurement(record);
        Utils.playBeep('beep');
        Utils.showToast('Body measurement successfully saved!', 'success');
        this.render();

        if (typeof DashboardController !== 'undefined') {
            DashboardController.render();
        }
    },

    deleteMeasurement(id) {
        if (confirm('Delete this body measurement record?')) {
            StorageManager.deleteBodyMeasurement(id);
            this.render();
            Utils.showToast('Measurement deleted', 'info');
        }
    },

    // -------------------------------------------------------------
    // PROGRESS PHOTO STUDIO (INDEXEDDB)
    // -------------------------------------------------------------
    async loadAndRenderPhotos() {
        this.currentPhotos = await StorageManager.getAllPhotos();
        this.renderPhotoGallery();
        this.populateComparisonDropdowns();
        this.renderComparisonView();
    },

    async handleFileSelected(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('photo-upload-preview');
        if (!file || !preview) return;

        try {
            const dataUrl = await Utils.readFileAsDataURL(file);
            preview.src = dataUrl;
            preview.style.display = 'block';
        } catch (err) {
            Utils.showToast('Failed to load image preview', 'error');
        }
    },

    async handleSavePhoto() {
        const fileInput = document.getElementById('photo-file-input');
        const monthSelect = document.getElementById('photo-month-select');
        const poseSelect = document.getElementById('photo-pose-select');
        const dateInput = document.getElementById('photo-date-input');
        const weightInput = document.getElementById('photo-weight-input');
        const notesInput = document.getElementById('photo-notes-input');

        const file = fileInput.files[0];
        const preview = document.getElementById('photo-upload-preview');

        if (!file && !preview.src) {
            Utils.showToast('Please select a photo to upload', 'warning');
            return;
        }

        let dataUrl = preview.src;
        if (file) {
            dataUrl = await Utils.readFileAsDataURL(file);
        }

        const record = {
            id: Utils.generateId(),
            date: dateInput.value || Utils.getTodayDate(),
            month: parseInt(monthSelect.value),
            pose: poseSelect.value,
            weight: parseFloat(weightInput.value) || null,
            notes: notesInput.value || '',
            dataUrl: dataUrl
        };

        await StorageManager.savePhoto(record);
        MilestoneManager.awardBadge('photo_starter');
        Utils.playBeep('beep');
        Utils.showToast('Progress photo saved to secure IndexedDB!', 'success');

        // Reset form
        fileInput.value = '';
        preview.src = '';
        preview.style.display = 'none';
        notesInput.value = '';

        await this.loadAndRenderPhotos();
    },

    renderPhotoGallery() {
        const container = document.getElementById('photo-gallery-grid');
        const filterMonth = document.getElementById('photo-filter-month')?.value || 'all';

        if (!container) return;

        let photos = [...this.currentPhotos];
        if (filterMonth !== 'all') {
            photos = photos.filter(p => p.month === parseInt(filterMonth));
        }

        if (photos.length === 0) {
            container.innerHTML = `
                <div class="empty-state photo-empty-state">
                    <span>No transformation photos found. Upload your Month 0 baseline photo above!</span>
                </div>
            `;
            return;
        }

        let html = '';
        photos.forEach(p => {
            html += `
                <div class="photo-card" data-photo-id="${p.id}">
                    <div class="photo-media-wrap">
                        <img src="${p.dataUrl}" alt="Physique Photo Month ${p.month}" class="photo-img" loading="lazy">
                        <span class="photo-month-tag">Month ${p.month}</span>
                        <span class="photo-pose-tag">${p.pose}</span>
                        <button class="btn-delete-photo" onclick="PhysiqueController.deletePhoto('${p.id}')" title="Delete photo">&times;</button>
                    </div>
                    <div class="photo-info-bar">
                        <span class="photo-date">${Utils.formatDate(p.date)}</span>
                        <span class="photo-weight">${p.weight ? `${p.weight} kg` : ''}</span>
                    </div>
                    ${p.notes ? `<p class="photo-caption">${p.notes}</p>` : ''}
                </div>
            `;
        });

        container.innerHTML = html;
    },

    populateComparisonDropdowns() {
        const compSelectA = document.getElementById('compare-select-a');
        const compSelectB = document.getElementById('compare-select-b');

        if (!compSelectA || !compSelectB) return;

        if (this.currentPhotos.length < 2) {
            compSelectA.innerHTML = '<option value="">Need at least 2 photos</option>';
            compSelectB.innerHTML = '<option value="">Need at least 2 photos</option>';
            return;
        }

        let optionsA = '';
        let optionsB = '';

        this.currentPhotos.forEach((p, idx) => {
            const label = `Month ${p.month} (${p.pose}) - ${Utils.formatDate(p.date)} ${p.weight ? `[${p.weight}kg]` : ''}`;
            optionsA += `<option value="${p.id}">${label}</option>`;
            optionsB += `<option value="${p.id}">${label}</option>`;
        });

        compSelectA.innerHTML = optionsA;
        compSelectB.innerHTML = optionsB;

        // Auto select first (Month 0) and last
        if (!this.comparePhotoAId || !this.currentPhotos.find(p => p.id === this.comparePhotoAId)) {
            this.comparePhotoAId = this.currentPhotos[0].id;
        }
        if (!this.comparePhotoBId || !this.currentPhotos.find(p => p.id === this.comparePhotoBId)) {
            this.comparePhotoBId = this.currentPhotos[this.currentPhotos.length - 1].id;
        }

        compSelectA.value = this.comparePhotoAId;
        compSelectB.value = this.comparePhotoBId;
    },

    renderComparisonView() {
        const photoAContainer = document.getElementById('compare-photo-a-slot');
        const photoBContainer = document.getElementById('compare-photo-b-slot');
        const callout = document.getElementById('compare-metrics-callout');

        if (!photoAContainer || !photoBContainer) return;

        const photoA = this.currentPhotos.find(p => p.id === this.comparePhotoAId);
        const photoB = this.currentPhotos.find(p => p.id === this.comparePhotoBId);

        if (!photoA || !photoB) {
            photoAContainer.innerHTML = '<div class="compare-placeholder">Select photo</div>';
            photoBContainer.innerHTML = '<div class="compare-placeholder">Select photo</div>';
            return;
        }

        photoAContainer.innerHTML = `
            <div class="compare-card">
                <div class="compare-badge">BEFORE: Month ${photoA.month}</div>
                <img src="${photoA.dataUrl}" alt="Before photo" class="compare-img">
                <div class="compare-details">
                    <span>${Utils.formatDate(photoA.date)}</span>
                    <strong>${photoA.weight ? `${photoA.weight} kg` : ''}</strong>
                </div>
            </div>
        `;

        photoBContainer.innerHTML = `
            <div class="compare-card">
                <div class="compare-badge compare-badge-after">AFTER: Month ${photoB.month}</div>
                <img src="${photoB.dataUrl}" alt="After photo" class="compare-img">
                <div class="compare-details">
                    <span>${Utils.formatDate(photoB.date)}</span>
                    <strong>${photoB.weight ? `${photoB.weight} kg` : ''}</strong>
                </div>
            </div>
        `;

        if (callout && photoA.weight && photoB.weight) {
            const diff = Utils.round(photoB.weight - photoA.weight, 1);
            const sign = diff > 0 ? '+' : '';
            callout.innerHTML = `
                <div class="callout-pill">
                    <span>Net Weight Change:</span> 
                    <strong class="${diff <= 0 ? 'text-neon' : 'text-amber'}">${sign}${diff} kg</strong>
                </div>
            `;
        }
    },

    async deletePhoto(id) {
        if (confirm('Delete this progress photo permanently?')) {
            await StorageManager.deletePhoto(id);
            await this.loadAndRenderPhotos();
            Utils.showToast('Photo removed from storage', 'info');
        }
    }
};

window.PhysiqueController = PhysiqueController;
