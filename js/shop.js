// shop.js — Character shop and XP system

const Shop = {
    init() {
        this.renderShop();
    },

    renderShop() {
        const grid = document.getElementById('shop-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const xp = Storage.getXP();
        const unlocked = Storage.getUnlockedCharacters();
        const selected = Storage.getSelectedCharacter();

        document.getElementById('shop-xp').textContent = xp;

        Object.entries(CHARACTERS).forEach(([id, char]) => {
            const card = document.createElement('div');
            card.className = 'shop-card';

            const isUnlocked = unlocked.includes(id);
            const isSelected = selected === id;
            const canAfford = xp >= char.cost;

            // Character preview canvas
            const preview = document.createElement('canvas');
            preview.width = 80;
            preview.height = 100;
            preview.className = 'char-preview';
            this.drawCharacterPreview(preview, char);

            const name = document.createElement('div');
            name.className = 'char-name';
            name.textContent = char.name;

            const cost = document.createElement('div');
            cost.className = 'char-cost';
            cost.textContent = char.cost === 0 ? 'FREE' : `${char.cost} XP`;

            const btn = document.createElement('button');
            btn.className = 'btn-buy';

            if (isSelected) {
                btn.textContent = 'SELECTED';
                btn.className += ' selected';
            } else if (isUnlocked) {
                btn.textContent = 'SELECT';
                btn.className += ' owned';
                btn.onclick = () => {
                    Storage.setSelectedCharacter(id);
                    this.renderShop();
                };
            } else if (canAfford) {
                btn.textContent = 'BUY';
                btn.onclick = () => {
                    const currentXP = Storage.getXP();
                    if (currentXP >= char.cost) {
                        Storage.setXP(currentXP - char.cost);
                        Storage.unlockCharacter(id);
                        Storage.setSelectedCharacter(id);
                        this.renderShop();
                    }
                };
            } else {
                btn.textContent = 'LOCKED';
                btn.className += ' locked';
            }

            card.appendChild(preview);
            card.appendChild(name);
            card.appendChild(cost);
            card.appendChild(btn);
            grid.appendChild(card);
        });
    },

    roundRect(ctx, x, y, w, h, r) {
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
    },

    drawCharacterPreview(canvas, char) {
        const ctx = canvas.getContext('2d');
        const cx = 40, cy = 24;

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 80, 100);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(cx, 90, 16, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs (side view — one behind other)
        ctx.fillStyle = char.bodyDark;
        this.roundRect(ctx, cx - 4, cy + 50, 9, 16, 3);
        ctx.fillStyle = char.bodyColor;
        this.roundRect(ctx, cx - 1, cy + 48, 9, 14, 3);
        // Shoes
        ctx.fillStyle = char.accentColor;
        this.roundRect(ctx, cx - 6, cy + 63, 12, 5, 2);
        this.roundRect(ctx, cx - 2, cy + 59, 12, 5, 2);

        // Torso (narrow side view)
        ctx.fillStyle = char.bodyColor;
        this.roundRect(ctx, cx - 8, cy + 16, 18, 36, 4);
        ctx.fillStyle = char.bodyLight;
        this.roundRect(ctx, cx + 3, cy + 17, 6, 34, 3);
        // Belt
        ctx.fillStyle = char.accentColor;
        this.roundRect(ctx, cx - 9, cy + 42, 20, 5, 2);

        // Arm (single, side view)
        ctx.fillStyle = char.bodyColor;
        this.roundRect(ctx, cx - 2, cy + 20, 7, 18, 3);
        ctx.fillStyle = char.skinColor;
        this.roundRect(ctx, cx - 1, cy + 35, 6, 6, 2);

        // Neck
        ctx.fillStyle = char.skinDark;
        this.roundRect(ctx, cx, cy + 10, 8, 8, 2);

        // Head (side profile facing right)
        const hx = cx + 4;
        ctx.fillStyle = char.skinColor;
        ctx.beginPath();
        ctx.arc(hx, cy, 12, 0, Math.PI * 2);
        ctx.fill();

        // Hair (top and back)
        ctx.fillStyle = char.hairColor;
        ctx.beginPath();
        ctx.arc(hx, cy - 2, 12, Math.PI * 0.8, Math.PI * 2.1);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx - 2, cy - 1, 12, Math.PI * 0.6, Math.PI * 1.4);
        ctx.fill();

        // Nose
        ctx.fillStyle = char.skinDark;
        ctx.beginPath();
        ctx.moveTo(hx + 10, cy - 1);
        ctx.lineTo(hx + 14, cy + 2);
        ctx.lineTo(hx + 10, cy + 3);
        ctx.closePath();
        ctx.fill();

        // Single eye (facing right)
        ctx.fillStyle = char.eyeColor;
        ctx.beginPath();
        ctx.ellipse(hx + 6, cy - 1, 3.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = char.pupilColor;
        ctx.beginPath();
        ctx.arc(hx + 7.5, cy - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.fillStyle = char.skinDark;
        ctx.fillRect(hx + 5, cy + 4, 3, 1.5);
    }
};
