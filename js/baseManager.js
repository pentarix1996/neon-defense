/**
 * Base Visuals Manager.
 * Handles the rendering of the holographic core in the upgrade menu.
 */
class BaseVisualsManager {
    
    /**
     * Main entry point to draw the base visuals.
     * Uses requestAnimationFrame for continuous animation.
     * @param {string} canvasId - The ID of the canvas element.
     * @param {number} level - The current level of the base (0-4).
     */
    static draw(canvasId, level) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const time = Date.now() * 0.001; // Global time for animation

        // 1. Draw Background (Digital Grid)
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let i = 0; i < width; i += 40) {
            ctx.beginPath(); 
            ctx.moveTo(i, 0); 
            ctx.lineTo(i, height); 
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let i = 0; i < height; i += 40) {
            ctx.beginPath(); 
            ctx.moveTo(0, i); 
            ctx.lineTo(width, i); 
            ctx.stroke();
        }

        // 2. Hologram Effect Setup
        ctx.save();
        ctx.translate(centerX, centerY);

        const pulse = 1 + Math.sin(time * 2) * 0.05;

        // --- LEVEL 0: RUINS (Red/Unstable) ---
        if (level === 0) {
            ctx.shadowBlur = 20; 
            ctx.shadowColor = '#ff0055';
            ctx.fillStyle = '#300';
            
            ctx.beginPath(); 
            ctx.arc(0, 0, 40 * pulse, 0, Math.PI * 2); 
            ctx.fill();
            
            ctx.strokeStyle = '#ff0055'; 
            ctx.lineWidth = 2;
            
            // Rotating broken rings
            for (let i = 0; i < 3; i++) {
                ctx.beginPath(); 
                ctx.arc(0, 0, 50 + (i * 10), time + i, time + i + 1.5); 
                ctx.stroke();
            }
            
            ctx.fillStyle = '#fff';
            ctx.font = '12px monospace';
            ctx.fillText("SYSTEM CRITICAL", -50, 80);
        }

        // --- LEVEL 1: OUTPOST (Blue/Stable) ---
        if (level >= 1) {
            ctx.shadowBlur = 25; 
            ctx.shadowColor = '#00f3ff';
            ctx.fillStyle = '#00f3ff';
            
            // Hexagon Core
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                ctx.lineTo(50 * Math.cos(i * Math.PI / 3), 50 * Math.sin(i * Math.PI / 3));
            }
            ctx.closePath(); 
            ctx.fill();
            
            // Rotating Ring
            ctx.rotate(time * 0.5);
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)'; 
            ctx.lineWidth = 4;
            ctx.beginPath(); 
            ctx.arc(0, 0, 70, 0, Math.PI * 1.5); 
            ctx.stroke();
            ctx.rotate(-time * 0.5); // Reset rotation
        }

        // --- LEVEL 2: FORTRESS (Green/Tech) ---
        if (level >= 2) {
            ctx.rotate(-time * 0.8);
            ctx.strokeStyle = '#00ff66'; 
            ctx.lineWidth = 2;
            
            // Square border
            ctx.beginPath(); 
            ctx.rect(-90, -90, 180, 180); 
            ctx.stroke();
            
            // 4 Satellites
            for (let i = 0; i < 4; i++) {
                ctx.fillStyle = '#00ff66';
                ctx.fillRect(85, -5, 10, 10);
                ctx.rotate(Math.PI / 2);
            }
            ctx.rotate(time * 0.8); // Reset
        }

        // --- LEVEL 3: CITADEL (Purple/Power) ---
        if (level >= 3) {
            ctx.rotate(time * 0.2);
            ctx.shadowColor = '#bd00ff'; 
            ctx.shadowBlur = 40;
            ctx.strokeStyle = '#bd00ff'; 
            ctx.lineWidth = 6;
            
            // Outer Ring
            ctx.beginPath(); 
            ctx.arc(0, 0, 130, 0, Math.PI * 2); 
            ctx.stroke();
            
            // Orbiting nodes
            const orbitals = 3;
            for (let i = 0; i < orbitals; i++) {
                const ang = (i * (Math.PI * 2 / orbitals));
                ctx.fillStyle = '#fff';
                ctx.beginPath(); 
                ctx.arc(Math.cos(ang) * 130, Math.sin(ang) * 130, 8, 0, Math.PI * 2); 
                ctx.fill();
            }
            ctx.rotate(-time * 0.2);
        }

        // --- LEVEL 4: COMMAND CENTER (Gold/Ultimate) ---
        if (level >= 4) {
            ctx.shadowColor = '#ffcc00'; 
            ctx.shadowBlur = 60;
            ctx.strokeStyle = 'rgba(255, 204, 0, 0.3)'; 
            ctx.lineWidth = 2;
            
            // Grid Sphere Effect
            ctx.beginPath(); 
            ctx.arc(0, 0, 180, 0, Math.PI * 2); 
            ctx.stroke();
            
            ctx.setLineDash([10, 10]);
            ctx.beginPath(); 
            ctx.arc(0, 0, 170, 0, Math.PI * 2); 
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
        
        // Loop Animation if the menu is visible
        // Using 'BaseVisualsManager.draw' explicitly to maintain context
        if (document.getElementById('base-menu').style.display === 'flex') {
            requestAnimationFrame(() => BaseVisualsManager.draw(canvasId, level));
        }
    }
}

// Expose global helper to maintain compatibility with existing onclick events in HTML if necessary
// or simply used by the Game class.
function drawBaseVisuals(canvasId, level) {
    BaseVisualsManager.draw(canvasId, level);
}