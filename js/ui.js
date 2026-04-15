// ui.js — Menu screens, HUD, transitions

const UI = {
    currentScreen: 'main-menu',
    pendingMode: null, // 'story' or 'endless'
    selectedMap: null,

    showScreen(screenId, mode) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

        // Track mode if provided
        if (mode) this.pendingMode = mode;

        // Special handling for certain screens
        if (screenId === 'map-select') {
            this.renderMapSelect();
        }
        if (screenId === 'shop-screen') {
            Shop.renderShop();
        }

        // Show target screen
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenId;
        }
    },

    renderMapSelect() {
        const grid = document.getElementById('map-grid');
        grid.innerHTML = '';

        Object.values(MAPS).forEach(map => {
            const card = document.createElement('div');
            card.className = `map-card ${map.cssClass}`;

            const name = document.createElement('div');
            name.className = 'map-name';
            name.textContent = map.name;

            const desc = document.createElement('div');
            desc.className = 'map-desc';
            desc.textContent = map.desc;

            card.appendChild(name);
            card.appendChild(desc);

            // Show high score for endless mode
            if (this.pendingMode === 'endless') {
                const hs = Storage.getHighScore(map.id);
                if (hs > 0) {
                    const hsEl = document.createElement('div');
                    hsEl.className = 'map-highscore';
                    hsEl.textContent = `Best: ${Math.floor(hs)}m`;
                    card.appendChild(hsEl);
                }
            }

            card.onclick = () => {
                this.selectedMap = map.id;
                if (this.pendingMode === 'story') {
                    this.showScreen('difficulty-select');
                } else {
                    Game.startEndless();
                }
            };

            grid.appendChild(card);
        });
    },

    showHUD(mode, mapName) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const hud = document.getElementById('hud');
        hud.classList.add('active');

        document.getElementById('hud-mode').textContent = mode === 'story' ? 'STORY' : 'ENDLESS';
        document.getElementById('hud-map').textContent = mapName;
    },

    updateHUD(distance, extra) {
        document.getElementById('hud-distance').textContent = `${Math.floor(distance)}m`;
        document.getElementById('hud-score').textContent = extra || '';
    },

    showDeath(distance, xpEarned) {
        document.getElementById('death-distance').textContent = `Distance: ${Math.floor(distance)}m`;
        document.getElementById('death-xp').textContent = `+${xpEarned} XP`;
        this.showScreen('death-screen');
    },

    showComplete(distance, xpEarned, bonusXP) {
        document.getElementById('complete-distance').textContent = `Distance: ${Math.floor(distance)}m`;
        document.getElementById('complete-xp').textContent = `+${xpEarned} XP`;
        if (bonusXP > 0) {
            document.getElementById('complete-bonus').textContent = `Perfect bonus: +${bonusXP} XP`;
            document.getElementById('complete-bonus').classList.remove('hidden');
        } else {
            document.getElementById('complete-bonus').classList.add('hidden');
        }
        this.showScreen('complete-screen');
    },

    showEndlessGameOver(distance, xpEarned, isNewRecord) {
        document.getElementById('endless-distance').textContent = `Distance: ${Math.floor(distance)}m`;
        document.getElementById('endless-highscore').textContent = `Best: ${Math.floor(Storage.getHighScore(UI.selectedMap))}m`;
        document.getElementById('endless-xp').textContent = `+${xpEarned} XP`;

        const recordEl = document.getElementById('endless-new-record');
        if (isNewRecord) {
            recordEl.classList.remove('hidden');
        } else {
            recordEl.classList.add('hidden');
        }
        this.showScreen('endless-over-screen');
    }
};
