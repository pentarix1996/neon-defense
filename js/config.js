/**
 * Static Game Configuration.
 * Contains immutable constants for tower stats, upgrades, and level definitions.
 * Using Object.freeze to prevent accidental runtime modifications.
 */

const TOWER_TYPES = {
    BLASTER: 0,
    SNIPER: 1,
    TESLA: 2,
    MISSILE: 3,
    PULSE: 4,
    PRISM: 5,
    BUFFER: 6,
    RAILGUN: 7,
    ORBITAL: 8,
    SINGULARITY: 9
};

const TOWER_STATS = Object.freeze([
    { id: 0, name: "Blaster",     rng: 120, dmg: 15,  spd: 20,  cost: 50,   col: '#00f3ff', desc: "Rapid-fire turret. Basic defense.",    unlockId: 0 },
    { id: 1, name: "Sniper",      rng: 300, dmg: 80,  spd: 90,  cost: 120,  col: '#ffcc00', desc: "Long range. Targets strongest enemy.", unlockId: 0 },
    { id: 2, name: "Tesla",       rng: 100, dmg: 2,   spd: 0,   cost: 200,  col: '#ff0055', desc: "Continuous lightning chain.",          unlockId: 0 },
    { id: 3, name: "Missile",     rng: 180, dmg: 50,  spd: 120, cost: 350,  col: '#bd00ff', desc: "Splash damage explosions.",            unlockId: 1 },
    { id: 4, name: "Pulse",       rng: 100, dmg: 5,   spd: 60,  cost: 150,  col: '#ffffff', desc: "Pushes enemies back.",                 unlockId: 1 },
    { id: 5, name: "Prism",       rng: 140, dmg: 0.5, spd: 0,   cost: 450,  col: '#00ffff', desc: "Ramping laser beam damage.",           unlockId: 2 },
    { id: 6, name: "Buffer",      rng: 80,  dmg: 0,   spd: 0,   cost: 400,  col: '#ff6600', desc: "Buffs nearby towers speed +20%.",      unlockId: 2 },
    { id: 7, name: "Railgun",     rng: 999, dmg: 200, spd: 180, cost: 800,  col: '#00ffaa', desc: "Global infinite pierce.",              unlockId: 3 },
    { id: 8, name: "Orbital",     rng: 100, dmg: 30,  spd: 0,   cost: 550,  col: '#ff00cc', desc: "Orbs damage on contact.",              unlockId: 3 },
    { id: 9, name: "Singularity", rng: 160, dmg: 0.5, spd: 0,   cost: 1000, col: '#330066', desc: "Gravity well. Massive slow & % dmg.",  unlockId: 3 }
]);

const BASE_UPGRADES = Object.freeze([
    { id: 1, name: "Munitions Depot", cost: 500,  desc: "Unlocks Missile & Pulse. Repairs structure.",      unlocks: [1], title: "OUTPOST" },
    { id: 2, name: "Energy Lab",      cost: 1200, desc: "Unlocks Prism & Buffer. Advanced tech.",           unlocks: [2], title: "FORTRESS" },
    { id: 3, name: "Orbital Link",    cost: 3000, desc: "Unlocks Railgun, Orbital & Singularity.",          unlocks: [3], title: "CITADEL" },
    { id: 4, name: "Quantum Shield",  cost: 5000, desc: "Starting Lives +20. Ultimate defense matrix.",     type: 'passive', val: 20, title: "COMMAND CENTER" }
]);

const LEVELS = Object.freeze([
    { id: 1, name: "INITIATION",   money: 250, waves: 10, mapType: 'simple',  desc: "Basic training." },
    { id: 2, name: "THE LOOP",     money: 350, waves: 15, mapType: 'loop',    desc: "Healers detected." },
    { id: 3, name: "CORE SECTOR",  money: 500, waves: 20, mapType: 'zig',     desc: "Armored units inbound." },
    { id: 4, name: "NEON SKYLINE", money: 600, waves: 25, mapType: 'skyline', desc: "Fast enemies. High altitude." },
    { id: 5, name: "THE VOID",     money: 800, waves: 30, mapType: 'void',    desc: "Extreme danger. Anomalies detected." }
]);