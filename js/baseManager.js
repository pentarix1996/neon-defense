function drawBaseVisuals(canvasId, level) {
    const cvs = document.getElementById(canvasId);
    if (!cvs) return;
    const c = cvs.getContext('2d');
    
    const w = cvs.width;
    const h = cvs.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const t = Date.now() * 0.001;

    // Background: Digital Grid
    c.fillStyle = '#050510';
    c.fillRect(0, 0, w, h);
    
    c.strokeStyle = 'rgba(0, 243, 255, 0.1)';
    c.lineWidth = 1;
    for(let i=0; i<w; i+=40) { c.beginPath(); c.moveTo(i,0); c.lineTo(i,h); c.stroke(); }
    for(let i=0; i<h; i+=40) { c.beginPath(); c.moveTo(0,i); c.lineTo(w,i); c.stroke(); }

    // HOLOGRAM EFFECT
    c.save();
    c.translate(centerX, centerY);

    // Core Base (Changes with level)
    const pulse = 1 + Math.sin(t * 2) * 0.05;
    
    // Level 0: Unstable Core (Red/Glitchy)
    if (level === 0) {
        c.shadowBlur = 20; c.shadowColor = '#ff0055';
        c.fillStyle = '#300';
        c.beginPath(); c.arc(0, 0, 40 * pulse, 0, Math.PI*2); c.fill();
        
        c.strokeStyle = '#ff0055'; c.lineWidth = 2;
        for(let i=0; i<3; i++) {
            c.beginPath(); 
            c.arc(0, 0, 50 + (i*10), t + i, t + i + 1.5); 
            c.stroke();
        }
        c.fillStyle = '#fff';
        c.font = '12px monospace';
        c.fillText("SYSTEM CRITICAL", -50, 80);
    }

    // Level 1: Stabilized (Blue)
    if (level >= 1) {
        c.shadowBlur = 25; c.shadowColor = '#00f3ff';
        c.fillStyle = '#00f3ff';
        // Hexagon Core
        c.beginPath();
        for (let i = 0; i < 6; i++) {
            c.lineTo(50 * Math.cos(i * Math.PI / 3), 50 * Math.sin(i * Math.PI / 3));
        }
        c.closePath(); c.fill();
        
        // Rotating Ring 1
        c.rotate(t * 0.5);
        c.strokeStyle = 'rgba(0, 243, 255, 0.5)'; c.lineWidth = 4;
        c.beginPath(); c.arc(0, 0, 70, 0, Math.PI*1.5); c.stroke();
        c.rotate(-t * 0.5); // Undo rotate
    }

    // Level 2: Advanced (Green/Tech)
    if (level >= 2) {
        c.rotate(-t * 0.8);
        c.strokeStyle = '#00ff66'; c.lineWidth = 2;
        c.beginPath(); c.rect(-90, -90, 180, 180); c.stroke();
        // 4 Satellites
        for(let i=0; i<4; i++) {
            c.fillStyle = '#00ff66';
            c.fillRect(85, -5, 10, 10);
            c.rotate(Math.PI/2);
        }
        c.rotate(t * 0.8); // Undo
    }

    // Level 3: Citadel (Purple/Power)
    if (level >= 3) {
        c.rotate(t * 0.2);
        c.shadowColor = '#bd00ff'; c.shadowBlur = 40;
        c.strokeStyle = '#bd00ff'; c.lineWidth = 6;
        c.beginPath(); c.arc(0, 0, 130, 0, Math.PI*2); c.stroke();
        // Orbiting nodes
        const orbitals = 3;
        for(let i=0; i<orbitals; i++) {
            const ang = (i * (Math.PI*2/orbitals));
            c.fillStyle = '#fff';
            c.beginPath(); c.arc(Math.cos(ang)*130, Math.sin(ang)*130, 8, 0, Math.PI*2); c.fill();
        }
        c.rotate(-t * 0.2);
    }

    // Level 4: Command (Gold/Ultimate)
    if (level >= 4) {
        c.shadowColor = '#ffcc00'; c.shadowBlur = 60;
        c.strokeStyle = 'rgba(255, 204, 0, 0.3)'; c.lineWidth = 2;
        // Grid Sphere
        c.beginPath(); c.arc(0, 0, 180, 0, Math.PI*2); c.stroke();
        c.setLineDash([10, 10]);
        c.beginPath(); c.arc(0, 0, 170, 0, Math.PI*2); c.stroke();
        c.setLineDash([]);
    }

    c.restore();
    
    // Redraw loop
    requestAnimationFrame(() => {
        if (document.getElementById('base-menu').style.display === 'flex') {
            drawBaseVisuals(canvasId, level);
        }
    });
}