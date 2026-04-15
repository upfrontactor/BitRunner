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

        // Legs
        ctx.fillStyle = char.bodyDark;
        this.roundRect(ctx, cx - 10, cy + 50, 8, 16, 3);
        this.roundRect(ctx, cx + 2, cy + 50, 8, 13, 3);
        // Shoes
        ctx.fillStyle = char.accentColor;
        this.roundRect(ctx, cx - 12, cy + 63, 12, 5, 2);
        this.roundRect(ctx, cx + 0, cy + 60, 12, 5, 2);

        // Body
        ctx.fillStyle = char.bodyColor;
        this.roundRect(ctx, cx - 14, cy + 16, 28, 36, 4);
        ctx.fillStyle = char.bodyLight;
        this.roundRect(ctx, cx - 13, cy + 17, 8, 34, 3);
        // Belt
        ctx.fillStyle = char.accentColor;
        this.roundRect(ctx, cx - 15, cy + 42, 30, 5, 2);

        // Arms
        ctx.fillStyle = char.bodyDark;
        this.roundRect(ctx, cx - 21, cy + 18, 7, 18, 3);
        ctx.fillStyle = char.bodyColor;
        this.roundRect(ctx, cx + 14, cy + 18, 7, 20, 3);
        // Hands
        ctx.fillStyle = char.skinColor;
        this.roundRect(ctx, cx - 20, cy + 34, 6, 6, 2);
        this.roundRect(ctx, cx + 15, cy + 36, 6, 6, 2);

        // Neck
        ctx.fillStyle = char.skinDark;
        this.roundRect(ctx, cx - 4, cy + 10, 8, 8, 2);

        // Head
        ctx.fillStyle = char.skinColor;
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = char.hairColor;
        ctx.beginPath();
        ctx.arc(cx, cy - 2, 12, Math.PI, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = char.eyeColor;
        ctx.beginPath();
        ctx.ellipse(cx - 4, cy - 1, 3, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 4, cy - 1, 3.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = char.pupilColor;
        ctx.beginPath();
        ctx.arc(cx - 3, cy - 1, 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 5, cy - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.fillStyle = char.skinDark;
        ctx.fillRect(cx + 1, cy + 4, 4, 1.5);
    }
};
