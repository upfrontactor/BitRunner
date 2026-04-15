// storage.js — LocalStorage save/load system
const Storage = {
    KEYS: {
        XP: 'obstacleRunner_xp',
        UNLOCKED: 'obstacleRunner_unlocked',
        SELECTED: 'obstacleRunner_selected',
        HIGHSCORES: 'obstacleRunner_highscores'
    },

    getXP() {
        return parseInt(localStorage.getItem(this.KEYS.XP)) || 0;
    },

    setXP(amount) {
        localStorage.setItem(this.KEYS.XP, amount);
    },

    addXP(amount) {
        const current = this.getXP();
        this.setXP(current + amount);
        return current + amount;
    },

    getUnlockedCharacters() {
        const data = localStorage.getItem(this.KEYS.UNLOCKED);
        return data ? JSON.parse(data) : ['runner'];
    },

    unlockCharacter(id) {
        const unlocked = this.getUnlockedCharacters();
        if (!unlocked.includes(id)) {
            unlocked.push(id);
            localStorage.setItem(this.KEYS.UNLOCKED, JSON.stringify(unlocked));
        }
    },

    getSelectedCharacter() {
        return localStorage.getItem(this.KEYS.SELECTED) || 'runner';
    },

    setSelectedCharacter(id) {
        localStorage.setItem(this.KEYS.SELECTED, id);
    },

    getHighScores() {
        const data = localStorage.getItem(this.KEYS.HIGHSCORES);
        return data ? JSON.parse(data) : {};
    },

    getHighScore(mapId) {
        const scores = this.getHighScores();
        return scores[mapId] || 0;
    },

    setHighScore(mapId, distance) {
        const scores = this.getHighScores();
        if (!scores[mapId] || distance > scores[mapId]) {
            scores[mapId] = distance;
            localStorage.setItem(this.KEYS.HIGHSCORES, JSON.stringify(scores));
            return true; // new record
        }
        return false;
    }
};
