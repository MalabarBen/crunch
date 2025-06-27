document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const MIN_REPS = 120;
    const MAX_REPS = 250;
    const REPS_PER_ROUND = 10;
    const DEGREES_PER_REP = 360 / REPS_PER_ROUND;
    const FUTURE_DAYS_TO_SHOW = 10;
    // UPDATED: Changed icons from invalid SVG literals to valid image tags pointing to PNGs.
const EXERCISES = [
  { id:'push-ups',     name:'Push-ups',     icon:'<img src="assets/push-ups.png" alt="Push-ups">' },
  { id:'squats',       name:'Squats',       icon:'<img src="assets/squats.png"   alt="Squats">' },
  { id:'sit-ups',      name:'Sit-ups',      icon:'<img src="assets/sit-up.png"   alt="Sit-ups">' },
  { id:'punches',      name:'Punches',      icon:'<img src="assets/punches.png"  alt="Punches">' },
  { id:'tricep-dips',  name:'Dips',  icon:'<img src="assets/dips.png"      alt="Dips">' },
  { id:'step-ups',     name:'Step-ups',     icon:'<img src="assets/steps.png"     alt="Steps">' }
];

    
    // --- DOM ELEMENTS ---
    const dayHeader = document.getElementById('day-header');
    const totalBankedSummary = document.getElementById('total-banked-summary');
    const bankButton = document.getElementById('bank-button');
    const exerciseBreakdownContainer = document.getElementById('exercise-breakdown');
    const navButtons = document.querySelectorAll('.nav-button');
    const pages = document.querySelectorAll('.page');
    const statsScrollContainer = document.getElementById('stats-scroll-container');
    const statsDaysWrapper = document.getElementById('stats-days-wrapper');
    const statsDetailView = document.getElementById('stats-detail-view');
    const inputWheel = document.getElementById('input-wheel');
    const wheelHandle = document.querySelector('.wheel-handle');
    const wheelRepsDisplay = document.getElementById('wheel-reps-display');

    // --- APP STATE & WHEEL STATE ---
    let state = { history: {}, selectedExercise: null };
    let isDragging = false, wheelCenter = { x: 0, y: 0 }, totalRotation = 0, lastAngle = 0, repsFromWheel = 0;

    // --- DATE & HELPER FUNCTIONS ---
    const getDateString = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const formatDate = (dateString, options = { year: 'numeric', month: 'long', day: 'numeric' }) => { const d = new Date(`${dateString}T00:00:00`); return d.toLocaleDateString(undefined, options); };
    function loadState() { const s = localStorage.getItem('fitnessChallengeState'); if (s) state = JSON.parse(s); }
    function saveState() { localStorage.setItem('fitnessChallengeState', JSON.stringify(state)); }
    
    function setupNewDay(dateString) {
        if (state.history[dateString]) return;
        const totalTarget = Math.floor(Math.random() * (MAX_REPS - MIN_REPS + 1)) + MIN_REPS;
        const exercises = {};
        EXERCISES.forEach(ex => { exercises[ex.id] = { banked: 0 }; });
        state.history[dateString] = { totalTarget, totalBanked: 0, exercises };
    }

    function ensureFutureDays() {
        for (let i = 1; i <= FUTURE_DAYS_TO_SHOW; i++) {
            setupNewDay(getDateString(i));
        }
        saveState();
    }
    
    // --- ANIMATION ---
    function triggerConfetti() {
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
        setTimeout(() => confetti({ particleCount: 100, spread: 120, origin: { y: 0.7 }, angle: 120 }), 100);
        setTimeout(() => confetti({ particleCount: 100, spread: 120, origin: { y: 0.7 }, angle: 60 }), 200);
    }

    // --- UI RENDERING & INTERACTION ---
    function updateWheelUI(angle, reps) {
        wheelHandle.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        inputWheel.style.background = `conic-gradient(var(--primary-accent) ${angle % 360}deg, var(--light-gray) ${angle % 360}deg)`;
        wheelRepsDisplay.textContent = reps;
        if (!state.selectedExercise) {
            bankButton.textContent = 'Select an Exercise';
            bankButton.disabled = true;
        } else if (reps > 0) {
            bankButton.textContent = `Bank ${reps} Reps`;
            bankButton.disabled = false;
        } else {
            bankButton.textContent = `Turn the wheel`;
            bankButton.disabled = true;
        }
    }

    function renderBankPage(todayString) {
        const todayData = state.history[todayString];
        if (!todayData) return;
        const isComplete = todayData.totalBanked >= todayData.totalTarget;
        dayHeader.classList.toggle('day-complete', isComplete);
        totalBankedSummary.parentElement.classList.toggle('day-complete', isComplete);
        dayHeader.textContent = formatDate(todayString);
        totalBankedSummary.textContent = `${todayData.totalBanked} of ${todayData.totalTarget}`;
        exerciseBreakdownContainer.innerHTML = '';
        EXERCISES.forEach(exInfo => {
            const bankedReps = todayData.exercises[exInfo.id]?.banked || 0;
            const item = document.createElement('div');
            item.className = 'exercise-item';
            if (state.selectedExercise === exInfo.id) item.classList.add('selected');
            item.innerHTML = `<div class="exercise-icon">${exInfo.icon}</div><div class="exercise-name">${exInfo.name}</div><div class="exercise-banked-count">${bankedReps}</div>`;
            item.addEventListener('click', () => { 
                state.selectedExercise = exInfo.id; 
                totalRotation = 0; // Reset wheel on new selection
                repsFromWheel = 0;
                renderBankPage(todayString); 
                updateWheelUI(0, 0); 
            });
            exerciseBreakdownContainer.appendChild(item);
        });
    }

    function renderStatsDetail(date) {
        const dayData = state.history[date];
        if (!dayData || dayData.totalBanked === 0) {
            statsDetailView.innerHTML = `<p class="placeholder">No reps were banked on this day. Click another day.</p>`;
            return;
        }
        statsDetailView.innerHTML = `<h3 class="detail-header">${formatDate(date)}</h3><ul class="detail-list"></ul>`;
        const list = statsDetailView.querySelector('.detail-list');
        Object.entries(dayData.exercises).filter(([, data]) => data.banked > 0).forEach(([id, data]) => {
            const exInfo = EXERCISES.find(e => e.id === id);
            list.innerHTML += `<li class="detail-list-item"><span>${exInfo.name}</span><span class="reps">${data.banked} reps</span></li>`;
        });
    }
    
    function formatStatsLabel(dateString, todayString) {
        if (dateString === todayString) return "Today";
        if (dateString === getDateString(-1)) return "Yesterday";
        if (dateString === getDateString(1)) return "Tomorrow";
        return formatDate(dateString, { weekday: 'short', day: 'numeric' });
    }

    function renderStatsPage(todayString) {
        statsDaysWrapper.innerHTML = '';
        statsDetailView.innerHTML = `<p class="placeholder">Click a day's bar to see details.</p>`;
        
        const sortedDates = Object.keys(state.history).sort();
        
        sortedDates.forEach(date => {
            const dayData = state.history[date];
            if (!dayData) return; // Add guard for missing data
            const item = document.createElement('div');
            item.className = 'stats-day-item';

            const percentage = Math.min(100, (dayData.totalBanked / dayData.totalTarget) * 100);

            item.innerHTML = `
                <div class="stats-target-label">${dayData.totalTarget}</div>
                <div class="stats-bar-container">
                    <div class="stats-bar-banked" style="height: ${percentage}%"></div>
                </div>
                <div class="stats-day-label">${formatStatsLabel(date, todayString)}</div>
            `;

            if (new Date(date) > new Date(todayString)) {
                item.classList.add('future-day');
            } else {
                item.classList.add('interactive');
                if (date === todayString) item.classList.add('today');
                item.addEventListener('click', () => {
                    document.querySelectorAll('.stats-day-item').forEach(el => el.classList.remove('selected-stat'));
                    item.classList.add('selected-stat');
                    renderStatsDetail(date)
                });
            }
            statsDaysWrapper.appendChild(item);
        });

        setTimeout(() => {
            const todayElement = statsDaysWrapper.querySelector('.today');
            if (todayElement) {
                const scrollLeft = todayElement.offsetLeft - (statsScrollContainer.offsetWidth / 2) + (todayElement.offsetWidth / 2);
                statsScrollContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                todayElement.click(); // Automatically show today's details
            }
        }, 100);
    }

    function handleBankReps(todayString) {
        if (repsFromWheel <= 0 || !state.selectedExercise) return;
        const todayData = state.history[todayString];
        const bankedBefore = todayData.totalBanked;
        if (!todayData.exercises[state.selectedExercise]) { todayData.exercises[state.selectedExercise] = { banked: 0 }; }
        todayData.exercises[state.selectedExercise].banked += repsFromWheel;
        todayData.totalBanked += repsFromWheel;
        if (bankedBefore < todayData.totalTarget && todayData.totalBanked >= todayData.totalTarget) { triggerConfetti(); }
        saveState();
        totalRotation = 0; repsFromWheel = 0;
        updateWheelUI(0, 0);
        renderBankPage(todayString);
    }
    
    // --- DRAG HANDLERS & NAVIGATION ---
    const getWheelCenter = () => { const rect = inputWheel.getBoundingClientRect(); wheelCenter.x = rect.left + rect.width / 2; wheelCenter.y = rect.top + rect.height / 2; };
    function handleDragStart(e) { e.preventDefault(); isDragging = true; wheelHandle.style.cursor = 'grabbing'; getWheelCenter(); const p = e.touches ? e.touches[0] : e; const dx = p.clientX - wheelCenter.x; const dy = p.clientY - wheelCenter.y; lastAngle = (Math.atan2(dy, dx) * (180 / Math.PI) + 450) % 360; }
    function handleDragMove(e) { if (!isDragging) return; e.preventDefault(); const p = e.touches ? e.touches[0] : e; const dx = p.clientX - wheelCenter.x; const dy = p.clientY - wheelCenter.y; const currentAngle = (Math.atan2(dy, dx) * (180 / Math.PI) + 450) % 360; let angleDiff = currentAngle - lastAngle; if (angleDiff > 180) angleDiff -= 360; if (angleDiff < -180) angleDiff += 360; totalRotation = Math.max(0, totalRotation + angleDiff); repsFromWheel = Math.floor(totalRotation / DEGREES_PER_REP); updateWheelUI(totalRotation, repsFromWheel); lastAngle = currentAngle; }
    function handleDragEnd() { if (!isDragging) return; isDragging = false; wheelHandle.style.cursor = 'grab'; }
    function handleNavClick(e, todayString) { const pageId = e.currentTarget.dataset.page; pages.forEach(p => p.classList.remove('active')); document.getElementById(pageId).classList.add('active'); navButtons.forEach(b => b.classList.remove('active')); e.currentTarget.classList.add('active'); if (pageId === 'stats-page') renderStatsPage(todayString); }

    // --- INITIALIZATION ---
    function init() {
        if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW reg failed', err));
        const todayString = getDateString();
        loadState();
        setupNewDay(todayString);
        ensureFutureDays();
        bankButton.addEventListener('click', () => handleBankReps(todayString));
        navButtons.forEach(button => button.addEventListener('click', (e) => handleNavClick(e, todayString)));
        inputWheel.addEventListener('mousedown', handleDragStart); document.addEventListener('mousemove', handleDragMove); document.addEventListener('mouseup', handleDragEnd);
        inputWheel.addEventListener('touchstart', handleDragStart, { passive: false }); document.addEventListener('touchmove', handleDragMove, { passive: false }); document.addEventListener('touchend', handleDragEnd);
        renderBankPage(todayString);
        updateWheelUI(0, 0);
    }

    init();
});
