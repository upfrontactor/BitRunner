// player.js — Player class with states and character rendering
const CHARACTERS = {
    runner: {
        name: 'Runner',
        cost: 0,
        bodyColor: '#2288dd',
        bodyLight: '#44aaff',
        bodyDark: '#1166aa',
        accentColor: '#ff4444',
        skinColor: '#ffcc88',
        skinDark: '#ddaa66',
        hairColor: '#553322',
        eyeColor: '#ffffff',
        pupilColor: '#111111',
        desc: 'The default hero'
    },
    ninja: {
        name: 'Ninja',
        cost: 200,
        bodyColor: '#1a1a2e',
        bodyLight: '#2a2a44',
        bodyDark: '#0e0e1a',
        accentColor: '#cc0000',
        skinColor: '#ddcc99',
        skinDark: '#bbaa77',
        hairColor: '#1a1a2e',
        eyeColor: '#ffffff',
        pupilColor: '#111111',
        desc: 'Silent and swift'
    },
    robot: {
        name: 'Robot',
        cost: 400,
        bodyColor: '#7788aa',
        bodyLight: '#99aacc',
        bodyDark: '#556688',
        accentColor: '#44ddff',
        skinColor: '#aabbcc',
        skinDark: '#8899aa',
        hairColor: '#556677',
        eyeColor: '#ff3333',
        pupilColor: '#ff0000',
        desc: 'Built to run'
    },
    knight: {
        name: 'Knight',
        cost: 600,
        bodyColor: '#aa7733',
        bodyLight: '#cc9944',
        bodyDark: '#885522',
        accentColor: '#cccccc',
        skinColor: '#ffddaa',
        skinDark: '#ddbb88',
        hairColor: '#aa8844',
        eyeColor: '#ffffff',
        pupilColor: '#334455',
        desc: 'Armored runner'
    },
    alien: {
        name: 'Alien',
        cost: 1000,
        bodyColor: '#227744',
        bodyLight: '#33aa55',
        bodyDark: '#115533',
        accentColor: '#ff00ff',
        skinColor: '#55ee77',
        skinDark: '#33cc55',
        hairColor: '#227744',
        eyeColor: '#111111',
        pupilColor: '#ff00ff',
        desc: 'Out of this world'
    }
};

class Player {
    constructor(x, groundY) {
        this.x = x;
        this.groundY = groundY;
        this.y = groundY;
        this.width = 40;
        this.height = 60;
        this.state = 'running'; // running, jumping, ducking, kicking, dying
        this.stateTimer = 0;
        this.jumpVelocity = 0;
        this.jumpHeight = -14;
        this.gravity = 0.65;
        this.animFrame = 0;
        this.animTimer = 0;
        this.characterId = Storage.getSelectedCharacter();
        this.particles = [];
        this.actionResult = null; // { type: 'success'|'fail', timer: 0 }
    }

    getCharData() {
        return CHARACTERS[this.characterId] || CHARACTERS.runner;
    }

    jump() {
        if (this.state === 'dying') return false;
        if (this.state === 'jumping') return false;
        this.state = 'jumping';
        this.jumpVelocity = this.jumpHeight;
        this.stateTimer = 0;
        return true;
    }

    duck() {
        if (this.state === 'dying') return false;
        if (this.state === 'jumping') return false;
        this.state = 'ducking';
        this.stateTimer = 0;
        return true;
    }

    standUp() {
        if (this.state === 'ducking') {
            this.state = 'running';
        }
    }

    kick() {
        if (this.state === 'dying') return false;
        this.state = 'kicking';
        this.stateTimer = 20; // frames of kick animation
        return true;
    }

    die() {
        if (this.state === 'dying') return;
        this.state = 'dying';
        this.stateTimer = 60;
        // spawn death particles
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 3,
                life: 40 + Math.random() * 20,
                maxLife: 60,
                color: Math.random() > 0.5 ? '#ff3355' : '#ff6644',
                size: 3 + Math.random() * 5
            });
        }
    }

    showActionResult(type) {
        this.actionResult = { type, timer: 25 };
        if (type === 'success') {
            for (let i = 0; i < 8; i++) {
                this.particles.push({
                    x: this.x + this.width / 2,
                    y: this.y + this.height / 2,
                    vx: (Math.random() - 0.5) * 6,
                    vy: -Math.random() * 5 - 2,
                    life: 20 + Math.random() * 15,
                    maxLife: 35,
                    color: '#00ff88',
                    size: 2 + Math.random() * 3
                });
            }
        }
    }

    update() {
        // Animation
        this.animTimer++;
        if (this.animTimer > 6) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }

        // State logic
        if (this.state === 'jumping') {
            this.y += this.jumpVelocity;
            this.jumpVelocity += this.gravity;
            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.state = 'running';
                this.jumpVelocity = 0;
            }
        } else if (this.state === 'ducking') {
            // Stay ducking until key is released (handled by standUp())
        } else if (this.state === 'kicking') {
            this.stateTimer--;
            if (this.stateTimer <= 0) {
                this.state = 'running';
            }
        } else if (this.state === 'dying') {
            this.stateTimer--;
        }

        // Action result timer
        if (this.actionResult) {
            this.actionResult.timer--;
            if (this.actionResult.timer <= 0) {
                this.actionResult = null;
            }
        }

        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life--;
            return p.life > 0;
        });
    }

    draw(ctx) {
        const c = this.getCharData();

        // Draw particles
        this.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });
        ctx.globalAlpha = 1;

        if (this.state === 'dying') {
            ctx.globalAlpha = this.stateTimer / 60;
        }

        const drawX = this.x;
        let drawY = this.y;
        let drawH = this.height;
        const cx = drawX + this.width / 2; // center x

        if (this.state === 'ducking') {
            drawH = 30;
            drawY = this.groundY + (this.height - drawH);
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(cx, this.groundY + this.height + 2, 20, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // === LEGS ===
        const legW = 8, legBaseH = 14;
        ctx.fillStyle = c.bodyDark;
        if (this.state === 'running') {
            const t = this.animFrame * Math.PI / 2;
            const l1 = Math.sin(t) * 8;
            const l2 = Math.sin(t + Math.PI) * 8;
            // Back leg
            this.drawRoundRect(ctx, cx - 11, drawY + drawH - 2, legW, legBaseH + l2, 3);
            // Shoe
            ctx.fillStyle = c.accentColor;
            this.drawRoundRect(ctx, cx - 13, drawY + drawH + legBaseH + l2 - 4, legW + 4, 5, 2);
            // Front leg
            ctx.fillStyle = c.bodyDark;
            this.drawRoundRect(ctx, cx + 3, drawY + drawH - 2, legW, legBaseH + l1, 3);
            ctx.fillStyle = c.accentColor;
            this.drawRoundRect(ctx, cx + 1, drawY + drawH + legBaseH + l1 - 4, legW + 4, 5, 2);
        } else if (this.state === 'jumping') {
            ctx.fillStyle = c.bodyDark;
            this.drawRoundRect(ctx, cx - 12, drawY + drawH - 4, legW, 10, 3);
            this.drawRoundRect(ctx, cx + 4, drawY + drawH - 4, legW, 10, 3);
            ctx.fillStyle = c.accentColor;
            this.drawRoundRect(ctx, cx - 14, drawY + drawH + 4, legW + 4, 4, 2);
            this.drawRoundRect(ctx, cx + 2, drawY + drawH + 4, legW + 4, 4, 2);
        } else if (this.state === 'ducking') {
            ctx.fillStyle = c.bodyDark;
            this.drawRoundRect(ctx, cx - 12, drawY + drawH - 1, 10, 6, 2);
            this.drawRoundRect(ctx, cx + 2, drawY + drawH - 1, 10, 6, 2);
            ctx.fillStyle = c.accentColor;
            this.drawRoundRect(ctx, cx - 14, drawY + drawH + 3, 12, 4, 2);
            this.drawRoundRect(ctx, cx + 0, drawY + drawH + 3, 12, 4, 2);
        } else if (this.state === 'kicking') {
            ctx.fillStyle = c.bodyDark;
            this.drawRoundRect(ctx, cx - 11, drawY + drawH - 2, legW, legBaseH, 3);
            ctx.fillStyle = c.accentColor;
            this.drawRoundRect(ctx, cx - 13, drawY + drawH + legBaseH - 4, legW + 4, 5, 2);
            // Kick leg extended forward
            const kickProg = this.stateTimer > 10 ? (20 - this.stateTimer) / 10 : this.stateTimer / 10;
            const kickLen = kickProg * 28;
            ctx.fillStyle = c.bodyDark;
            ctx.save();
            ctx.translate(cx + 6, drawY + drawH + 4);
            ctx.rotate(-0.3);
            this.drawRoundRect(ctx, 0, -4, kickLen + 8, legW, 3);
            // Kick shoe
            ctx.fillStyle = c.accentColor;
            this.drawRoundRect(ctx, kickLen + 4, -5, 10, legW + 2, 3);
            ctx.restore();
            // Kick effect lines
            if (kickProg > 0.5) {
                ctx.strokeStyle = c.accentColor;
                ctx.lineWidth = 2;
                ctx.globalAlpha = (ctx.globalAlpha || 1) * (kickProg - 0.5) * 2;
                for (let i = 0; i < 3; i++) {
                    const angle = -0.4 + i * 0.4;
                    const ex = cx + 6 + Math.cos(angle) * (kickLen + 20);
                    const ey = drawY + drawH + Math.sin(angle) * (kickLen + 10);
                    ctx.beginPath();
                    ctx.moveTo(ex, ey);
                    ctx.lineTo(ex + Math.cos(angle) * 10, ey + Math.sin(angle) * 10);
                    ctx.stroke();
                }
                ctx.globalAlpha = this.state === 'dying' ? this.stateTimer / 60 : 1;
            }
        }

        // === BODY (torso) ===
        const torsoTop = drawY + (this.state === 'ducking' ? 4 : 14);
        const torsoH = this.state === 'ducking' ? drawH - 6 : drawH - 14;
        const torsoW = 28;
        const torsoX = cx - torsoW / 2;

        // Main torso
        ctx.fillStyle = c.bodyColor;
        this.drawRoundRect(ctx, torsoX, torsoTop, torsoW, torsoH, 4);

        // Light side highlight
        ctx.fillStyle = c.bodyLight;
        this.drawRoundRect(ctx, torsoX + 1, torsoTop + 1, 8, torsoH - 2, 3);

        // Belt / accent stripe
        ctx.fillStyle = c.accentColor;
        const beltY = torsoTop + torsoH - 10;
        this.drawRoundRect(ctx, torsoX - 1, beltY, torsoW + 2, 5, 2);

        // === ARMS ===
        if (this.state !== 'ducking') {
            const armW = 7, armH = 18;
            const armSwing = Math.sin(this.animFrame * Math.PI / 2) * 12;
            // Back arm
            ctx.fillStyle = c.bodyDark;
            ctx.save();
            ctx.translate(cx - torsoW / 2 - 2, torsoTop + 6);
            ctx.rotate((-armSwing) * Math.PI / 180);
            this.drawRoundRect(ctx, -armW + 2, 0, armW, armH - 2, 3);
            ctx.fillStyle = c.skinDark;
            this.drawRoundRect(ctx, -armW + 3, armH - 5, armW - 2, 6, 2);
            ctx.restore();
            // Front arm
            ctx.fillStyle = c.bodyColor;
            ctx.save();
            ctx.translate(cx + torsoW / 2 + 2, torsoTop + 6);
            ctx.rotate((armSwing) * Math.PI / 180);
            this.drawRoundRect(ctx, -2, 0, armW, armH - 2, 3);
            ctx.fillStyle = c.skinColor;
            this.drawRoundRect(ctx, -1, armH - 5, armW - 2, 6, 2);
            ctx.restore();
        }

        // === HEAD ===
        const headR = this.state === 'ducking' ? 9 : 11;
        const headX = this.state === 'ducking' ? cx + 6 : cx;
        const headY = this.state === 'ducking' ? drawY + 6 : drawY + 8;

        // Neck
        ctx.fillStyle = c.skinDark;
        this.drawRoundRect(ctx, headX - 4, headY + headR - 4, 8, 8, 2);

        // Head circle
        ctx.fillStyle = c.skinColor;
        ctx.beginPath();
        ctx.arc(headX, headY, headR, 0, Math.PI * 2);
        ctx.fill();

        // Hair (top of head)
        ctx.fillStyle = c.hairColor;
        ctx.beginPath();
        ctx.arc(headX, headY - 2, headR, Math.PI, Math.PI * 2);
        ctx.fill();

        // Eyes
        const eyeLookX = this.state === 'kicking' ? 3 : 1;
        // Eye whites
        ctx.fillStyle = c.eyeColor;
        ctx.beginPath();
        ctx.ellipse(headX + eyeLookX + 1, headY - 1, 3.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        if (this.state !== 'ducking') {
            ctx.beginPath();
            ctx.ellipse(headX - 5 + eyeLookX, headY - 1, 3, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        // Pupils
        ctx.fillStyle = c.pupilColor;
        ctx.beginPath();
        ctx.arc(headX + eyeLookX + 2, headY - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        if (this.state !== 'ducking') {
            ctx.beginPath();
            ctx.arc(headX - 4 + eyeLookX, headY - 1, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mouth (small)
        ctx.fillStyle = c.skinDark;
        if (this.state === 'dying') {
            // O mouth
            ctx.beginPath();
            ctx.arc(headX + 2, headY + 5, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.state === 'kicking') {
            // Grin
            ctx.beginPath();
            ctx.arc(headX + 2, headY + 3, 4, 0.1, Math.PI - 0.1);
            ctx.stroke();
        } else {
            ctx.fillRect(headX + 1, headY + 4, 4, 1.5);
        }

        // Character-specific details
        this.drawCharacterDetails(ctx, c, headX, headY, headR, torsoX, torsoTop, torsoW, torsoH);

        ctx.globalAlpha = 1;

        // Action result indicator
        if (this.actionResult) {
            const alpha = this.actionResult.timer / 25;
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            if (this.actionResult.type === 'success') {
                ctx.fillStyle = '#00ff88';
                ctx.fillText('✓', cx, drawY - 12 - (25 - this.actionResult.timer) * 0.8);
            }
            ctx.globalAlpha = 1;
        }
    }

    drawCharacterDetails(ctx, c, hx, hy, hr, tx, ty, tw, th) {
        const charId = this.characterId;
        if (charId === 'ninja') {
            // Mask over lower face
            ctx.fillStyle = c.bodyColor;
            ctx.beginPath();
            ctx.arc(hx, hy + 2, hr - 2, 0.2, Math.PI - 0.2);
            ctx.fill();
            // Headband
            ctx.fillStyle = c.accentColor;
            ctx.fillRect(hx - hr - 3, hy - 4, hr * 2 + 6, 4);
            // Trailing band
            ctx.fillStyle = c.accentColor;
            ctx.beginPath();
            ctx.moveTo(hx - hr - 3, hy - 4);
            ctx.quadraticCurveTo(hx - hr - 15, hy - 8, hx - hr - 18, hy + 2);
            ctx.lineWidth = 3;
            ctx.strokeStyle = c.accentColor;
            ctx.stroke();
        } else if (charId === 'robot') {
            // Antenna
            ctx.strokeStyle = '#aabbcc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(hx, hy - hr);
            ctx.lineTo(hx, hy - hr - 10);
            ctx.stroke();
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(hx, hy - hr - 11, 3, 0, Math.PI * 2);
            ctx.fill();
            // Panel lines on body
            ctx.strokeStyle = c.accentColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(tx + 5, ty + 8, tw - 10, 12);
            // Chest light
            ctx.fillStyle = c.accentColor;
            ctx.beginPath();
            ctx.arc(tx + tw / 2, ty + 14, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(tx + tw / 2, ty + 14, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (charId === 'knight') {
            // Helmet visor
            ctx.fillStyle = c.accentColor;
            ctx.beginPath();
            ctx.moveTo(hx - hr + 2, hy - hr + 2);
            ctx.lineTo(hx + hr - 2, hy - hr + 2);
            ctx.lineTo(hx + hr + 2, hy - 3);
            ctx.lineTo(hx - hr - 2, hy - 3);
            ctx.closePath();
            ctx.fill();
            // Helmet crest
            ctx.fillStyle = c.accentColor;
            ctx.fillRect(hx - 2, hy - hr - 6, 4, 8);
            // Shoulder pads
            ctx.fillStyle = c.accentColor;
            ctx.beginPath();
            ctx.ellipse(tx - 2, ty + 4, 7, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(tx + tw + 2, ty + 4, 7, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (charId === 'alien') {
            // Antennae
            ctx.strokeStyle = c.skinColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(hx - 4, hy - hr);
            ctx.quadraticCurveTo(hx - 10, hy - hr - 14, hx - 8, hy - hr - 16);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(hx + 4, hy - hr);
            ctx.quadraticCurveTo(hx + 10, hy - hr - 14, hx + 8, hy - hr - 16);
            ctx.stroke();
            // Antenna tips
            ctx.fillStyle = c.accentColor;
            ctx.beginPath();
            ctx.arc(hx - 8, hy - hr - 16, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(hx + 8, hy - hr - 16, 3, 0, Math.PI * 2);
            ctx.fill();
            // Big alien eyes (override normal eyes)
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.ellipse(hx - 4, hy - 1, 5, 4, -0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(hx + 5, hy - 1, 5, 4, 0.15, 0, Math.PI * 2);
            ctx.fill();
            // Eye shine
            ctx.fillStyle = c.accentColor;
            ctx.beginPath();
            ctx.arc(hx - 2, hy - 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(hx + 7, hy - 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawRoundRect(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
    }

    getHitbox() {
        if (this.state === 'ducking') {
            return {
                x: this.x + 5,
                y: this.groundY + this.height - 30 + 5,
                width: this.width - 10,
                height: 25
            };
        }
        if (this.state === 'jumping') {
            return {
                x: this.x + 5,
                y: this.y + 10,
                width: this.width - 10,
                height: this.height - 10
            };
        }
        return {
            x: this.x + 5,
            y: this.y + 10,
            width: this.width - 10,
            height: this.height - 10
        };
    }
}
