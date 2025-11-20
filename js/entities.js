class FloatingText {
    constructor(x, y, text, color, size=14) {
        this.pos = new Vector(x, y); this.text = text; this.color = color; this.size = size;
        this.life = 60; this.vel = new Vector(Math.random()*0.5 - 0.25, -1.5);
    }
    update() { this.pos = this.pos.add(this.vel); this.life--; }
    draw(ctx) {
        ctx.save(); ctx.globalAlpha = Math.max(0, this.life/30); ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px 'Segoe UI'`; ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
        ctx.strokeText(this.text, this.pos.x, this.pos.y); ctx.fillText(this.text, this.pos.x, this.pos.y); ctx.restore();
    }
}

class Particle {
    constructor(x, y, color, speed, life) {
        this.pos = new Vector(x, y);
        const angle = Math.random() * Math.PI * 2;
        this.vel = new Vector(Math.cos(angle), Math.sin(angle)).mult(speed * (Math.random() + 0.5));
        this.color = color; this.life = life; this.maxLife = life; this.size = Math.random() * 3 + 1;
    }
    update() { this.pos = this.pos.add(this.vel); this.life--; this.vel = this.vel.mult(0.92); }
    draw(ctx) {
        ctx.globalAlpha = this.life / this.maxLife; ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
    }
}

// Shockwave class for Pulse Tower
class Shockwave {
    constructor(x, y, maxR) { this.x = x; this.y = y; this.r = 1; this.maxR = maxR; this.life = 20; }
    update() { this.r += (this.maxR - this.r) * 0.2; this.life--; }
    draw(ctx) { ctx.strokeStyle = 'white'; ctx.lineWidth = 3 * (this.life/20); ctx.globalAlpha = this.life/20; ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.stroke(); ctx.globalAlpha = 1; }
}

class Enemy {
    constructor(path, type, wave, startPosOverride = null) {
        this.path = path;
        if (startPosOverride) { this.pos = new Vector(startPosOverride.pos.x, startPosOverride.pos.y); this.pathIndex = startPosOverride.idx; }
        else { this.pos = new Vector(path[0].x, path[0].y); this.pathIndex = 0; }

        this.type = type; this.alive = true; this.frozen = 0; this.pushback = new Vector(0,0); this.glitchTimer = 0;
        
        const scale = 1 + (0.15 * Math.pow(wave, 1.5));
        let hp = 30, spd = 2.0, rwd = 10, col = '#ff0055', rad = 10;

        if (type === 'fast') { spd = 3.0; hp = 20; rwd = 8; }
        else if (type === 'tank') { spd = 1.2; hp = 80; rwd = 20; col = '#ff9900'; rad = 14; }
        else if (type === 'boss') { spd = 0.8; hp = 400; rwd = 100; col = '#bd00ff'; rad = 20; }
        else if (type === 'titan') { spd = 0.5; hp = 1200; rwd = 300; col = '#ffffff'; rad = 26; }
        else if (type === 'healer') { spd = 2.2; hp = 40; rwd = 15; col = '#00ff66'; }
        else if (type === 'armored') { spd = 1.5; hp = 60; rwd = 25; col = '#ffff00'; rad = 12; }
        else if (type === 'splitter') { spd = 2.0; hp = 50; rwd = 20; col = '#00ffff'; rad = 13; }
        else if (type === 'glitch') { spd = 3.5; hp = 40; rwd = 30; col = '#aaa'; rad = 11; }
        else if (type === 'reaper') { spd = 4.5; hp = 30; rwd = 20; col = '#330000'; rad = 9; } // New
        else if (type === 'colossus') { spd = 0.4; hp = 3000; rwd = 400; col = '#555555'; rad = 30; } // New

        this.maxHp = Math.floor(hp * scale);
        this.hp = this.maxHp; this.speed = spd; this.reward = rwd; this.color = col; this.radius = rad;
    }

    update() {
        if (!this.alive) return;
        let curSpd = this.speed; if (this.frozen > 0) { curSpd *= 0.5; this.frozen--; }
        if (this.type === 'glitch') { this.glitchTimer--; if (this.glitchTimer <= 0 && Math.random() < 0.02) this.glitchTimer = 30; }
        if (this.type === 'healer' && game.frame % 60 === 0) {
            game.enemies.forEach(e => { if (e !== this && e.alive && this.pos.dist(e.pos) < 100) { e.hp = Math.min(e.hp + 10, e.maxHp); game.particles.push(new Particle(e.pos.x, e.pos.y, '#00ff66', 1, 10)); } });
        }

        const target = this.path[this.pathIndex + 1];
        if (!target) { 
            this.alive = false; 
            // Reaper deals 5 dmg
            game.loseLife(this.type === 'reaper' ? 5 : 1); 
            return; 
        }
        const targetVec = new Vector(target.x, target.y);
        if (this.pushback.mag() > 0.1) {
            // Boss immunity
            if (['boss','titan','colossus'].includes(this.type)) { /* Immune */ }
            else { this.pos = this.pos.add(this.pushback); }
            this.pushback = this.pushback.mult(0.8);
        } else {
            const dir = targetVec.sub(this.pos);
            if (this.type === 'glitch' && this.glitchTimer > 0 && Math.random() > 0.5) {
                this.pos = this.pos.add(new Vector(Math.random()*10-5, Math.random()*10-5));
            } else { 
                if (dir.mag() <= curSpd) { this.pos = targetVec; this.pathIndex++; } 
                else { this.pos = this.pos.add(dir.norm().mult(curSpd)); } 
            }
        }
    }

    draw(ctx) {
        if (this.type === 'glitch' && this.glitchTimer > 0) ctx.globalAlpha = 0.3;
        ctx.shadowBlur = 10; ctx.shadowColor = this.color; ctx.fillStyle = this.color;
        ctx.beginPath();
        
        if (this.type === 'healer') { ctx.fillRect(this.pos.x-4, this.pos.y-this.radius, 8, this.radius*2); ctx.fillRect(this.pos.x-this.radius, this.pos.y-4, this.radius*2, 8); }
        else if (this.type === 'titan' || this.type === 'colossus') { ctx.fillRect(this.pos.x-this.radius, this.pos.y-this.radius, this.radius*2, this.radius*2); }
        else if (this.type === 'splitter') { ctx.moveTo(this.pos.x, this.pos.y-this.radius); ctx.lineTo(this.pos.x+this.radius, this.pos.y+this.radius); ctx.lineTo(this.pos.x-this.radius, this.pos.y+this.radius); }
        else if (this.type === 'reaper') { ctx.moveTo(this.pos.x+this.radius, this.pos.y); ctx.lineTo(this.pos.x-this.radius, this.pos.y+this.radius/2); ctx.lineTo(this.pos.x-this.radius, this.pos.y-this.radius/2); }
        else { ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI*2); }
        
        ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1.0;

        const pct = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = 'red'; ctx.fillRect(this.pos.x-12, this.pos.y-this.radius-8, 24, 4);
        ctx.fillStyle = '#0f0'; ctx.fillRect(this.pos.x-12, this.pos.y-this.radius-8, 24 * pct, 4);
    }

    takeDamage(amount) {
        if (this.type === 'glitch' && this.glitchTimer > 0) return;
        let dmg = amount; 
        if (this.type === 'armored') dmg *= 0.4;
        this.hp -= dmg;
        game.stats.dmg += dmg; 
        
        let col = '#fff'; let sz = 12; if (amount > 40) { col = '#ff0'; sz = 20; }
        game.floatingTexts.push(new FloatingText(this.pos.x, this.pos.y - 20, Math.floor(dmg), col, sz));

        if (this.hp <= 0) {
            this.alive = false; 
            game.registerKill(this);
            audio.playExplosion(); 
            game.createExplosion(this.pos.x, this.pos.y, this.color, 8);
            
            if (this.type === 'titan' || this.type === 'boss' || this.type === 'colossus') game.shakeScreen(10);
            if (this.type === 'splitter') {
                const pInfo = { pos: this.pos, idx: this.pathIndex };
                game.enemies.push(new Enemy(this.path, 'fast', game.wave, pInfo));
                game.enemies.push(new Enemy(this.path, 'fast', game.wave, pInfo));
            }
            if (this.type === 'colossus') {
                const pInfo = { pos: this.pos, idx: this.pathIndex };
                for(let i=0; i<5; i++) game.enemies.push(new Enemy(this.path, 'fast', game.wave, pInfo));
            }
        }
    }
}

class Projectile {
    constructor(x, y, target, type, dmg, aoeRange = 0) {
        this.pos = new Vector(x, y); 
        this.target = target; 
        this.targetPos = new Vector(target.pos.x, target.pos.y);
        this.type = type; 
        this.dmg = dmg; 
        this.aoe = aoeRange; 
        this.alive = true;
        this.speed = (type === 'sniper') ? 25 : (type === 'missile' ? 6 : 12);
        this.color = (type === 'missile') ? '#bd00ff' : ((type === 'sniper') ? '#ffcc00' : '#00f3ff');
    }
    update() {
        if (this.target && this.target.alive) this.targetPos = this.target.pos;
        const dir = this.targetPos.sub(this.pos);
        if (dir.mag() <= this.speed) { this.alive = false; this.impact(); }
        else { this.pos = this.pos.add(dir.norm().mult(this.speed)); }
        if (this.type === 'missile') game.particles.push(new Particle(this.pos.x, this.pos.y, this.color, 0.5, 10));
    }
    impact() {
        if (this.type === 'missile') {
            game.createExplosion(this.pos.x, this.pos.y, this.color, 15);
            game.enemies.forEach(e => { if (e.pos.dist(this.pos) <= this.aoe) e.takeDamage(this.dmg); });
        } else {
            if (this.target && this.target.alive) { 
                this.target.takeDamage(this.dmg); 
                game.particles.push(new Particle(this.pos.x, this.pos.y, this.color, 1, 8)); 
            }
        }
    }
    draw(ctx) { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, this.type==='missile'?4:2, 0, Math.PI*2); ctx.fill(); }
}

class Tower {
    constructor(c, r, type) {
        this.c = c; 
        this.r = r;
        this.pos = new Vector(c * game.gridSize + game.gridSize/2, r * game.gridSize + game.gridSize/2);
        this.type = type; 
        this.level = 1; 
        this.cooldown = 0; 
        this.angle = 0; 
        this.beamCharge = 0; 
        this.recoil = 0;
        this.orbitAngle = 0; 
        this.isBuffed = false;
        
        const s = TOWER_STATS[type];
        this.name = s.name; 
        this.range = s.rng; 
        this.damage = s.dmg; 
        this.fireRate = s.spd;
        this.cost = s.cost; 
        this.color = s.col; 
        this.sellValue = Math.floor(this.cost * 0.5);
        
        if(type === 6) this.updateNeighbors();
    }
    updateNeighbors() {
        game.towers.forEach(t => { 
            if(t !== this && t.type !== 6 && this.pos.dist(t.pos) <= this.range + 20) {
                t.isBuffed = true;
            }
        });
    }
    upgrade() {
        const cost = this.getUpgradeCost();
        if (game.money >= cost) {
            game.money -= cost; 
            this.level++; 
            this.damage *= 1.25; 
            this.range *= 1.1;
            if (this.fireRate > 5 && this.type !== 6) this.fireRate *= 0.9;
            this.sellValue += Math.floor(cost * 0.5);
            audio.playBuild(); 
            game.updateUI(); 
            game.createExplosion(this.pos.x, this.pos.y, this.color, 10);
            if(this.type === 6) this.updateNeighbors();
        }
    }
    getUpgradeCost() { return Math.floor(this.cost * 0.7 * this.level); }
    
    update() {
        if (this.type === 6) { if (Math.random() > 0.95) game.particles.push(new Particle(this.pos.x, this.pos.y, this.color, 1, 20)); return; }
        
        if (this.type === 8) {
            this.orbitAngle += 0.05 + (this.level * 0.01);
            const orbCount = 1 + Math.floor(this.level / 2);
            const dist = 40;
            for(let i=0; i<orbCount; i++) {
                const a = this.orbitAngle + (i * (Math.PI*2/orbCount));
                const ox = this.pos.x + Math.cos(a) * dist;
                const oy = this.pos.y + Math.sin(a) * dist;
                game.enemies.forEach(e => {
                    if (e.alive && new Vector(ox, oy).dist(e.pos) < e.radius + 10) {
                        e.takeDamage(this.damage);
                        game.createExplosion(ox, oy, this.color, 3);
                        if(game.frame % 10 === 0) audio.playOrbital();
                    }
                });
            }
            return;
        }

        if (this.cooldown > 0) this.cooldown--;
        
        let target = null;
        if (this.type === 1 || this.type === 7) {
             let maxHp = -1;
             for(let e of game.enemies) { if(!e.alive) continue; if(this.pos.dist(e.pos) <= this.range && e.hp > maxHp) { maxHp = e.hp; target = e; } }
        } else {
            let minDst = Infinity;
            for (let e of game.enemies) { if (!e.alive) continue; const d = this.pos.dist(e.pos); if (d <= this.range && d < minDst) { minDst = d; target = e; } }
        }
        
        if (target) {
            this.angle = Math.atan2(target.pos.y - this.pos.y, target.pos.x - this.pos.x);
            const dmg = this.damage;
            
            if (this.type === 2) { if (game.frame % 5 === 0) { target.takeDamage(dmg); target.frozen = 10; if(Math.random()>0.7) audio.playTesla(); } }
            else if (this.type === 5) { this.beamCharge = Math.min(this.beamCharge + 0.1, 3.0); target.takeDamage(dmg * this.beamCharge); if(game.frame % 4 === 0) audio.playPrism(); }
            else if (this.type === 7) {
                if (this.cooldown <= 0) {
                    audio.playRailgun(); game.createExplosion(this.pos.x, this.pos.y, this.color, 15); game.shakeScreen(5);
                    const endX = this.pos.x + Math.cos(this.angle) * 1000; const endY = this.pos.y + Math.sin(this.angle) * 1000;
                    game.enemies.forEach(e => { if(e.alive && this.distanceToLine(this.pos, {x:endX, y:endY}, e.pos) < e.radius + 10) { e.takeDamage(dmg); game.createExplosion(e.pos.x, e.pos.y, '#fff', 5); } });
                    game.effects.push({type:'rail', x1:this.pos.x, y1:this.pos.y, x2:endX, y2:endY, life:10}); this.cooldown = this.getRealFireRate();
                }
            } else if (this.type === 4) {
                if (this.cooldown <= 0) { audio.playPulse(); game.createShockwave(this.pos.x, this.pos.y, this.range); game.enemies.forEach(e => { if (e.alive && this.pos.dist(e.pos) <= this.range) { e.takeDamage(dmg); e.pushback = e.pos.sub(this.pos).norm().mult(10); } }); this.cooldown = this.getRealFireRate(); }
            } else {
                if (this.cooldown <= 0) {
                    if (this.type === 0) audio.playShoot(); else if (this.type === 1) audio.playSniper(); else if (this.type === 3) audio.playMissile();
                    let pType = this.type === 1 ? 'sniper' : (this.type === 3 ? 'missile' : 'blaster');
                    game.projectiles.push(new Projectile(this.pos.x, this.pos.y, target, pType, dmg, this.type===3?60:0));
                    this.cooldown = this.getRealFireRate();
                }
            }
            this.targetRef = target;
        } else { this.targetRef = null; this.beamCharge = 1; }
    }

    getRealFireRate() { 
        let rate = this.fireRate;
        if (this.isBuffed) rate *= 0.8; 
        return rate;
    }

    distanceToLine(p1, p2, p3) { return Math.abs((p2.y - p1.y) * p3.x - (p2.x - p1.x) * p3.y + p2.x * p1.y - p2.y * p1.x) / Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2)); }

    draw(ctx) {
        const x = this.pos.x, y = this.pos.y; ctx.save(); ctx.translate(x, y);
        if (this === game.selectedTower) { ctx.beginPath(); ctx.arc(0, 0, this.range, 0, Math.PI*2); ctx.fillStyle = `rgba(255, 255, 255, 0.05)`; ctx.fill(); ctx.strokeStyle = this.color; ctx.lineWidth = 1; ctx.stroke(); }
        
        ctx.shadowBlur = 10 + (this.level * 5); ctx.shadowColor = this.color; ctx.fillStyle = this.color;
        const lvl = Math.min(5, this.level);

        if (this.type === 4 || this.type === 6) { 
            ctx.beginPath(); ctx.arc(0, 0, 10 + (lvl*2), 0, Math.PI*2); ctx.fill();
            if (this.type === 6) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0,0, 16 + Math.sin(game.frame*0.1)*4, 0, Math.PI*2); ctx.stroke(); }
            if (lvl >= 3) { ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0, 6 + lvl, 0, Math.PI*2); ctx.stroke(); }
        } 
        else if (this.type === 8) { 
            ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill();
            ctx.restore(); 
            const orbCount = 1 + Math.floor(this.level / 2); const dist = 40;
            for(let i=0; i<orbCount; i++) {
                const a = this.orbitAngle + (i * (Math.PI*2/orbCount));
                const ox = this.pos.x + Math.cos(a) * dist;
                const oy = this.pos.y + Math.sin(a) * dist;
                ctx.save(); ctx.translate(ox, oy);
                ctx.shadowBlur = 10; ctx.shadowColor = this.color; ctx.fillStyle = this.color;
                ctx.beginPath(); ctx.arc(0,0, 5 + (lvl), 0, Math.PI*2); ctx.fill();
                ctx.restore();
            }
            ctx.save(); ctx.translate(x, y);
        }
        else {
            ctx.rotate(this.angle); ctx.fillRect(-8, -8, 16, 16);
            if (lvl >= 2) { ctx.strokeRect(-10, -10, 20, 20); }
            if (lvl >= 4) { ctx.fillStyle = '#fff'; ctx.fillRect(-4, -4, 8, 8); ctx.fillStyle = this.color; }

            if (this.type === 0) { 
                ctx.fillRect(8, -3, 8 + (lvl*2), 6);
                if(lvl >= 3) { ctx.fillRect(6, -6, 8, 2); ctx.fillRect(6, 4, 8, 2); }
                if(lvl >= 5) { ctx.fillStyle='#fff'; ctx.fillRect(15, -2, 4, 4); }
            } else if (this.type === 1) { 
                ctx.fillRect(8, -2, 20 + (lvl*4), 4);
                if(lvl >= 2) ctx.strokeRect(-8, -8, 16, 16);
                if(lvl >= 4) { ctx.fillStyle='#fff'; ctx.fillRect(30, -3, 5, 6); }
            } else if (this.type === 3) { 
                ctx.fillStyle = '#fff'; ctx.fillRect(4, -6, 10, 4); ctx.fillRect(4, 2, 10, 4);
                if (lvl >= 3) { ctx.fillRect(0, -10, 6, 4); ctx.fillRect(0, 6, 6, 4); }
                if (lvl >= 5) { ctx.fillStyle = this.color; ctx.fillRect(6, -2, 8, 4); }
            } else if (this.type === 2) { 
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 6+lvl, 0, Math.PI*2); ctx.fill();
                if(lvl >= 3) { ctx.strokeStyle = this.color; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.stroke(); }
            } else if (this.type === 5) { 
                ctx.fillStyle = '#00ffff'; ctx.beginPath(); ctx.moveTo(10+lvl*2, 0); ctx.lineTo(-5, 5+lvl); ctx.lineTo(-5, -5-lvl); ctx.fill();
            } else if (this.type === 7) { 
                ctx.fillStyle = '#00ffaa'; ctx.fillRect(0, -4, 24 + (lvl*4), 8); 
                if(lvl >= 2) { ctx.fillStyle='#000'; ctx.fillRect(5, -1, 30, 2); }
                if(lvl >= 4) { ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.strokeRect(-5, -6, 10, 12); }
            }
        }
        
        if(this.isBuffed) { ctx.save(); ctx.fillStyle = '#0f0'; ctx.font = '16px Arial'; ctx.fillText('⚡', -6, -15 - (Math.sin(game.frame * 0.2) * 3)); ctx.restore(); }
        ctx.shadowBlur = 0; ctx.restore();

        if (this.targetRef && this.targetRef.alive) {
            if (this.type === 2) { ctx.strokeStyle = this.color; ctx.shadowBlur = 5; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo((x+this.targetRef.pos.x)/2+(Math.random()*10-5), (y+this.targetRef.pos.y)/2+(Math.random()*10-5)); ctx.lineTo(this.targetRef.pos.x, this.targetRef.pos.y); ctx.stroke(); ctx.shadowBlur = 0; }
            else if (this.type === 5) { ctx.strokeStyle = this.color; ctx.lineWidth = 2 * this.beamCharge; ctx.shadowBlur = 10; ctx.shadowColor = this.color; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(this.targetRef.pos.x, this.targetRef.pos.y); ctx.stroke(); ctx.shadowBlur = 0; }
        }
        ctx.fillStyle = 'white'; for(let i=0; i<this.level; i++) ctx.fillRect(x - 8 + (i*4), y + 16, 2, 2);
    }
}