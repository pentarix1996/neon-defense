class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        
        this.enabled = false;
        this.isPlayingMusic = false;
        
        // Scheduler vars
        this.nextNoteTime = 0;
        this.noteIndex = 0;
        this.tempo = 110;
        this.lookahead = 25.0;
        this.scheduleAheadTime = 0.1;
        this.timerID = null;
        
        // State
        this.currentStyle = 1; // 1, 2, or 3
        
        // Boss Track (User file)
        this.bossBgm = new Audio('./assets/music/boss_theme.mp3');
        this.bossBgm.loop = true;
        this.bossBgm.volume = 0.4;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.5;
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.4;
            this.musicGain.connect(this.masterGain);

            this.enabled = true;
        } else if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // --- MUSIC SYSTEM ---

    startMusic(levelId) {
        if (!this.enabled) return;

        // Stop boss music if playing
        this.bossBgm.pause();
        this.bossBgm.currentTime = 0;

        // Determine Style based on Level
        // Level 1: Standard Synthwave (110 BPM)
        // Level 2: High Speed Chase (130 BPM)
        // Level 3: Heavy Industrial (90 BPM)
        // Levels 4-5+ default to style 1 modified
        
        this.currentStyle = levelId;
        
        if (levelId === 1) this.tempo = 110;
        else if (levelId === 2) this.tempo = 130;
        else if (levelId === 3) this.tempo = 90;
        else this.tempo = 120;

        if (!this.isPlayingMusic) {
            this.isPlayingMusic = true;
            this.noteIndex = 0;
            this.nextNoteTime = this.ctx.currentTime + 0.1;
            this.scheduler();
        }
    }

    startBossMusic() {
        if (!this.enabled) return;
        // Stop procedural music
        this.isPlayingMusic = false;
        clearTimeout(this.timerID);
        
        // Play track
        this.bossBgm.play().catch(e => console.warn("Audio blocked"));
    }

    stopMusic() {
        this.isPlayingMusic = false;
        clearTimeout(this.timerID);
        this.bossBgm.pause();
        this.bossBgm.currentTime = 0;
    }

    scheduler() {
        if (!this.isPlayingMusic) return;
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.noteIndex, this.nextNoteTime);
            this.nextNote();
        }
        this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
    }

    nextNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
        this.noteIndex++;
        if (this.noteIndex === 16) this.noteIndex = 0;
    }

    scheduleNote(beat, time) {
        // STYLE 1: NEON PULSE (Standard)
        if (this.currentStyle === 1) {
            if (beat === 0 || beat === 8) this.playSynthKick(time);
            if (beat === 4 || beat === 12) { this.playSnare(time); this.playBass(time, 55); }
            if (beat % 2 === 0) this.playHiHat(time, beat % 4 === 0 ? 0.1 : 0.05);
            // Melody
            const scale = [220, 261.63, 329.63, 392.00]; // A Minor Pentatonic
            if ([0, 3, 6, 9, 12].includes(beat)) {
                const note = scale[Math.floor(Math.random() * scale.length)];
                this.playSynthLead(time, note, 'square');
            }
        }
        
        // STYLE 2: CYBER CHASE (Fast)
        else if (this.currentStyle === 2) {
            if (beat % 4 === 0) this.playSynthKick(time); // 4-on-the-floor
            if (beat % 2 === 0) this.playHiHat(time, 0.08);
            if (beat === 4 || beat === 12) this.playSnare(time);
            // Arpeggiated Melody
            const scale = [440, 523.25, 659.25, 783.99]; // A Minor higher
            if (beat % 2 === 0) {
                const note = scale[Math.floor(Math.random() * scale.length)];
                this.playSynthLead(time, note, 'sawtooth', 0.1);
            }
        }

        // STYLE 3: INDUSTRIAL CORE (Heavy/Slow)
        else if (this.currentStyle === 3 || this.currentStyle >= 3) {
            if (beat === 0) this.playSynthKick(time, 0.5); // Long kick
            if (beat === 8) this.playSnare(time);
            if (beat % 4 === 0) this.playBass(time, 40); // Low bass
            // Metallic noise
            if (Math.random() > 0.8) this.playHiHat(time, 0.1);
        }
    }

    // --- INSTRUMENTS ---

    playBass(time, freq) {
        this.playOsc(time, freq, 'sawtooth', 0.4, 0.2, this.musicGain);
    }
    
    playSynthLead(time, freq, type = 'square', dur = 0.3) {
        this.playOsc(time, freq, type, 0.1, dur, this.musicGain);
    }

    playSynthKick(time, dur=0.5) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + dur);
        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(time);
        osc.stop(time + dur);
    }

    playSnare(time) {
        this.playOsc(time, 200, 'triangle', 0.3, 0.1, this.musicGain); // Simplified snare
    }

    playHiHat(time, vol) {
        this.playOsc(time, 8000, 'square', vol, 0.05, this.musicGain);
    }

    playOsc(time, freq, type, vol, dur, node) {
        if(!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.connect(gain);
        gain.connect(node);
        osc.start(time);
        osc.stop(time + dur);
    }

    setMusicVolume(val) { 
        if(this.musicGain) this.musicGain.gain.value = val / 100; 
        this.bossBgm.volume = val / 100;
    }
    setSfxVolume(val) { 
        if(this.sfxGain) this.sfxGain.gain.value = val / 100; 
    }

    // SFX
    playTone(freq, type, dur, time=0, vol=0.1) {
        if(!this.enabled || !this.ctx) return;
        try { this.playOsc(this.ctx.currentTime + time, freq, type, vol, dur, this.sfxGain); } catch(e){}
    }
    playShoot() { this.playTone(400, 'triangle', 0.1); }
    playSniper() { this.playTone(800, 'square', 0.3); }
    playTesla() { this.playTone(200, 'sawtooth', 0.1); }
    playMissile() { this.playTone(100, 'sawtooth', 0.6); }
    playPulse() { this.playTone(300, 'sine', 0.4); }
    playPrism() { this.playTone(1000, 'sine', 0.1); }
    playRailgun() { this.playTone(60, 'sawtooth', 0.8); }
    playOrbital() { this.playTone(800, 'sine', 0.05); }
    playExplosion() { this.playTone(80, 'sawtooth', 0.5); }
    playBuild() { this.playTone(600, 'sine', 0.2); }
}