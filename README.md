# Neon Defense: Titan Slayer

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-stable-brightgreen)

**Neon Defense** is a retro-futuristic "Tower Defense" strategy game developed in Vanilla JavaScript, HTML5, and CSS3. Defend your base against waves of cybernetic enemies using an arsenal of advanced turrets.

## 🎮 Features

- **10 Unique Tower Types**: From basic machine guns to orbital cannons and singularity generators.
- **Persistent Progression System**: Earn coins, unlock levels, and permanently upgrade your base.
- **Smart Enemies**: Healers, armored tanks, and massive bosses ("Titans" and "Colossi").
- **Dynamic Audio Engine**: Music adapts procedurally based on intensity and level.
- **Visual Effects**: Particles, shockwaves, and retro CRT effects.

## 🚀 Installation & Usage

This project requires no build dependencies (no webpack/babel) to run in its basic form.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/pentarix1996/neon-defense.git](https://github.com/pentarix1996/neon-defense.git)
    cd neon-defense
    ```

2.  **Run:**
    Simply open the `index.html` file in your favorite modern browser.
    
    > **Note:** To avoid CORS issues (due to loading audio and modules locally), it is recommended to use a simple local server like Live Server in VS Code or Python:
    > ```bash
    > python3 -m http.server
    > ```

## 🕹️ Controls

- **Mouse**: Select towers, build, and navigate menus.
- **Keys 1-9**: Quick hotkeys for tower selection.
- **ESC**: Cancel selection / Pause game.

## 🛠️ Technologies

- **Canvas API**: High-performance 60FPS graphical rendering.
- **Web Audio API**: Custom real-time sound synthesis engine (`audio.js`).
- **LocalStorage**: Persistent data saving in the browser.
- **CSS3 Variables**: Dynamic and thematic styling.

## 📂 Project Structure

```text
├── assets/            # Static resources (audio, images)
├── js/
│   ├── audio.js       # Audio engine and sequencer
|   ├── baseManager.js # Base management logic
│   ├── config.js      # Game constants and balancing
│   ├── entities.js    # Classes (Enemies, Towers, Projectiles)
│   ├── main.js        # Main loop and Game Manager state
│   └── utils.js       # Helper functions and Vectors
├── index.html         # Entry point
├── style.css          # UI styles and interface
└── README.md          # Documentation
```

## 🐛 Known Issues & Fixes

- Audio Blocked: Browsers block automatic audio. You must interact with the page (click) to initialize the audio engine.

## 📄 Licencia

Distributed under the MIT License. See LICENSE for more information.

---
Developed by [Antonio Carvajal] - 2025