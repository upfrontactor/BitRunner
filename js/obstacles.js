// obstacles.js — Obstacle types, spawning, and rendering

const OBSTACLE_TYPES = {
    jump: {
        action: 'jump',
        color: '#00ff88',
        glowColor: 'rgba(0, 255, 136, 0.3)',
        label: 'JUMP',
        key: ' ' // spacebar
    },
    duck: {
        action: 'duck',
        color: '#00bbff',
        glowColor: 'rgba(0, 187, 255, 0.3)',
        label: 'DUCK',
        key: 's'
    },
    kick: {
        action: 'kick',
        color: '#ff3355',
        glowColor: 'rgba(255, 51, 85, 0.3)',
        label: 'KICK',
        key: 'd'
    }
};

class Obstacle {
    constructor(x, type, mapId, groundY) {
        this.x = x;
        this.type = type;
        this.mapId = mapId;
        this.groundY = groundY;
        this.width = 40;
        this.height = type === 'duck' ? 30 : 50;
        this.cleared = false;
        this.missed = false;
        this.clearAnim = 0;
        this.warningAlpha = 0;
        this.warningDir = 1;

        // Y position based on type
        if (type === 'jump') {
            this.y = groundY + 60 - this.height; // on the ground
        } else if (type === 'duck') {
            this.y = groundY - 10; // head height — must duck under
        } else {
            this.y = groundY + 60 - this.height; // on the ground — must kick
        }
    }

    update(speed) {
        this.x -= speed;
        this.warningAlpha += 0.05 * this.warningDir;
        if (this.warningAlpha > 1) this.warningDir = -1;
        if (this.warningAlpha < 0.3) this.warningDir = 1;

        if (this.cleared) {
            this.clearAnim++;
        }
    }

    draw(ctx) {
        const typeData = OBSTACLE_TYPES[this.type];
        if (this.cleared) {
            const alpha = Math.max(0, 1 - this.clearAnim / 15);
            ctx.globalAlpha = alpha;
            const scale = 1 + this.clearAnim * 0.05;
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.scale(scale, scale);
            ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
        }

        // Glow effect
        ctx.shadowColor = typeData.color;
        ctx.shadowBlur = 15 + this.warningAlpha * 10;

        // Draw obstacle based on map theme and type
        this.drawObstacle(ctx, typeData);

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // Action label above obstacle
        if (!this.cleared) {
            ctx.globalAlpha = 0.6 + this.warningAlpha * 0.4;
            ctx.font = 'bold 10px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = typeData.color;
            ctx.fillText(typeData.label, this.x + this.width / 2, this.y - 12);
        }

        if (this.cleared) {
            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }

    drawObstacle(ctx, typeData) {
        const themes = {
            forest: this.drawForestObstacle.bind(this),
            city: this.drawCityObstacle.bind(this),
            volcano: this.drawVolcanoObstacle.bind(this),
            space: this.drawSpaceObstacle.bind(this)
        };

        (themes[this.mapId] || themes.forest)(ctx, typeData);
    }

    drawForestObstacle(ctx, typeData) {
        if (this.type === 'jump') {
            // Log
            ctx.fillStyle = '#6B4226';
            ctx.fillRect(this.x, this.y + 10, this.width, this.height - 10);
            ctx.fillStyle = '#8B5A2B';
            ctx.fillRect(this.x + 3, this.y + 13, this.width - 6, 8);
            // Colored border
            ctx.strokeStyle = typeData.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y + 10, this.width, this.height - 10);
        } else if (this.type === 'duck') {
            // Vine/branch
            ctx.fillStyle = '#4a7a2a';
            ctx.fillRect(this.x - 5, this.y, this.width + 10, 12);
            ctx.fillStyle = '#3d6622';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(this.x + i * 15, this.y + 12, 4, 8 + Math.sin(i) * 4);
            }
            ctx.strokeStyle = typeData.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 5, this.y, this.width + 10, 12);
        } else {
            // Wooden crate
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#A0782C';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);
            ctx.beginPath();
            ctx.moveTo(this.x + 4, this.y + 4);
            ctx.lineTo(this.x + this.width - 4, this.y + this.height - 4);
            ctx.moveTo(this.x + this.width - 4, this.y + 4);
            ctx.lineTo(this.x + 4, this.y + this.height - 4);
            ctx.stroke();
            ctx.strokeStyle = typeData.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }

    drawCityObstacle(ctx, typeData) {
        if (this.type === 'jump') {
            // Traffic barrier
            ctx.fillStyle = '#ff8800';
            ctx.fillRect(this.x, this.y + 15, this.width, 20);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x + 5, this.y + 20, 10, 10);
            // Posts
            ctx.fillStyle = '#666';
            ctx.fillRect(this.x + 5, this.y + 35, 5, 15);
            ctx.fillRect(this.x + this.width - 10, this.y + 35, 5, 15);
            ctx.strokeStyle = typeData.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y + 15, this.width, 20);
        } else if (this.type === 'duck') {
            // Construction beam
            ctx.fillStyle = '#999';
            ctx.fillRect(this.x - 8, this.y, this.width + 16, 10);
            ctx.fillStyle = '#ffcc00';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(this.x - 5 + i * 14, this.y, 7, 10);
            }
            ctx.strokeStyle = typeData.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 8, this.y, this.width + 16, 10);
        } else {
            // Brick wall
            ctx.fillStyle = '#994433';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#aa5544';
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 2; col++) {
                    const bx = this.x + col * 20 + (row % 2) * 10;
                    ctx.fillRect(bx + 1, this.y + row * 13 + 1, 18, 11);
                }
            }
            ctx.strokeStyle = typeData.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }

    drawVolcanoObstacle(ctx, typeData) {
        if (this.type === 'jump') {
            // Lava rock
            ctx.fillStyle = '#554';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + 5);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ff4400';
            ctx.fillRect(this.x + 12, this.y + 25, 16, 5);
            ctx.strokeStyle = typeData.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + 5);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.stroke();
        } else if (this.type === 'duck') {
            // Fire beam
            const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
            grad.addColorStop(0, '#ff2200');
            grad.addColorStop(0.5, '#ff8800');
            grad.addColorStop(1, '#ff2200');
            ctx.fillStyle = grad;
            ctx.fillRect(this.x - 10, this.y, this.width + 20, 14);
            ctx.strokeStyle = typeData.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 10, this.y, this.width + 20, 14);
        } else {
            // Boulder
            ctx.fillStyle = '#665544';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#887766';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2 - 5, this.y + this.height / 2 - 5, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = typeData.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    drawSpaceObstacle(ctx, typeData) {
        if (this.type === 'jump') {
            // Asteroid
            ctx.fillStyle = '#555566';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height - 15, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#444455';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2 + 5, this.y + this.height - 18, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = typeData.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height - 15, 18, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.type === 'duck') {
            // Laser beam
            const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
            grad.addColorStop(0, '#ff00ff');
            grad.addColorStop(0.5, '#ffffff');
            grad.addColorStop(1, '#ff00ff');
            ctx.fillStyle = grad;
            ctx.fillRect(this.x - 15, this.y + 2, this.width + 30, 8);
            ctx.strokeStyle = typeData.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 15, this.y, this.width + 30, 12);
        } else {
            // Space debris / crate
            ctx.fillStyle = '#556677';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#44aaff';
            ctx.fillRect(this.x + 8, this.y + 8, 10, 10);
            ctx.fillRect(this.x + 22, this.y + 30, 10, 10);
            ctx.strokeStyle = typeData.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }

    getHitbox() {
        if (this.type === 'duck') {
            return {
                x: this.x - 5,
                y: this.y,
                width: this.width + 10,
                height: 30
            };
        }
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class ObstacleManager {
    constructor() {
        this.obstacles = [];
        this.spawnTimer = 0;
    }

    reset() {
        this.obstacles = [];
        this.spawnTimer = 0;
    }

    spawnObstacle(canvasWidth, mapId, groundY) {
        const types = ['jump', 'duck', 'kick'];
        const type = types[Math.floor(Math.random() * types.length)];
        const obs = new Obstacle(canvasWidth + 50, type, mapId, groundY);
        this.obstacles.push(obs);
    }

    update(speed, spawnGap, canvasWidth, mapId, groundY) {
        this.spawnTimer += speed;
        if (this.spawnTimer >= spawnGap) {
            this.spawnTimer = 0;
            this.spawnObstacle(canvasWidth, mapId, groundY);
        }

        this.obstacles.forEach(obs => obs.update(speed));
        // Remove off-screen cleared obstacles
        this.obstacles = this.obstacles.filter(obs => {
            if (obs.cleared && obs.clearAnim > 20) return false;
            if (obs.x < -100) return false;
            return true;
        });
    }

    draw(ctx) {
        this.obstacles.forEach(obs => obs.draw(ctx));
    }

    getActiveObstacles() {
        return this.obstacles.filter(obs => !obs.cleared && !obs.missed);
    }
}
