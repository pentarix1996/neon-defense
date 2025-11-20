const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const audio = new AudioEngine();

const game = {
    state: 'MENU', frame: 0, width: 1280, height: 720, gridSize: 40, cols: 32, rows: 18, speed: 1,
    currentLevelId: 1, unlockedLevel: parseInt(localStorage.getItem('neon_level') || 1), infiniteMode: false,
    money: 0, lives: 0, wave: 0, maxWave: 0, waveActive: false, enemiesToSpawn: 0, spawnTimer: 0, spawnQueue: [],
    map: [], path: [], towers: [], enemies: [], projectiles: [], particles: [], effects: [], floatingTexts: [],
    selectedTowerType: null, selectedTower: null, mouseX: 0, mouseY: 0, shake: 0,
    stats: { kills: 0, dmg: 0, earnings: 0 }, paused: false,
    combo: 0, comboTimer: 0,
    
    // Boss State Tracking
    isBossFight: false,
    
    persistentData: JSON.parse(localStorage.getItem('neon_save_v8_0')) || { coins: 0, baseLevel: 0, unlocks: [0] },

    init() {
        this.resize(); window.addEventListener('resize', () => this.resize());
        canvas.addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); this.mouseX = e.clientX - r.left; this.mouseY = e.clientY - r.top; });
        canvas.addEventListener('click', () => this.handleClick());
        document.addEventListener('keydown', e => {
            if (e.key >= '1' && e.key <= '9') this.selectTowerToBuild(parseInt(e.key)-1);
            if (e.key === '0') this.selectTowerToBuild(9);
            if (e.key === 'Escape') this.handleEscape();
        });
        if (!this.persistentData.unlocks || this.persistentData.unlocks.length === 0) this.persistentData.unlocks = [0];
        this.updateBaseMenu();
        this.renderMenu(); this.loop();
    },
    
    handleEscape() {
        if (this.selectedTowerType !== null || this.selectedTower !== null) {
            this.deselectTower();
        } else { this.togglePause(); }
    },

    deselectTower() {
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.hideTooltip();
        this.updateUI();
    },
    
    generateTowerButtons() {
        const c = document.getElementById('tower-bar'); c.innerHTML = '';
        TOWER_STATS.forEach((t, i) => {
            const isLocked = !this.persistentData.unlocks.includes(t.unlockId);
            const cls = isLocked ? "tower-btn locked" : "tower-btn";
            const icon = isLocked ? `<div class="lock-icon">🔒</div>` : '';
            const hotkey = i < 9 ? i+1 : 0;
            c.innerHTML += `
            <div class="${cls}" id="btn-tower-${i+1}" onclick="game.selectTowerToBuild(${i})" onmouseenter="game.showTooltip(${i})" onmouseleave="game.hideTooltip()">
                <div class="tower-icon" style="background: ${t.col}; box-shadow: 0 0 5px ${t.col};"></div>${icon}
                <div class="tower-info">${t.name}<br><span class="tower-cost">$${t.cost}</span></div><div class="key-hint">${hotkey}</div>
            </div>`;
        });
    },

    renderMenu() {
        const grid = document.getElementById('level-grid'); grid.innerHTML = '';
        LEVELS.forEach(lvl => {
            const el = document.createElement('div');
            el.className = `level-card ${lvl.id > this.unlockedLevel ? 'locked' : ''} ${lvl.id < this.unlockedLevel ? 'completed' : ''}`;
            el.innerHTML = `<h3>${lvl.name}</h3><p>${lvl.waves} Waves</p><p style="font-size:0.8rem; color:#aaa;">${lvl.desc}</p>`;
            if (lvl.id <= this.unlockedLevel) el.onclick = () => this.startLevel(lvl.id);
            grid.appendChild(el);
        });
    },
    
    openBaseScreen() {
        document.getElementById('menu-screen').style.display = 'none';
        document.getElementById('base-menu').style.display = 'flex';
        this.updateBaseMenu();
        drawBaseVisuals('baseCanvas', this.persistentData.baseLevel);
    },
    
    updateBaseMenu() {
        document.getElementById('base-coins').innerText = this.persistentData.coins;
        const titles = ["RUINS", "OUTPOST", "FORTRESS", "CITADEL", "COMMAND CENTER"];
        const t = titles[this.persistentData.baseLevel] || "SUPREME HQ";
        
        // Update UI text
        const statusText = document.getElementById('base-status-text');
        if(statusText) statusText.innerText = `${t} (LVL ${this.persistentData.baseLevel})`;

        const list = document.getElementById('base-upgrades-list');
        list.innerHTML = '';
        BASE_UPGRADES.forEach(up => {
            const bought = (up.id <= this.persistentData.baseLevel);
            const canAfford = this.persistentData.coins >= up.cost;
            
            let cardClass = "upgrade-card";
            if (bought) cardClass += " purchased";
            else if (!canAfford) cardClass += " unaffordable";
            else cardClass += " affordable";

            const show = (up.id === this.persistentData.baseLevel + 1) || bought;

            if (show) {
                let btnText = bought ? "INSTALLED" : `BUY (${up.cost})`;
                if (!bought && !canAfford) btnText = `NEED ${up.cost}`;
                const btnClass = bought ? "btn-buy-base disabled" : (canAfford ? "btn-buy-base" : "btn-buy-base disabled");
                const action = (!bought && canAfford) ? `onclick="game.buyUpgrade(${up.id}, ${up.cost})"` : "";
                list.innerHTML += `
                <div class="${cardClass}">
                    <div class="upgrade-info">
                        <h4 style="color:${bought ? '#0f0' : (canAfford ? 'var(--accent)' : '#555')}">${up.title}</h4>
                        <p>${up.desc}</p>
                    </div>
                    <button class="${btnClass}" ${action}>${btnText}</button>
                </div>`;
            }
        });
        
        if(document.getElementById('base-menu').style.display === 'flex') {
             requestAnimationFrame(() => drawBaseVisuals('baseCanvas', this.persistentData.baseLevel));
        }
    },

    buyUpgrade(id, cost) {
        this.persistentData.coins -= cost;
        this.persistentData.baseLevel = id;
        const up = BASE_UPGRADES.find(u => u.id === id);
        if(up.unlocks) {
            up.unlocks.forEach(uid => { if(!this.persistentData.unlocks.includes(uid)) this.persistentData.unlocks.push(uid); });
        }
        this.saveData(); this.updateBaseMenu();
    },

    saveData() { localStorage.setItem('neon_save_v8_0', JSON.stringify(this.persistentData)); },

    startLevel(id) {
        this.currentLevelId = id; this.infiniteMode = (id === 999);
        audio.init(); 
        
        // Start correct music for level
        if (this.infiniteMode) audio.startMusic(1);
        else audio.startMusic(this.currentLevelId);

        const bonusLives = (this.persistentData.baseLevel >= 4) ? 20 : 0;
        if (this.infiniteMode) { this.money = 600; this.maxWave = "∞"; this.lives = 50 + bonusLives; this.generateMap('loop'); }
        else { const lvl = LEVELS.find(l => l.id === id); this.money = lvl.money; this.maxWave = lvl.waves; this.lives = 20 + bonusLives; this.generateMap(lvl.mapType); }
        
        this.wave = 1; this.speed = 1; this.stats = { kills:0, dmg:0, earnings:0 };
        this.towers = []; this.enemies = []; this.projectiles = []; this.particles = []; 
        this.effects = []; this.floatingTexts = []; this.waveActive = false; this.paused = false;
        this.combo = 0; this.comboTimer = 0; this.isBossFight = false;
        
        document.getElementById('menu-screen').style.display = 'none'; document.getElementById('base-menu').style.display = 'none';
        document.getElementById('end-screen').style.display = 'none'; document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('ui-layer').style.display = 'flex'; document.getElementById('combo-meter').style.display = 'none';
        document.getElementById('boss-bar-container').style.display = 'none';
        
        this.generateTowerButtons(); 
        this.state = 'GAME'; this.updateUI();
        setTimeout(() => this.startWave(), 1000);
    },
    
    restartLevel() { this.startLevel(this.currentLevelId); },

    resize() {
        if (this.state === 'GAME' && !this.infiniteMode) this.generateMap(LEVELS[this.currentLevelId-1].mapType);
        else if (this.infiniteMode) this.generateMap('loop');
    },

    generateMap(type) {
        const w = 1280; const h = 720;
        if (type === 'simple') this.path = [{x:0, y:200}, {x:300, y:200}, {x:300, y:600}, {x:900, y:600}, {x:900, y:200}, {x:w, y:200}];
        else if (type === 'loop') this.path = [{x:0, y:360}, {x:300, y:360}, {x:300, y:100}, {x:900, y:100}, {x:900, y:600}, {x:300, y:600}, {x:300, y:360}, {x:w, y:360}];
        else if (type === 'zig') this.path = [{x:0, y:100}, {x:200, y:100}, {x:200, y:600}, {x:400, y:600}, {x:400, y:100}, {x:600, y:100}, {x:600, y:600}, {x:800, y:600}, {x:800, y:100}, {x:1000, y:100}, {x:1000, y:360}, {x:w, y:360}];
        else if (type === 'skyline') this.path = [{x:0, y:600}, {x:200, y:600}, {x:200, y:200}, {x:500, y:200}, {x:500, y:500}, {x:800, y:500}, {x:800, y:100}, {x:w, y:100}];
        else if (type === 'void') this.path = [{x:0, y:360}, {x:200, y:360}, {x:200, y:100}, {x:1080, y:100}, {x:1080, y:620}, {x:200, y:620}, {x:200, y:360}, {x:w, y:360}];
    },

    toggleSpeed() {
        this.speed = this.speed === 1 ? 2 : 1;
        document.getElementById('btn-speed').classList.toggle('active', this.speed === 2);
        document.getElementById('btn-speed').innerText = `SPEED x${this.speed}`;
    },
    
    togglePause() {
        if(this.state !== 'GAME') return;
        this.paused = !this.paused;
        document.getElementById('pause-menu').style.display = this.paused ? 'block' : 'none';
        audio.setMusicVolume(this.paused ? 20 : 40);
    },
    
    toggleSettings() {
        const m = document.getElementById('settings-modal'); m.style.display = m.style.display === 'block' ? 'none' : 'block';
    },

    shakeScreen(amt) { this.shake = amt; },

    startWave() {
        if (this.waveActive) return;
        this.waveActive = true; this.showToast(`WAVE ${this.wave}`);
        const count = 5 + Math.floor(this.wave * (this.infiniteMode ? 2.0 : 1.5));
        this.spawnQueue = [];
        
        for(let i=0; i<count; i++) {
            let type = 'fast'; const r = Math.random();
            if (this.wave % 10 === 0 && i === count-1) type = 'titan';
            else if (this.wave % 5 === 0 && i === count-1) type = 'boss';
            else if (this.infiniteMode && this.wave > 15 && i === count-1 && this.wave % 7 === 0) type = 'colossus';
            else if (this.wave > 10 && r > 0.9) type = 'reaper';
            else if (this.wave > 6 && r > 0.8) type = 'splitter';
            else if (this.wave > 8 && r > 0.9) type = 'glitch';
            else if (this.wave > 4 && r > 0.75) type = 'armored';
            else if (this.wave > 2 && r > 0.6) type = 'healer';
            else if (this.wave > 3 && r > 0.4) type = 'tank';
            this.spawnQueue.push(type);
        }
        this.enemiesToSpawn = count;
    },

    registerKill(enemy) {
        this.stats.kills++; this.combo++; this.comboTimer = 120; 
        this.addMoney(enemy.reward);
        const cm = document.getElementById('combo-meter');
        document.getElementById('combo-val').innerText = `x${this.combo}`;
        cm.style.display = 'block'; cm.classList.remove('combo-pop'); void cm.offsetWidth; cm.classList.add('combo-pop');
    },

    update() {
        if (this.state !== 'GAME' || this.paused) return;

        if (this.combo > 0) { this.comboTimer--; if (this.comboTimer <= 0) { this.combo = 0; document.getElementById('combo-meter').style.display = 'none'; } }

        const steps = this.speed;
        for(let s=0; s<steps; s++) {
            this.frame++;
            if (this.shake > 0) this.shake *= 0.9;
            if (this.waveActive && this.enemiesToSpawn > 0) {
                this.spawnTimer--;
                if (this.spawnTimer <= 0) {
                    const type = this.spawnQueue.shift();
                    this.enemies.push(new Enemy(this.path, type, this.wave));
                    this.enemiesToSpawn--;
                    this.spawnTimer = (['boss','titan','colossus'].includes(type)) ? 150 : 40;
                }
            } else if (this.waveActive && this.enemies.length === 0) {
                this.waveActive = false; this.wave++; 
                this.addMoney(15 + this.wave * 2); 
                this.updateUI();
                if (!this.infiniteMode && this.wave > this.maxWave) this.winGame();
                else setTimeout(() => this.startWave(), 2000/this.speed);
            }

            this.towers.forEach(t => t.update());
            this.enemies.forEach(e => e.update());
            this.projectiles.forEach(p => p.update());
            this.particles.forEach(p => p.update());
            
            this.effects.forEach(e => {
                if (e.update) e.update();
                else if (e.type === 'rail') e.life--;
            });
            
            this.floatingTexts.forEach(t => t.update());

            this.enemies = this.enemies.filter(e => e.alive);
            this.projectiles = this.projectiles.filter(p => p.alive);
            this.particles = this.particles.filter(p => p.life > 0);
            this.effects = this.effects.filter(e => e.life > 0);
            this.floatingTexts = this.floatingTexts.filter(t => t.life > 0);
            this.effects = this.effects.filter(e => { if(e.type === 'rail') { e.life--; return e.life > 0; } return true; });
            if (this.lives <= 0) { this.gameOver(); break; }
            
            // --- BOSS BAR LOGIC (FIXED) ---
            const boss = this.enemies.find(e => ['boss', 'titan', 'colossus'].includes(e.type));
            
            // 1. Detect Boss Entry
            if (boss && !this.isBossFight) {
                this.isBossFight = true;
                audio.startBossMusic();
                document.getElementById('boss-bar-container').style.display = 'block';
            }
            
            // 2. Update Bar if Boss Exists
            if (boss) {
                const pct = (boss.hp / boss.maxHp) * 100;
                document.getElementById('boss-health-fill').style.width = `${pct}%`;
                document.getElementById('boss-name').innerText = `TARGET: ${boss.type.toUpperCase()}`;
            } 
            
            // 3. Boss Defeated (No boss found but flag is true)
            else if (this.isBossFight) {
                this.isBossFight = false;
                document.getElementById('boss-bar-container').style.display = 'none';
                // Revert music
                if (this.state === 'GAME') {
                    audio.startMusic(this.infiniteMode ? 1 : this.currentLevelId);
                }
            }
        }
    },

    draw() {
        if (this.state === 'MENU') return;
        ctx.fillStyle = '#050510'; ctx.fillRect(0, 0, this.width, this.height);
        ctx.save(); if (this.shake > 0.5) ctx.translate(Math.random()*this.shake - this.shake/2, Math.random()*this.shake - this.shake/2);
        
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)'; ctx.lineWidth = 1;
        for(let c=0; c<=this.cols; c++) { ctx.beginPath(); ctx.moveTo(c*this.gridSize, 0); ctx.lineTo(c*this.gridSize, this.height); ctx.stroke(); }
        for(let r=0; r<=this.rows; r++) { ctx.beginPath(); ctx.moveTo(0, r*this.gridSize); ctx.lineTo(this.width, r*this.gridSize); ctx.stroke(); }
        if(this.path.length > 0) {
            ctx.lineWidth = 40; ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.beginPath(); ctx.moveTo(this.path[0].x, this.path[0].y);
            for(let i=1; i<this.path.length; i++) ctx.lineTo(this.path[i].x, this.path[i].y); ctx.stroke();
            ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)'; ctx.shadowBlur = 10; ctx.shadowColor = '#00f3ff'; ctx.stroke(); ctx.shadowBlur = 0;
        }

        this.towers.forEach(t => t.draw(ctx));
        this.enemies.forEach(e => e.draw(ctx));
        
        ctx.globalCompositeOperation = 'lighter';
        this.projectiles.forEach(p => p.draw(ctx));
        this.particles.forEach(p => p.draw(ctx));
        this.effects.forEach(e => {
            if(e.type === 'rail') { ctx.strokeStyle = '#00ffaa'; ctx.lineWidth = e.life/2; ctx.shadowBlur = 10; ctx.shadowColor = '#00ffaa'; ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke(); ctx.shadowBlur = 0; }
            else if (e.draw) e.draw(ctx);
        });
        ctx.globalCompositeOperation = 'source-over';
        this.floatingTexts.forEach(t => t.draw(ctx));
        ctx.restore();

        if (this.selectedTowerType !== null) {
            const c = Math.floor(this.mouseX / this.gridSize), r = Math.floor(this.mouseY / this.gridSize);
            const x = c * this.gridSize + this.gridSize/2, y = r * this.gridSize + this.gridSize/2;
            const stats = TOWER_STATS[this.selectedTowerType];
            ctx.beginPath(); ctx.arc(x, y, stats.rng, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; ctx.fill(); ctx.strokeStyle = 'white'; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = this.isValidBuild(c, r) ? 'rgba(0, 255, 102, 0.5)' : 'rgba(255, 0, 85, 0.5)'; ctx.fillRect(x-15, y-15, 30, 30);
        }
    },

    loop() { this.update(); this.draw(); requestAnimationFrame(() => this.loop()); },

    selectTowerToBuild(type) {
        if (!this.persistentData.unlocks.includes(TOWER_STATS[type].unlockId)) return;
        if (this.money >= TOWER_STATS[type].cost) { this.selectedTowerType = type; this.selectedTower = null; this.updateUI(); }
    },

    handleClick() {
        if (this.state !== 'GAME' || this.paused) return;
        const c = Math.floor(this.mouseX / this.gridSize), r = Math.floor(this.mouseY / this.gridSize);
        const m = document.getElementById('settings-modal');
        if (m.style.display === 'block' && this.mouseY > 200) m.style.display = 'none';

        if (this.selectedTowerType !== null) {
            if (this.isValidBuild(c, r)) { this.buildTower(c, r, this.selectedTowerType); if (this.money < TOWER_STATS[this.selectedTowerType].cost) this.selectedTowerType = null; }
            else this.selectedTowerType = null;
        } else {
            const t = this.towers.find(t => t.c === c && t.r === r); 
            if (t) {
                this.selectedTower = t;
                this.selectedTowerType = null;
            } else {
                this.selectedTower = null;
            }
        }
        this.updateUI();
    },

    isValidBuild(c, r) {
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
        if (this.towers.some(t => t.c === c && t.r === r)) return false;
        if (this.mouseY < 80 || this.mouseY > this.height - 120) return false;
        const pX = c * this.gridSize + this.gridSize/2, pY = r * this.gridSize + this.gridSize/2;
        for(let i=0; i<this.path.length-1; i++) {
            const p1 = this.path[i], p2 = this.path[i+1];
            const minX = Math.min(p1.x, p2.x)-30, maxX = Math.max(p1.x, p2.x)+30;
            const minY = Math.min(p1.y, p2.y)-30, maxY = Math.max(p1.y, p2.y)+30;
            if (pX > minX && pX < maxX && pY > minY && pY < maxY) return false;
        }
        return true;
    },

    buildTower(c, r, type) {
        const tStats = TOWER_STATS[type];
        this.money -= tStats.cost;
        const newTower = new Tower(c, r, type); this.towers.push(newTower);
        if (type !== 6) game.towers.forEach(t => { if(t.type === 6 && t.pos.dist(newTower.pos) <= t.range + 20) { newTower.fireRate = Math.max(5, newTower.fireRate * 0.8); newTower.isBuffed=true; } });
        audio.playBuild(); this.createExplosion(c*this.gridSize+20, r*this.gridSize+20, '#fff', 10);
    },

    createExplosion(x, y, color, count) { for(let i=0; i<count; i++) this.particles.push(new Particle(x, y, color, 2, 20)); },
    createShockwave(x, y, range) {this.effects.push(new Shockwave(x, y, range));},
    upgradeSelectedTower() { if (this.selectedTower) this.selectedTower.upgrade(); },
    sellSelectedTower() { if (this.selectedTower) { this.money += this.selectedTower.sellValue; this.towers = this.towers.filter(t => t !== this.selectedTower); this.selectedTower = null; audio.playBuild(); this.updateUI(); } },
    addMoney(amt) { this.money += amt; this.stats.earnings += amt; this.updateUI(); },
    loseLife(amt) { 
        this.lives-=amt; this.updateUI(); this.shakeScreen(15); audio.playExplosion();
        const f = document.createElement('div'); f.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(255,0,0,0.3);pointer-events:none;';
        document.body.appendChild(f); setTimeout(()=>f.remove(), 100);
    },
    
    calculateCoins() {
        return this.wave * 100;
    },

    gameOver() {
        this.state = 'END'; audio.stopMusic();
        const coins = this.calculateCoins();
        this.persistentData.coins += coins; this.saveData();
        
        document.getElementById('end-screen').style.display = 'flex';
        document.getElementById('end-title').innerText = "SYSTEM FAILURE"; document.getElementById('end-title').style.color = 'var(--danger)';
        document.getElementById('end-msg').innerText = `Survived ${this.wave} waves. Earned ${coins} Coins.`;
        this.showEndStats();
    },
    
    winGame() {
        this.state = 'END'; audio.stopMusic();
        const coins = 2000 + this.calculateCoins(); 
        this.persistentData.coins += coins; this.saveData();

        document.getElementById('end-screen').style.display = 'flex';
        document.getElementById('end-title').innerText = "SECTOR CLEARED"; document.getElementById('end-title').style.color = 'var(--success)';
        document.getElementById('end-msg').innerText = `Mission Accomplished. Earned ${coins} Coins.`;
        if (this.currentLevelId === this.unlockedLevel) { this.unlockedLevel++; localStorage.setItem('neon_level', this.unlockedLevel); }
        this.showEndStats();
    },
    
    showEndStats() {
        const grid = document.getElementById('end-stats');
        grid.innerHTML = `
            <div class="stat-item"><span>ENEMIES DESTROYED</span> <span class="stat-val">${this.stats.kills}</span></div>
            <div class="stat-item"><span>TOTAL DAMAGE</span> <span class="stat-val">${Math.floor(this.stats.dmg)}</span></div>
            <div class="stat-item"><span>CREDITS EARNED</span> <span class="stat-val">$${this.stats.earnings}</span></div>
            <div class="stat-item"><span>LIVES REMAINING</span> <span class="stat-val">${this.lives}</span></div>
        `;
    },

    returnToMenu() {
        this.state = 'MENU'; document.getElementById('end-screen').style.display = 'none'; document.getElementById('ui-layer').style.display = 'none'; document.getElementById('pause-menu').style.display = 'none'; document.getElementById('base-menu').style.display = 'none';
        document.getElementById('menu-screen').style.display = 'flex'; this.renderMenu();
    },
    showToast(msg) {
        const t = document.createElement('div'); t.className = 'toast'; t.innerText = msg;
        document.body.appendChild(t); setTimeout(() => t.remove(), 2000);
    },
    
    tooltipTimeout: null,
    showTooltip(type) {
        clearTimeout(this.tooltipTimeout);
        const t = document.getElementById('tooltip');
        const data = TOWER_STATS[type];
        document.getElementById('tt-title').innerHTML = `${data.name} <span class="tt-cost">$${data.cost}</span>`;
        document.getElementById('tt-desc').innerText = data.desc;
        document.getElementById('tt-dmg').innerText = `Dmg: ${data.dmg}`;
        document.getElementById('tt-rng').innerText = `Rng: ${data.rng}`;
        document.getElementById('tt-spd').innerText = `Spd: ${(data.spd > 0 ? (60/data.spd).toFixed(1) : '-')}/s`;
        
        const isLocked = !this.persistentData.unlocks.includes(data.unlockId);
        document.getElementById('tt-lock-msg').style.display = isLocked ? 'block' : 'none';
        
        t.style.display = 'block';
    },
    hideTooltip() {
        this.tooltipTimeout = setTimeout(() => { document.getElementById('tooltip').style.display = 'none'; }, 50);
    },

    updateUI() {
        if (this.state !== 'GAME') return;
        document.getElementById('ui-money').innerText = this.money;
        document.getElementById('ui-wave').innerText = this.wave;
        document.getElementById('ui-max-wave').innerText = this.infiniteMode ? "" : "/"+this.maxWave;
        document.getElementById('ui-lives').innerText = this.lives;

        for(let i=0; i<TOWER_STATS.length; i++) {
            const btn = document.getElementById(`btn-tower-${i+1}`);
            if (btn) {
                const isLocked = !this.persistentData.unlocks.includes(TOWER_STATS[i].unlockId);
                if (this.money < TOWER_STATS[i].cost || isLocked) btn.classList.add('disabled'); else btn.classList.remove('disabled');
                btn.classList.remove('selected'); if(this.selectedTowerType === i) btn.classList.add('selected');
            }
        }

        const p = document.getElementById('upgrade-panel');
        if (this.selectedTower) {
            p.style.display = 'block';
            document.getElementById('up-name').innerText = `${this.selectedTower.name} (L${this.selectedTower.level})`;
            document.getElementById('up-dmg').innerText = Math.floor(this.selectedTower.damage*10)/10;
            document.getElementById('up-rng').innerText = Math.floor(this.selectedTower.range);
            document.getElementById('up-spd').innerText = (this.selectedTower.fireRate > 0 ? (60/this.selectedTower.fireRate).toFixed(1) : '-');
            const cost = this.selectedTower.getUpgradeCost();
            document.getElementById('up-cost').innerText = cost; document.getElementById('up-sell').innerText = this.selectedTower.sellValue;
            const btnUp = document.getElementById('btn-do-upgrade');
            if(this.money < cost) { btnUp.style.opacity=0.5; btnUp.style.cursor='not-allowed'; } else { btnUp.style.opacity=1; btnUp.style.cursor='pointer'; }
            this.showTooltip(this.selectedTower.type);
        } else {
            p.style.display = 'none';
        }
    }
};

game.init();