// Game State
let gameState = {
    points: 0,
    totalEarned: 0,
    clickPower: 1,
    prestigeMultiplier: 1,
    upgrades: {
        clickPower: { level: 0, baseCost: 100, costMultiplier: 1.15 },
        autoClicker: { level: 0, baseCost: 500, costMultiplier: 1.15 },
        double: { level: 0, baseCost: 1000, costMultiplier: 1.15 },
        triple: { level: 0, baseCost: 5000, costMultiplier: 1.15 },
        critical: { level: 0, baseCost: 2000, costMultiplier: 1.15 },
        prestige: { level: 0, baseCost: 50000, costMultiplier: 2 }
    }
};

// Load game state from localStorage
function loadGame() {
    const saved = localStorage.getItem('yamil-clicker-save');
    if (saved) {
        try {
            gameState = JSON.parse(saved);
        } catch (e) {
            console.log('Could not load save file, starting fresh');
        }
    }
    updateUI();
}

// Save game state to localStorage
function saveGame() {
    localStorage.setItem('yamil-clicker-save', JSON.stringify(gameState));
}

// Get upgrade cost
function getUpgradeCost(upgradeName) {
    const upgrade = gameState.upgrades[upgradeName];
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
}

// Get current multiplier (from double/triple bonuses)
function getMultiplier() {
    let multiplier = 1;
    if (gameState.upgrades.double.level > 0) multiplier *= 2;
    if (gameState.upgrades.triple.level > 0) multiplier *= 3;
    return multiplier * gameState.prestigeMultiplier;
}

// Calculate per-second generation
function getPerSecond() {
    return gameState.upgrades.autoClicker.level * getMultiplier();
}

// Buy an upgrade
function buyUpgrade(upgradeName) {
    const cost = getUpgradeCost(upgradeName);

    if (gameState.points >= cost) {
        gameState.points -= cost;
        gameState.upgrades[upgradeName].level++;
        
        // Update click power based on clickPower upgrade
        if (upgradeName === 'clickPower') {
            gameState.clickPower = 1 + (gameState.upgrades.clickPower.level * 5);
        }

        // Special handling for prestige
        if (upgradeName === 'prestige') {
            prestigeReset();
        }

        saveGame();
        updateUI();
    }
}

// Prestige (reset with multiplier)
function prestigeReset() {
    if (gameState.points >= getUpgradeCost('prestige')) {
        gameState.prestigeMultiplier *= 1.5;
        gameState.points = 0;
        gameState.clickPower = 1;
        gameState.upgrades.clickPower.level = 0;
        gameState.upgrades.autoClicker.level = 0;
        gameState.upgrades.double.level = 0;
        gameState.upgrades.triple.level = 0;
        gameState.upgrades.critical.level = 0;

        saveGame();
        updateUI();
        alert('🎉 PRESTIGE ACTIVATED! New Multiplier: x' + gameState.prestigeMultiplier.toFixed(2));
    }
}

// Reset entire game
function resetGame() {
    if (confirm('⚠️ Reset the entire game? You will lose all progress!')) {
        localStorage.removeItem('yamil-clicker-save');
        gameState = {
            points: 0,
            totalEarned: 0,
            clickPower: 1,
            prestigeMultiplier: 1,
            upgrades: {
                clickPower: { level: 0, baseCost: 100, costMultiplier: 1.15 },
                autoClicker: { level: 0, baseCost: 500, costMultiplier: 1.15 },
                double: { level: 0, baseCost: 1000, costMultiplier: 1.15 },
                triple: { level: 0, baseCost: 5000, costMultiplier: 1.15 },
                critical: { level: 0, baseCost: 2000, costMultiplier: 1.15 },
                prestige: { level: 0, baseCost: 50000, costMultiplier: 2 }
            }
        };
        updateUI();
    }
}

// Click handler
function handleClick() {
    let earnings = gameState.clickPower * getMultiplier();

    // Critical hit chance
    if (gameState.upgrades.critical.level > 0) {
        const critChance = gameState.upgrades.critical.level * 0.05; // 5% per level
        if (Math.random() < critChance) {
            earnings *= 2;
            showFeedback('💥 CRITICAL HIT! +' + earnings, '#ff006e');
        } else {
            showFeedback('+' + earnings + ' Swag');
        }
    } else {
        showFeedback('+' + earnings + ' Swag');
    }

    gameState.points += earnings;
    gameState.totalEarned += earnings;
    saveGame();
    updateUI();
}

// Show feedback when clicking
function showFeedback(text, color = '#00ff88') {
    const feedback = document.getElementById('clickFeedback');
    feedback.textContent = text;
    feedback.style.color = color;
    feedback.classList.add('show');
    setTimeout(() => {
        feedback.classList.remove('show');
    }, 500);
}

// Update all UI elements
function updateUI() {
    // Update main stats
    document.getElementById('points').textContent = formatNumber(gameState.points);
    document.getElementById('totalEarned').textContent = formatNumber(gameState.totalEarned);
    document.getElementById('perClick').textContent = formatNumber(gameState.clickPower * getMultiplier());
    document.getElementById('perSecond').textContent = formatNumber(getPerSecond());

    // Update all upgrade displays
    const upgradeNames = ['clickPower', 'autoClicker', 'double', 'triple', 'critical', 'prestige'];
    upgradeNames.forEach(name => {
        const upgrade = gameState.upgrades[name];
        const cost = getUpgradeCost(name);
        const canAfford = gameState.points >= cost;

        // Update level
        document.getElementById('level-' + name).textContent = 'Lv. ' + upgrade.level;

        // Update cost
        document.getElementById('cost-' + name).textContent = formatNumber(cost);

        // Update button state
        const button = document.querySelector(`#upgrade-${name} .buy-btn`);
        button.disabled = !canAfford;
    });
}

// Format large numbers
function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num).toString();
}

// Auto-clicker passive income
function autoClick() {
    const perSecond = getPerSecond();
    if (perSecond > 0) {
        gameState.points += perSecond;
        gameState.totalEarned += perSecond;
        saveGame();
        updateUI();
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    
    // Click button event
    document.getElementById('clickButton').addEventListener('click', handleClick);

    // Auto-click every second
    setInterval(autoClick, 1000);

    // Periodically save game
    setInterval(saveGame, 5000);

    // Initial UI update
    updateUI();
};