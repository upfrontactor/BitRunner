// levels.js — Map definitions, backgrounds, and difficulty settings

const MAPS = {
    forest: {
        id: 'forest',
        name: 'Forest',
        desc: 'Trees, logs & vines',
        cssClass: 'map-forest',
        bgColors: ['#0d1a0d', '#162816', '#1e3a1e'],
        groundColor: '#2d5a1e',
        groundAccent: '#3d7a2e',
        skyGradient: ['#0a1a0a', '#1a3a1a'],
        elements: {
            trees: true,
            bushes: true,
            clouds: true
        },
        storyLength: 3000 // distance units to complete
    },
    city: {
        id: 'city',
        name: 'City',
        desc: 'Cars, barriers & steel',
        cssClass: 'map-city',
        bgColors: ['#0f0f1a', '#1a1a2e', '#252540'],
        groundColor: '#333344',
        groundAccent: '#444466',
        skyGradient: ['#0a0a1a', '#1a1a3a'],
        elements: {
            buildings: true,
            streetLights: true,
            clouds: false
        },
        storyLength: 3500
    },
    volcano: {
        id: 'volcano',
        name: 'Volcano',
        desc: 'Lava, fire & boulders',
        cssClass: 'map-volcano',
        bgColors: ['#1a0a0a', '#2a1010', '#3a1515'],
        groundColor: '#3a2020',
        groundAccent: '#5a3030',
        skyGradient: ['#1a0505', '#3a1010'],
        elements: {
            volcanoes: true,
            embers: true,
            clouds: false
        },
        storyLength: 4000
    },
    space: {
        id: 'space',
        name: 'Space',
        desc: 'Asteroids, lasers & debris',
        cssClass: 'map-space',
        bgColors: ['#050510', '#0a0a20', '#101030'],
        groundColor: '#222244',
        groundAccent: '#333366',
        skyGradient: ['#020208', '#0a0a20'],
        elements: {
            stars: true,
            nebula: true,
            planets: true
        },
        storyLength: 4500
    }
};

const DIFFICULTIES = {
    easy: {
        name: 'Easy',
        baseSpeed: 3,
        maxSpeed: 6,
        spawnGap: 350,
        speedIncrease: 0.0003,
        xpReward: 50,
        reactionZone: 80
    },
    medium: {
        name: 'Medium',
        baseSpeed: 4.5,
        maxSpeed: 9,
        spawnGap: 270,
        speedIncrease: 0.0005,
        xpReward: 100,
        reactionZone: 60
    },
    hard: {
        name: 'Hard',
        baseSpeed: 6,
        maxSpeed: 12,
        spawnGap: 200,
        speedIncrease: 0.0008,
        xpReward: 200,
        reactionZone: 45
    }
};

const ENDLESS_DIFFICULTY = {
    baseSpeed: 3.5,
    maxSpeed: 15,
    spawnGap: 300,
    minSpawnGap: 140,
    speedIncrease: 0.001,
    spawnGapDecrease: 0.02,
    reactionZone: 65
};

class Background {
    constructor(mapId, canvasWidth, canvasHeight) {
        this.map = MAPS[mapId];
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.layers = [];
        this.groundY = canvasHeight - 100;
        this.generateLayers();
    }

    generateLayers() {
        // Layer 0: far background elements
        this.layers.push({ elements: this.generateFarElements(), speed: 0.2, offset: 0 });
        // Layer 1: mid elements
        this.layers.push({ elements: this.generateMidElements(), speed: 0.5, offset: 0 });
        // Layer 2: near elements
        this.layers.push({ elements: this.generateNearElements(), speed: 0.8, offset: 0 });
    }

    generateFarElements() {
        const elements = [];
        const mapEl = this.map.elements;

        if (mapEl.clouds) {
            for (let i = 0; i < 6; i++) {
                elements.push({
                    type: 'cloud',
                    x: Math.random() * this.canvasWidth * 2,
                    y: 30 + Math.random() * 80,
                    w: 60 + Math.random() * 80,
                    h: 20 + Math.random() * 15
                });
            }
        }
        if (mapEl.stars) {
            for (let i = 0; i < 60; i++) {
                elements.push({
                    type: 'star',
                    x: Math.random() * this.canvasWidth * 2,
                    y: Math.random() * (this.groundY - 50),
                    size: 1 + Math.random() * 2,
                    twinkle: Math.random() * Math.PI * 2
                });
            }
        }
        if (mapEl.nebula) {
            for (let i = 0; i < 3; i++) {
                elements.push({
                    type: 'nebula',
                    x: Math.random() * this.canvasWidth * 2,
                    y: 50 + Math.random() * 100,
                    r: 40 + Math.random() * 60,
                    color: ['#330066', '#660033', '#003366'][i]
                });
            }
        }
        return elements;
    }

    generateMidElements() {
        const elements = [];
        const mapEl = this.map.elements;

        if (mapEl.trees) {
            for (let i = 0; i < 8; i++) {
                elements.push({
                    type: 'tree',
                    x: i * 200 + Math.random() * 80,
                    h: 80 + Math.random() * 60,
                    w: 30 + Math.random() * 20
                });
            }
        }
        if (mapEl.buildings) {
            for (let i = 0; i < 6; i++) {
                elements.push({
                    type: 'building',
                    x: i * 250 + Math.random() * 80,
                    h: 100 + Math.random() * 120,
                    w: 60 + Math.random() * 40
                });
            }
        }
        if (mapEl.volcanoes) {
            for (let i = 0; i < 3; i++) {
                elements.push({
                    type: 'volcano',
                    x: i * 500 + Math.random() * 200,
                    h: 120 + Math.random() * 80
                });
            }
        }
        if (mapEl.planets) {
            for (let i = 0; i < 2; i++) {
                elements.push({
                    type: 'planet',
                    x: 200 + i * 600 + Math.random() * 200,
                    y: 60 + Math.random() * 80,
                    r: 20 + Math.random() * 30,
                    color: ['#884422', '#226688'][i]
                });
            }
        }
        return elements;
    }

    generateNearElements() {
        const elements = [];
        const mapEl = this.map.elements;

        if (mapEl.bushes) {
            for (let i = 0; i < 12; i++) {
                elements.push({
                    type: 'bush',
                    x: i * 150 + Math.random() * 60,
                    w: 20 + Math.random() * 25,
                    h: 10 + Math.random() * 12
                });
            }
        }
        if (mapEl.streetLights) {
            for (let i = 0; i < 6; i++) {
                elements.push({
                    type: 'streetLight',
                    x: i * 300 + Math.random() * 100
                });
            }
        }
        if (mapEl.embers) {
            for (let i = 0; i < 15; i++) {
                elements.push({
                    type: 'ember',
                    x: Math.random() * this.canvasWidth * 2,
                    y: this.groundY - 20 - Math.random() * 100,
                    vy: -0.5 - Math.random(),
                    size: 2 + Math.random() * 3,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }
        return elements;
    }

    update(speed) {
        this.layers.forEach(layer => {
            layer.offset -= speed * layer.speed;
        });
    }

    draw(ctx, frameCount) {
        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
        skyGrad.addColorStop(0, this.map.skyGradient[0]);
        skyGrad.addColorStop(1, this.map.skyGradient[1]);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.canvasWidth, this.groundY);

        // Draw parallax layers
        this.layers.forEach(layer => {
            ctx.save();
            layer.elements.forEach(el => {
                const drawX = ((el.x + layer.offset) % (this.canvasWidth * 2) + this.canvasWidth * 2) % (this.canvasWidth * 2) - this.canvasWidth * 0.3;
                this.drawElement(ctx, el, drawX, frameCount);
            });
            ctx.restore();
        });

        // Ground
        ctx.fillStyle = this.map.groundColor;
        ctx.fillRect(0, this.groundY + 60, this.canvasWidth, this.canvasHeight - this.groundY);

        // Ground line
        ctx.fillStyle = this.map.groundAccent;
        ctx.fillRect(0, this.groundY + 58, this.canvasWidth, 4);

        // Ground texture
        ctx.fillStyle = this.map.groundAccent;
        for (let x = (Math.floor(layer0Offset(this)) % 20); x < this.canvasWidth; x += 20) {
            ctx.fillRect(x, this.groundY + 65, 8, 2);
        }
    }

    drawElement(ctx, el, x, frame) {
        switch (el.type) {
            case 'cloud':
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.beginPath();
                ctx.ellipse(x + el.w / 2, el.y, el.w / 2, el.h / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'star':
                const twinkle = Math.sin(frame * 0.03 + el.twinkle) * 0.5 + 0.5;
                ctx.fillStyle = `rgba(255,255,255,${0.3 + twinkle * 0.7})`;
                ctx.fillRect(x, el.y, el.size, el.size);
                break;

            case 'nebula':
                ctx.globalAlpha = 0.15;
                const nGrad = ctx.createRadialGradient(x, el.y, 0, x, el.y, el.r);
                nGrad.addColorStop(0, el.color);
                nGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = nGrad;
                ctx.beginPath();
                ctx.arc(x, el.y, el.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                break;

            case 'tree':
                // Trunk
                ctx.fillStyle = '#3a2a1a';
                ctx.fillRect(x + el.w / 2 - 5, this.groundY + 60 - el.h * 0.4, 10, el.h * 0.4);
                // Canopy
                ctx.fillStyle = '#1a4a1a';
                ctx.beginPath();
                ctx.moveTo(x, this.groundY + 60 - el.h * 0.4);
                ctx.lineTo(x + el.w / 2, this.groundY + 60 - el.h);
                ctx.lineTo(x + el.w, this.groundY + 60 - el.h * 0.4);
                ctx.closePath();
                ctx.fill();
                break;

            case 'building':
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(x, this.groundY + 60 - el.h, el.w, el.h);
                // Windows
                ctx.fillStyle = '#ffee88';
                for (let wy = 0; wy < el.h - 20; wy += 20) {
                    for (let wx = 8; wx < el.w - 8; wx += 15) {
                        if (Math.random() > 0.3) {
                            ctx.globalAlpha = 0.4 + Math.random() * 0.4;
                            ctx.fillRect(x + wx, this.groundY + 60 - el.h + 10 + wy, 8, 10);
                        }
                    }
                }
                ctx.globalAlpha = 1;
                break;

            case 'volcano':
                ctx.fillStyle = '#2a1515';
                ctx.beginPath();
                ctx.moveTo(x - 60, this.groundY + 60);
                ctx.lineTo(x, this.groundY + 60 - el.h);
                ctx.lineTo(x + 60, this.groundY + 60);
                ctx.closePath();
                ctx.fill();
                // Lava glow at top
                ctx.fillStyle = 'rgba(255, 68, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(x, this.groundY + 60 - el.h, 15, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'planet':
                ctx.fillStyle = el.color;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(x, el.y, el.r, 0, Math.PI * 2);
                ctx.fill();
                // Ring
                ctx.strokeStyle = el.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(x, el.y, el.r * 1.5, el.r * 0.3, 0.3, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
                break;

            case 'bush':
                ctx.fillStyle = '#2a5a2a';
                ctx.beginPath();
                ctx.ellipse(x + el.w / 2, this.groundY + 58, el.w / 2, el.h, 0, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'streetLight':
                ctx.fillStyle = '#444';
                ctx.fillRect(x, this.groundY + 20, 4, 40);
                ctx.fillRect(x - 6, this.groundY + 18, 16, 5);
                // Light glow
                ctx.fillStyle = 'rgba(255, 220, 100, 0.1)';
                ctx.beginPath();
                ctx.moveTo(x - 2, this.groundY + 23);
                ctx.lineTo(x - 15, this.groundY + 58);
                ctx.lineTo(x + 19, this.groundY + 58);
                ctx.lineTo(x + 6, this.groundY + 23);
                ctx.closePath();
                ctx.fill();
                break;

            case 'ember':
                const phase = Math.sin(frame * 0.05 + el.phase);
                const ey = el.y + phase * 10;
                ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, ${0.5 + phase * 0.3})`;
                ctx.fillRect(x, ey, el.size, el.size);
                break;
        }
    }
}

function layer0Offset(bg) {
    return bg.layers[0] ? bg.layers[0].offset : 0;
}
