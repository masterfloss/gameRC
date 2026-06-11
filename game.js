// ============================================
// D&D RPG - COMPLETE OOP VERSION
// With proper D&D data: HP, Mana, Power, Gold, Progress, Enemies, Allies
// ============================================

const SERVER_URL = "https://eurosigdoc.pythonanywhere.com";

// ============================================
// PLAYER IDENTIFICATION SYSTEM
// ============================================
class PlayerIdentity {
    constructor() {
        this.playerId = this.loadOrCreateId();
        this.playerName = this.loadOrCreateName();
    }
    
    loadOrCreateId() {
        let id = localStorage.getItem("dnd_player_id");
        if (!id) {
            id = this.generateUniqueId();
            localStorage.setItem("dnd_player_id", id);
            console.log("🆕 New player ID generated:", id);
        } else {
            console.log("🆔 Existing player ID loaded:", id);
        }
        return id;
    }
    
    generateUniqueId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const hash = this.simpleHash(timestamp + random + navigator.userAgent);
        return `${timestamp}_${hash}`;
    }
    
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    
    loadOrCreateName() {
        let name = localStorage.getItem("dnd_player_name");
        if (!name) {
            name = prompt("⚔️ Welcome Hero! Enter your name:", "Hero_" + Math.floor(Math.random() * 1000));
            if (!name || name.trim() === "") {
                name = "Hero_" + Math.floor(Math.random() * 1000);
            }
            localStorage.setItem("dnd_player_name", name);
            console.log("📝 New player name set:", name);
        }
        return name;
    }
    
    updateName() {
        const newName = prompt("Enter your new name:", this.playerName);
        if (newName && newName.trim() !== "") {
            this.playerName = newName.trim();
            localStorage.setItem("dnd_player_name", this.playerName);
            console.log("📝 Player name updated to:", this.playerName);
            return true;
        }
        return false;
    }
    
    getPlayerId() { return this.playerId; }
    getPlayerName() { return this.playerName; }
}

// ============================================
// SERVER COMMUNICATION SYSTEM
// ============================================
class ServerComm {
    constructor(identity) {
        this.identity = identity;
    }
    
    send(action, gameData) {
        const params = new URLSearchParams({
            player_id: this.identity.getPlayerId(),
            player_name: this.identity.getPlayerName(),
            action: action,
            score: gameData.progress,
            turn: gameData.totalEnemiesDefeated,
            gold: gameData.gold,
            enemies_defeated: gameData.totalEnemiesDefeated,
            allies: gameData.alliesList,
            class_type: gameData.classType,
            hp: gameData.currentHp,
            mana: gameData.currentMana,
            power: gameData.power,
            rank: gameData.rank
        });
        
        const url = `${SERVER_URL}/submit?${params.toString()}`;
        
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📡 SENDING TO SERVER:");
        console.log("   Player ID:", this.identity.getPlayerId());
        console.log("   Player Name:", this.identity.getPlayerName());
        console.log("   Action:", action);
        console.log("   Score:", gameData.progress + "%");
        console.log("   Enemies Defeated:", gameData.totalEnemiesDefeated);
        console.log("   Gold:", gameData.gold);
        console.log("   Allies:", gameData.alliesList);
        console.log("   Class:", gameData.classType);
        console.log("   HP:", gameData.currentHp);
        console.log("   Mana:", gameData.currentMana);
        console.log("   Power:", gameData.power);
        console.log("   Rank:", gameData.rank);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        // Send to server (simple GET)
        fetch(url, { method: 'GET', mode: 'no-cors' })
            .then(() => console.log("✅ Request sent"))
            .catch(err => console.log("❌ Error:", err));
        
        // Backup with Image
        new Image().src = url;
    }
}

// ============================================
// CHARACTER CLASS (Base)
// ============================================
class Character {
    constructor(name, maxHp, attackPower) {
        this.name = name;
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.atk = attackPower;
    }

    isAlive() { return this.hp > 0; }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        return amount;
    }

    receiveHeal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    getHealthPercent() { return (this.hp / this.maxHp) * 100; }
}

// ============================================
// PLAYER UNIT CLASS
// ============================================
class PlayerUnit extends Character {
    constructor(className, customName = null) {
        const stats = {
            Warrior: { hp: 150, atk: 18, mana: 100 },
            Rogue: { hp: 110, atk: 22, mana: 100 },
            Mage: { hp: 90, atk: 15, mana: 100 }
        };
        const selected = stats[className] || stats.Warrior;
        super(customName || className, selected.hp, selected.atk);
        this.classType = className;
        this.mana = selected.mana;
        this.maxMana = 100;
    }

    basicAttack(target, logCallback) {
        const variance = Math.floor(Math.random() * 12) + 1;
        const totalDamage = this.atk + variance;
        target.takeDamage(totalDamage);
        logCallback(`${this.name} ⚡ strikes ${target.name} for ${totalDamage} damage!`);
        return totalDamage;
    }

    specialSkill(target, logCallback) {
        if (this.mana < 15) {
            logCallback(`❌ ${this.name} lacks mana! (${this.mana}/15 required)`);
            return false;
        }
        this.mana -= 15;
        let damage = 0;
        switch (this.classType) {
            case "Warrior":
                damage = this.atk * 2 + Math.floor(Math.random() * 8);
                logCallback(`💥 ${this.name} uses MIGHTY SLAM! ${damage} brutal damage!`);
                break;
            case "Rogue":
                damage = this.atk * 3 + Math.floor(Math.random() * 10);
                logCallback(`🗡️ ${this.name} backstabs for ${damage} critical!`);
                break;
            case "Mage":
                damage = this.atk * 4 + Math.floor(Math.random() * 12);
                logCallback(`🔮 ${this.name} casts FIREBALL! ${damage} arcane blast!`);
                break;
        }
        target.takeDamage(damage);
        return true;
    }

    selfHeal(logCallback) {
        const healAmount = 25;
        this.receiveHeal(healAmount);
        logCallback(`💚 ${this.name} recovers ${healAmount} HP! (${this.hp}/${this.maxHp})`);
    }

    regenMana(amount = 5) {
        this.mana = Math.min(this.maxMana, this.mana + amount);
    }
}

// ============================================
// ENEMY CLASS
// ============================================
class Enemy extends Character {
    constructor(enemyData) {
        super(enemyData.name, enemyData.hp, enemyData.atk);
        this.cost = enemyData.cost;
        this.icon = enemyData.icon;
        this.iconColor = enemyData.iconColor;
        this.allyClass = enemyData.allyClass;
    }

    enemyAction(targetsList, logCallback) {
        const aliveTargets = targetsList.filter(t => t.isAlive());
        if (aliveTargets.length === 0) return;
        const randomTarget = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
        const damageDealt = this.atk + Math.floor(Math.random() * 8);
        randomTarget.takeDamage(damageDealt);
        logCallback(`🐉 ${this.name} attacks ${randomTarget.name} for ${damageDealt} damage!`);
    }

    getArtHTML() {
        return `<div class="enemy-image" style="background: #00000066; text-shadow: 0 0 6px currentColor; color: ${this.iconColor};">
                    <span style="font-size:3rem;">${this.icon}</span>
                </div>`;
    }
}

// ============================================
// GAME CONTROLLER CLASS
// ============================================
class DungeonGame {
    constructor() {
        // Initialize player identity and server comm
        this.identity = new PlayerIdentity();
        this.server = new ServerComm(this.identity);
        
        // Game state
        this.player = null;
        this.allies = [];
        this.currentEnemy = null;
        this.gold = 120;
        this.progress = 0;
        this.totalEnemiesDefeated = 0;
        this.gameActive = false;
        
        // DOM elements
        this.startScreen = document.getElementById("startScreen");
        this.gameInterface = document.getElementById("gameInterface");
        this.classSelect = document.getElementById("classSelect");
        this.startBtn = document.getElementById("startGameBtn");
        this.logContainer = document.getElementById("combatLog");
        this.restartContainer = document.getElementById("restartContainer");
        this.restartBtn = document.getElementById("restartButton");
        
        this.attackBtn = document.getElementById("btnAttack");
        this.skillBtn = document.getElementById("btnSkill");
        this.healBtn = document.getElementById("btnHeal");
        this.recruitBtn = document.getElementById("btnRecruit");
        this.nextBtn = document.getElementById("btnNext");
        
        this.playerStatsDiv = document.getElementById("playerStatsArea");
        this.alliesDiv = document.getElementById("alliesContainer");
        this.enemyDiv = document.getElementById("enemyArea");
        
        this.bindEvents();
        this.displayPlayerInfo();
        this.logGameStart();
    }
    
    logGameStart() {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🎮 D&D RPG INITIALIZED");
        console.log("🆔 Player ID:", this.identity.getPlayerId());
        console.log("📛 Player Name:", this.identity.getPlayerName());
        console.log("🌐 Server URL:", SERVER_URL);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }
    
    displayPlayerInfo() {
        const infoDiv = document.createElement("div");
        infoDiv.style.position = "fixed";
        infoDiv.style.top = "10px";
        infoDiv.style.right = "10px";
        infoDiv.style.backgroundColor = "rgba(0,0,0,0.8)";
        infoDiv.style.padding = "8px 15px";
        infoDiv.style.borderRadius = "20px";
        infoDiv.style.fontSize = "12px";
        infoDiv.style.fontFamily = "monospace";
        infoDiv.style.zIndex = "9999";
        infoDiv.style.border = "1px solid #ffd966";
        infoDiv.style.cursor = "pointer";
        infoDiv.innerHTML = `
            👤 ${this.identity.getPlayerName()}<br>
            <span style="font-size: 9px; opacity: 0.6;">ID: ${this.identity.getPlayerId().substring(0, 16)}...</span>
        `;
        
        infoDiv.onclick = () => {
            if (this.identity.updateName()) {
                infoDiv.innerHTML = `
                    👤 ${this.identity.getPlayerName()}<br>
                    <span style="font-size: 9px; opacity: 0.6;">ID: ${this.identity.getPlayerId().substring(0, 16)}...</span>
                `;
                this.addLog(`📝 Name changed to: ${this.identity.getPlayerName()}`);
                this.sendGameState("name_change");
            }
        };
        
        document.body.appendChild(infoDiv);
    }
    
    bindEvents() {
        this.startBtn.onclick = () => this.startNewGame();
        this.restartBtn.onclick = () => this.restartGame();
        this.attackBtn.onclick = () => this.playerAttack();
        this.skillBtn.onclick = () => this.playerSkill();
        this.healBtn.onclick = () => this.playerHeal();
        this.recruitBtn.onclick = () => this.attemptRecruit();
        this.nextBtn.onclick = () => this.nextEncounter();
    }
    
    addLog(message) {
        const logEntry = document.createElement("p");
        logEntry.innerHTML = `⚡ ${message}`;
        this.logContainer.appendChild(logEntry);
        logEntry.scrollIntoView({ behavior: "smooth", block: "nearest" });
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }
    
    clearLog() {
        this.logContainer.innerHTML = "";
        this.addLog("✨ Adventure begins! Defeat enemies to earn gold & progress.");
    }
    
    getCurrentGameData() {
        // Get ally names (not just count)
        const allyNames = this.allies.map(ally => ally.name).join(", ");
        
        return {
            progress: this.progress,
            totalEnemiesDefeated: this.totalEnemiesDefeated,
            gold: this.gold,
            alliesList: allyNames || "None",
            classType: this.player?.classType || "Unknown",
            currentHp: this.player?.hp || 0,
            currentMana: this.player?.mana || 0,
            power: this.player?.atk || 0,
            rank: this.progress >= 100 ? "Legendary Hero" : "Adventurer"
        };
    }
    
    sendGameState(action) {
        if (!this.gameActive && action !== "game_over" && action !== "victory" && action !== "win") return;
        const gameData = this.getCurrentGameData();
        this.server.send(action, gameData);
    }
    
    startNewGame() {
        console.log("Starting new game...");
        const selectedClass = this.classSelect.value;
        this.player = new PlayerUnit(selectedClass, "Hero");
        this.allies = [];
        this.gold = 120;
        this.progress = 0;
        this.totalEnemiesDefeated = 0;
        this.gameActive = true;
        this.spawnRandomEnemy();
        
        this.startScreen.classList.add("hidden");
        this.gameInterface.classList.remove("hidden");
        this.restartContainer.classList.add("hidden");
        this.clearLog();
        this.addLog(`🛡️ ${this.player.name} the ${this.player.classType} joins the fight!`);
        this.addLog(`💰 Starting gold: ${this.gold} | Recruit enemies by paying their cost!`);
        this.updateAllUI();
        this.sendGameState("start");
    }
    
    restartGame() {
        console.log("Restarting game...");
        this.gameActive = false;
        this.allies = [];
        this.gold = 120;
        this.progress = 0;
        this.totalEnemiesDefeated = 0;
        this.currentEnemy = null;
        
        const selectedClass = this.classSelect.value;
        this.player = new PlayerUnit(selectedClass, "Hero");
        this.spawnRandomEnemy();
        this.gameActive = true;
        
        this.restartContainer.classList.add("hidden");
        this.clearLog();
        this.addLog(`🔄 GAME RESTARTED! 🔄`);
        this.addLog(`🛡️ ${this.player.name} the ${this.player.classType} returns to battle!`);
        this.addLog(`💰 Starting gold: ${this.gold} | Recruit enemies by paying their cost!`);
        
        this.updateAllUI();
        this.sendGameState("restart");
    }
    
    spawnRandomEnemy() {
        const enemyData = getRandomEnemy();
        this.currentEnemy = new Enemy(enemyData);
        this.addLog(`⚠️ ${this.currentEnemy.name} appears! (Recruit cost: 🪙${this.currentEnemy.cost})`);
    }
    
    getAlliedFighters() {
        return [this.player, ...this.allies].filter(u => u.isAlive());
    }
    
    enemyTurn() {
        if (!this.currentEnemy || !this.currentEnemy.isAlive()) return;
        const targets = this.getAlliedFighters();
        if (targets.length === 0) {
            this.addLog("💀 Everyone is defeated! Game Over...");
            this.endGame();
            return;
        }
        this.currentEnemy.enemyAction(targets, (msg) => this.addLog(msg));
        this.sendGameState("enemy_turn");
    }
    
    endGame() {
        this.gameActive = false;
        this.addLog("☠️ GAME OVER - Your journey has ended.");
        this.addLog("✨ Click the RESTART button to begin a new adventure! ✨");
        this.restartContainer.classList.remove("hidden");
        this.updateAllUI();
        this.sendGameState("game_over");
    }
    
    checkCombatState() {
        if (!this.player.isAlive()) {
            this.endGame();
            return true;
        }
        
        if (this.currentEnemy && !this.currentEnemy.isAlive()) {
            const goldReward = 25;
            const progressGain = 12;
            this.gold += goldReward;
            this.progress = Math.min(100, this.progress + progressGain);
            this.totalEnemiesDefeated++;
            this.addLog(`🏆 VICTORY! +${goldReward} gold, +${progressGain} progress!`);
            this.player.regenMana(8);
            this.addLog(`🔋 ${this.player.name} recovers 8 mana.`);
            this.currentEnemy = null;
            this.updateAllUI();
            this.sendGameState("victory");
            
            if (this.progress >= 100) {
                this.addLog("🎉✨ YOU REACHED 100% PROGRESS! YOU ARE LEGEND! ✨🎉");
                this.addLog("🏆 YOU WIN! 🏆");
                this.gameActive = false;
                this.restartContainer.classList.remove("hidden");
                this.sendGameState("win");
            }
            return true;
        }
        return false;
    }
    
    resolveAction() {
        if (!this.gameActive) return;
        if (this.currentEnemy && this.currentEnemy.isAlive()) {
            this.enemyTurn();
        }
        this.checkCombatState();
        this.updateAllUI();
    }
    
    playerAttack() {
        if (!this.gameActive) return;
        if (!this.currentEnemy || !this.currentEnemy.isAlive()) {
            this.addLog("No enemy to attack! Click 'Next Foe'.");
            return;
        }
        this.player.basicAttack(this.currentEnemy, (msg) => this.addLog(msg));
        this.resolveAction();
        this.sendGameState("attack");
    }
    
    playerSkill() {
        if (!this.gameActive) return;
        if (!this.currentEnemy || !this.currentEnemy.isAlive()) {
            this.addLog("No enemy to use skill!");
            return;
        }
        const success = this.player.specialSkill(this.currentEnemy, (msg) => this.addLog(msg));
        if (success) {
            this.resolveAction();
            this.sendGameState("skill");
        } else {
            this.updateAllUI();
        }
    }
    
    playerHeal() {
        if (!this.gameActive) return;
        if (!this.player.isAlive()) return;
        this.player.selfHeal((msg) => this.addLog(msg));
        this.resolveAction();
        this.sendGameState("heal");
    }
    
    attemptRecruit() {
        if (!this.gameActive) {
            this.addLog("Game is over, click RESTART.");
            return;
        }
        if (!this.currentEnemy) {
            this.addLog("👻 No enemy to recruit! Click 'Next Foe' first.");
            return;
        }
        
        const cost = this.currentEnemy.cost;
        if (this.gold < cost) {
            this.addLog(`💰 Not enough gold! Need ${cost} gold. You have ${this.gold}.`);
            return;
        }
        
        this.gold -= cost;
        let allyClassType = this.currentEnemy.allyClass || "Warrior";
        
        const recruitedAlly = new PlayerUnit(allyClassType, this.currentEnemy.name);
        this.allies.push(recruitedAlly);
        this.addLog(`🤝 SUCCESS! ${this.currentEnemy.name} joins your cause! (-${cost} gold)`);
        
        this.currentEnemy = null;
        this.updateAllUI();
        this.addLog("⭐ The battlefield is clear. Press 'Next Foe' to continue.");
        this.sendGameState("recruit");
    }
    
    nextEncounter() {
        if (!this.gameActive) {
            this.addLog("Game over, click RESTART.");
            return;
        }
        if (this.currentEnemy && this.currentEnemy.isAlive()) {
            this.addLog("⚔️ You must defeat or recruit the current enemy before moving on!");
            return;
        }
        this.spawnRandomEnemy();
        this.player.regenMana(5);
        this.updateAllUI();
        this.addLog("🌀 A new challenge emerges...");
        this.sendGameState("next_encounter");
    }
    
    updateAllUI() {
        if (!this.player) return;
        
        const playerHpPercent = this.player.getHealthPercent();
        const manaPercent = (this.player.mana / this.player.maxMana) * 100;
        const powerPercent = Math.min(100, (this.player.atk / 35) * 100);
        const goldPercent = Math.min(100, (this.gold / 200) * 100);
        const progPercent = this.progress;
        
        this.playerStatsDiv.innerHTML = `
            <div class="stat-block">
                <div class="stat-label">❤️ ${this.player.name} (${this.player.classType}) | ${this.player.hp}/${this.player.maxHp} HP</div>
                <div class="bar"><div class="fill hp" style="width: ${playerHpPercent}%;"></div></div>
            </div>
            <div class="stat-block">
                <div class="stat-label">✨ MANA: ${this.player.mana}/${this.player.maxMana}</div>
                <div class="bar"><div class="fill mana" style="width: ${manaPercent}%;"></div></div>
            </div>
            <div class="stat-block">
                <div class="stat-label">⚔️ POWER: ${this.player.atk}</div>
                <div class="bar"><div class="fill power" style="width: ${powerPercent}%;"></div></div>
            </div>
            <div class="stat-block">
                <div class="stat-label">🪙 GOLD: ${this.gold}</div>
                <div class="bar"><div class="fill gold" style="width: ${goldPercent}%;"></div></div>
            </div>
            <div class="stat-block">
                <div class="stat-label">📈 PROGRESS: ${this.progress}%</div>
                <div class="bar"><div class="fill progress" style="width: ${progPercent}%;"></div></div>
            </div>
            <div class="stat-block">
                <div class="stat-label">⚔️ ENEMIES DEFEATED: ${this.totalEnemiesDefeated}</div>
            </div>
        `;
        
        if (this.allies.length === 0) {
            this.alliesDiv.innerHTML = "<div style='opacity:0.7;'>— No allies recruited —<br>💰 Defeat & recruit monsters!</div>";
        } else {
            this.alliesDiv.innerHTML = this.allies.map(ally => `
                <div class="ally-badge">
                    <span>⚔️ ${ally.name} (${ally.classType})</span>
                    <span style="color:#ffaa88">❤️ ${ally.hp}/${ally.maxHp}</span>
                </div>
            `).join('');
        }
        
        if (this.currentEnemy && this.currentEnemy.isAlive()) {
            const enemyHpPercent = (this.currentEnemy.hp / this.currentEnemy.maxHp) * 100;
            this.enemyDiv.innerHTML = `
                <div class="enemy-card">
                    ${this.currentEnemy.getArtHTML()}
                    <div class="enemy-stats">
                        <strong>🐲 ${this.currentEnemy.name}</strong>
                        <div class="bar" style="margin: 8px 0;"><div class="fill hp" style="width: ${enemyHpPercent}%; background:#e06c6c;"></div></div>
                        <div>❤️ ${this.currentEnemy.hp}/${this.currentEnemy.maxHp} HP | ⚔️ ATK: ${this.currentEnemy.atk}</div>
                        <div class="cost-badge">💰 Recruit cost: 🪙${this.currentEnemy.cost}</div>
                    </div>
                </div>
            `;
        } else if (this.currentEnemy && !this.currentEnemy.isAlive()) {
            this.enemyDiv.innerHTML = `<div style="background:#2e2a3a; border-radius:16px; padding:12px;">✅ Defeated! Press "Next Foe"</div>`;
        } else {
            this.enemyDiv.innerHTML = `<div style="background:#1f2538; border-radius:16px; padding:12px;">🌀 No enemy. Press "Next Foe" to continue.</div>`;
        }
    }
}

// ============================================
// START THE GAME
// ============================================
window.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded, starting D&D RPG...");
    new DungeonGame();
});