// game.js — Main game engine

const Game = {
    canvas: null,
    ctx: null,
    running: false,
    mode: null, // 'story' or 'endless'
    difficulty: null,
    mapId: null,
    player: null,
    obstacleManager: null,
    background: null,
    distance: 0,
    speed: 0,
    frameCount: 0,
    groundY: 0,
    mistakes: 0,
    lastAction: null,
    gameOver: false,
    gameComplete: false,
    pendingDeath: false,
    deathTimer: 0,
    progressBar: null,
    storyLength: 0,
    currentSpawnGap: 0,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', (e) => this.handleInput(e));
        window.addEventListener('keyup', (e) => {
            if ((e.key === 's' || e.key === 'S') && this.player) {
                this.player.standUp();
            }
        });

        // Prevent spacebar scrolling
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') e.preventDefault();
        });
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.groundY = this.canvas.height - 100;
    },

    startStory(difficulty) {
        this.mode = 'story';
        this.difficulty = DIFFICULTIES[difficulty];
        this.mapId = UI.selectedMap;
        this.storyLength = MAPS[this.mapId].storyLength;
        this.speed = this.difficulty.baseSpeed;
        this.currentSpawnGap = this.difficulty.spawnGap;
        this.startGame();
    },

    startEndless() {
        this.mode = 'endless';
        this.difficulty = { ...ENDLESS_DIFFICULTY };
        this.mapId = UI.selectedMap;
        this.speed = this.difficulty.baseSpeed;
        this.currentSpawnGap = this.difficulty.spawnGap;
        this.startGame();
    },

    startGame() {
        this.distance = 0;
        this.frameCount = 0;
        this.mistakes = 0;
        this.gameOver = false;
        this.gameComplete = false;
        this.pendingDeath = false;
        this.deathTimer = 0;
        this.lastAction = null;

        this.player = new Player(80, this.groundY);
        this.obstacleManager = new ObstacleManager();
        this.background = new Background(this.mapId, this.canvas.width, this.canvas.height);

        UI.showHUD(this.mode, MAPS[this.mapId].name);

        // Add progress bar for story mode
        this.removeProgressBar();
        if (this.mode === 'story') {
            this.createProgressBar();
        }

        this.running = true;
        this.gameLoop();
    },

    createProgressBar() {
        const container = document.createElement('div');
        container.className = 'progress-bar-container';
        container.id = 'progress-bar';
        const fill = document.createElement('div');
        fill.className = 'progress-bar-fill';
        fill.id = 'progress-fill';
        container.appendChild(fill);
        document.getElementById('game-container').appendChild(container);
        this.progressBar = container;
    },

    removeProgressBar() {
        const existing = document.getElementById('progress-bar');
        if (existing) existing.remove();
        this.progressBar = null;
    },

    retry() {
        if (this.mode === 'story') {
            this.startGame();
        } else {
            this.startGame();
        }
    },

    handleInput(e) {
        if (!this.running || this.gameOver || this.gameComplete) return;

        let action = null;
        if (e.code === 'Space' || e.key === ' ') {
            action = 'jump';
        } else if (e.key === 's' || e.key === 'S') {
            action = 'duck';
        } else if (e.key === 'd' || e.key === 'D') {
            action = 'kick';
        }

        if (!action) return;

        // Find the nearest obstacle in reaction zone
        const reactionZone = this.mode === 'story' ? this.difficulty.reactionZone : ENDLESS_DIFFICULTY.reactionZone;
        const activeObs = this.obstacleManager.getActiveObstacles();

        let targetObs = null;
        let closestDist = Infinity;

        activeObs.forEach(obs => {
            const dist = obs.x - this.player.x;
            if (dist > -20 && dist < reactionZone + 60 && dist < closestDist) {
                closestDist = dist;
                targetObs = obs;
            }
        });

        if (targetObs) {
            if (targetObs.type === action) {
                // Correct action!
                targetObs.cleared = true;
                this.player.showActionResult('success');
                if (action === 'jump') this.player.jump();
                else if (action === 'duck') this.player.duck();
                else if (action === 'kick') this.player.kick();
            } else {
                // Wrong action — DIE
                this.triggerDeath();
            }
        } else {
            // No obstacle nearby, perform action anyway (cosmetic)
            if (action === 'jump') this.player.jump();
            else if (action === 'duck') this.player.duck();
            else if (action === 'kick') this.player.kick();
        }
    },

    triggerDeath() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.player.die();
        this.deathTimer = 60;
        this.pendingDeath = true;
    },

    checkMissedObstacles() {
        const activeObs = this.obstacleManager.getActiveObstacles();
        activeObs.forEach(obs => {
            // If obstacle has passed the player without being cleared
            if (obs.x + obs.width < this.player.x - 10 && !obs.cleared && !obs.missed) {
                obs.missed = true;
                this.triggerDeath();
            }
        });
    },

    checkCollisions() {
        const playerHitbox = this.player.getHitbox();
        const activeObs = this.obstacleManager.getActiveObstacles();

        activeObs.forEach(obs => {
            if (obs.cleared || obs.missed) return;
            const obsHitbox = obs.getHitbox();

            // AABB collision
            if (playerHitbox.x < obsHitbox.x + obsHitbox.width &&
                playerHitbox.x + playerHitbox.width > obsHitbox.x &&
                playerHitbox.y < obsHitbox.y + obsHitbox.height &&
                playerHitbox.y + playerHitbox.height > obsHitbox.y) {

                // Player is colliding with obstacle — they needed to act but didn't (or acted wrong)
                if (!obs.cleared) {
                    obs.missed = true;
                    this.triggerDeath();
                }
            }
        });
    },

    update() {
        this.frameCount++;

        // Speed management
        if (this.mode === 'story') {
            this.speed = Math.min(this.difficulty.maxSpeed, this.speed + this.difficulty.speedIncrease);
        } else {
            this.speed = Math.min(this.difficulty.maxSpeed, this.speed + this.difficulty.speedIncrease);
            this.currentSpawnGap = Math.max(this.difficulty.minSpawnGap, this.currentSpawnGap - this.difficulty.spawnGapDecrease);
        }

        // Distance
        this.distance += this.speed * 0.1;

        // Update systems
        this.background.update(this.speed);
        this.player.update();

        if (!this.gameOver && !this.gameComplete) {
            const gap = this.mode === 'story' ? this.difficulty.spawnGap : this.currentSpawnGap;
            this.obstacleManager.update(this.speed, gap, this.canvas.width, this.mapId, this.groundY);
            this.checkMissedObstacles();
            this.checkCollisions();
        } else {
            // Still update obstacles so they slide off screen
            this.obstacleManager.obstacles.forEach(obs => obs.update(this.speed * 0.3));
        }

        // Story mode completion
        if (this.mode === 'story' && this.distance >= this.storyLength && !this.gameOver && !this.gameComplete) {
            this.gameComplete = true;
            this.completeLevel();
        }

        // Update HUD
        if (this.mode === 'endless') {
            UI.updateHUD(this.distance, `Speed: ${this.speed.toFixed(1)}`);
        } else {
            UI.updateHUD(this.distance);
            // Update progress bar
            const fill = document.getElementById('progress-fill');
            if (fill) {
                fill.style.width = `${Math.min(100, (this.distance / this.storyLength) * 100)}%`;
            }
        }

        // Death transition
        if (this.pendingDeath) {
            this.deathTimer--;
            if (this.deathTimer <= 0) {
                this.running = false;
                this.pendingDeath = false;
                this.removeProgressBar();
                this.endGame(false);
            }
        }
    },

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.background.draw(this.ctx, this.frameCount);
        this.obstacleManager.draw(this.ctx);
        this.player.draw(this.ctx);
    },

    gameLoop() {
        if (!this.running && !this.pendingDeath) return;

        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    },

    completeLevel() {
        this.running = false;
        this.removeProgressBar();

        const baseXP = this.difficulty.xpReward;
        const bonusXP = this.mistakes === 0 ? Math.floor(baseXP * 0.5) : 0;
        const totalXP = baseXP + bonusXP;

        Storage.addXP(totalXP);
        UI.showComplete(this.distance, baseXP, bonusXP);
    },

    endGame(completed) {
        if (completed) return; // handled by completeLevel

        let xpEarned = 0;

        if (this.mode === 'endless') {
            xpEarned = Math.floor(this.distance / 100);
            Storage.addXP(xpEarned);
            const isNewRecord = Storage.setHighScore(this.mapId, this.distance);
            UI.showEndlessGameOver(this.distance, xpEarned, isNewRecord);
        } else {
            // Story mode death — small consolation XP
            xpEarned = Math.floor(this.distance / 200);
            Storage.addXP(xpEarned);
            UI.showDeath(this.distance, xpEarned);
        }
    }
};

// Initialize on load
window.addEventListener('load', () => {
    Game.init();
    Shop.init();
});
