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
    checkpoint: 0,
    checkpointSpeed: 0,
    checkpointReached: false,
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
        this.checkpoint = 0;
        this.checkpointSpeed = 0;
        this.checkpointReached = false;
        this.startGame();
    },

    startEndless() {
        this.mode = 'endless';
        this.difficulty = { ...ENDLESS_DIFFICULTY };
        this.mapId = UI.selectedMap;
        this.speed = this.difficulty.baseSpeed;
        this.currentSpawnGap = this.difficulty.spawnGap;
        this.checkpoint = 0;
        this.checkpointSpeed = 0;
        this.checkpointReached = false;
        this.startGame();
    },

    startGame() {
        this.distance = this.checkpoint;
        this.frameCount = 0;
        this.mistakes = 0;
        this.gameOver = false;
        this.gameComplete = false;
        this.pendingDeath = false;
        this.deathTimer = 0;
        this.lastAction = null;
        if (this.checkpoint === 0) {
            this.checkpointReached = false;
        }

        this.player = new Player(80, this.groundY);
        this.obstacleManager = new ObstacleManager();
        this.background = new Background(this.mapId, this.canvas.width, this.canvas.height);

        // Restore speed if restarting from checkpoint
        if (this.checkpoint > 0) {
            this.speed = this.checkpointSpeed;
        }

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
            if (dist > -40 && dist < reactionZone + 80 && dist < closestDist) {
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
            const overlapsX = playerHitbox.x < obsHitbox.x + obsHitbox.width &&
                              playerHitbox.x + playerHitbox.width > obsHitbox.x;

            // If player is overlapping the obstacle's x range while doing the correct action, auto-clear it
            if (overlapsX) {
                if ((obs.type === 'jump' && this.player.inAir) ||
                    (obs.type === 'duck' && this.player.state === 'ducking') ||
                    (obs.type === 'kick' && this.player.state === 'kicking')) {
                    obs.cleared = true;
                    this.player.showActionResult('success');
                    return;
                }
            }

            // AABB collision — wrong action or no action
            if (overlapsX &&
                playerHitbox.y < obsHitbox.y + obsHitbox.height &&
                playerHitbox.y + playerHitbox.height > obsHitbox.y) {
                obs.missed = true;
                this.triggerDeath();
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

        // Checkpoint at halfway (story mode only)
        if (this.mode === 'story' && !this.checkpointReached && this.distance >= this.storyLength / 2) {
            this.checkpoint = this.distance;
            this.checkpointSpeed = this.speed;
            this.checkpointReached = true;
            this.showCheckpointBanner();
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

    checkpointBannerTimer: 0,

    showCheckpointBanner() {
        this.checkpointBannerTimer = 120; // 2 seconds at 60fps
    },

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.background.draw(this.ctx, this.frameCount);
        this.obstacleManager.draw(this.ctx);
        this.player.draw(this.ctx);

        // Checkpoint banner
        if (this.checkpointBannerTimer > 0) {
            this.checkpointBannerTimer--;
            const alpha = this.checkpointBannerTimer > 90 ? (120 - this.checkpointBannerTimer) / 30 :
                          this.checkpointBannerTimer < 30 ? this.checkpointBannerTimer / 30 : 1;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);
            this.ctx.font = '18px "Press Start 2P", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#ffaa00';
            this.ctx.fillText('CHECKPOINT REACHED!', this.canvas.width / 2, this.canvas.height / 2 + 7);
            this.ctx.globalAlpha = 1;
        }
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

// Title screen animated background
const TitleBG = {
    canvas: null,
    ctx: null,
    stars: [],
    particles: [],
    runners: [],
    frame: 0,

    init() {
        this.canvas = document.getElementById('title-bg');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Generate stars
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 0.5 + Math.random() * 2,
                speed: 0.1 + Math.random() * 0.3,
                twinkle: Math.random() * Math.PI * 2
            });
        }

        // Floating particles
        for (let i = 0; i < 25; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 1 + Math.random() * 3,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: -0.3 - Math.random() * 0.5,
                color: ['#ff6600', '#ff3300', '#ffaa00', '#00bbff', '#00ff88'][Math.floor(Math.random() * 5)],
                alpha: 0.3 + Math.random() * 0.5
            });
        }

        // Silhouette runners in the background
        for (let i = 0; i < 3; i++) {
            this.runners.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height - 60 - Math.random() * 20,
                speed: 1.5 + Math.random() * 2,
                size: 0.5 + Math.random() * 0.3,
                animFrame: Math.floor(Math.random() * 4)
            });
        }

        this.animate();
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    animate() {
        this.frame++;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#020010');
        grad.addColorStop(0.4, '#0a0025');
        grad.addColorStop(0.7, '#150030');
        grad.addColorStop(1, '#1a0a15');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Stars
        this.stars.forEach(s => {
            const twinkle = Math.sin(this.frame * 0.02 + s.twinkle) * 0.5 + 0.5;
            ctx.globalAlpha = 0.3 + twinkle * 0.7;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(s.x, s.y, s.size, s.size);
            s.x -= s.speed;
            if (s.x < -5) s.x = w + 5;
        });
        ctx.globalAlpha = 1;

        // Ground
        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(0, h - 50, w, 50);
        ctx.fillStyle = '#1a1a33';
        ctx.fillRect(0, h - 52, w, 3);

        // Ground details
        ctx.fillStyle = '#1a1a33';
        for (let x = (this.frame % 20); x < w; x += 20) {
            ctx.fillRect(x, h - 42, 8, 2);
        }

        // Floating particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha * (0.5 + Math.sin(this.frame * 0.03) * 0.5);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
            if (p.x < -10) p.x = w + 10;
            if (p.x > w + 10) p.x = -10;
        });
        ctx.globalAlpha = 1;

        // Silhouette runners
        this.runners.forEach(r => {
            if (this.frame % 8 === 0) r.animFrame = (r.animFrame + 1) % 4;
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#ff6600';
            const s = r.size;
            const rx = r.x, ry = r.y;
            // Head
            ctx.beginPath();
            ctx.arc(rx + 10 * s, ry - 25 * s, 6 * s, 0, Math.PI * 2);
            ctx.fill();
            // Body
            ctx.fillRect(rx + 4 * s, ry - 18 * s, 12 * s, 20 * s);
            // Legs
            const legOff = Math.sin(r.animFrame * Math.PI / 2) * 5 * s;
            ctx.fillRect(rx + 5 * s, ry + 2 * s, 5 * s, 10 * s + legOff);
            ctx.fillRect(rx + 11 * s, ry + 2 * s, 5 * s, 10 * s - legOff);
            ctx.globalAlpha = 1;

            r.x += r.speed;
            if (r.x > w + 40) r.x = -40;
        });

        this.animId = requestAnimationFrame(() => this.animate());
    },

    stop() {
        if (this.animId) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
    },

    start() {
        if (!this.animId && this.canvas) {
            this.animate();
        }
    }
};

// Initialize on load
window.addEventListener('load', () => {
    Game.init();
    Shop.init();
    TitleBG.init();
});
