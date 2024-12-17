class Firework {
    constructor(canvasWidth, canvasHeight) {
        this.x = Math.random() * canvasWidth;
        this.y = canvasHeight;
        this.targetY = Math.random() * (canvasHeight * 0.5);
        this.speed = 15 + Math.random() * 5;
        this.particles = [];
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        this.exploded = false;
    }

    update() {
        if (!this.exploded) {
            this.y -= this.speed;
            if (this.y <= this.targetY) {
                this.explode();
            }
        } else {
            this.particles.forEach(particle => particle.update());
            this.particles = this.particles.filter(particle => particle.alpha > 0);
        }
    }

    explode() {
        this.exploded = true;
        for (let i = 0; i < 50; i++) {
            this.particles.push(new Particle(this.x, this.y, this.color));
        }
    }

    draw(ctx) {
        if (!this.exploded) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, 2, 10);
        }
        this.particles.forEach(particle => particle.draw(ctx));
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.alpha = 1;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.alpha -= 0.01;
    }

    draw(ctx) {
        ctx.fillStyle = this.color.replace(')', `, ${this.alpha})`).replace('rgb', 'rgba');
        ctx.fillRect(this.x, this.y, 2, 2);
    }
}

import Player from './Player.js';
import Obstacle from './Obstacle.js';

const GAME_CONFIG = {
    TARGET_SCORE: 38,
    BASE_GAME_SPEED: 1.8, // Increased from 1.2
    SPAWN_INTERVALS: {
        DESKTOP: 1200,
        MOBILE: 1400
    },
    DIFFICULTY_SCALING: {
        SPAWN_INTERVAL_REDUCTION: 15,
        MIN_SPAWN_INTERVAL: 600,
        SPEED_SCALING_FACTOR: 0.035  // Increased from 0.025
    }
};

class Game {
    constructor() {
        console.log('Game constructor called');
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.isRunning = false;
        this.isWinning = false;
        this.hasPlayedIntro = false;
        this.lastFrameTime = null;
        this.lastTime = performance.now();
        this.lastLogTime = null;
        this.player = null;
        this.obstacles = [];
        this.score = 0;
        this.targetScore = GAME_CONFIG.TARGET_SCORE;
        this.gameSpeed = GAME_CONFIG.BASE_GAME_SPEED;
        this.spawnTimer = 0;
        this.spawnInterval = this.isMobile ? GAME_CONFIG.SPAWN_INTERVALS.MOBILE : GAME_CONFIG.SPAWN_INTERVALS.DESKTOP;
        this.scale = 1;

        this.setupCanvas();
        this.setupGame();
        this.setupControls();
        this.setupEventListeners();
        this.setupAudio();

        // Initialize UI elements
        this.updateUI();
    }

    // Update the updateUI method to use the corrected speed
    updateUI() {
        const scoreDisplay = document.getElementById('scoreDisplay');
        const speedDisplay = document.getElementById('speedDisplay');
        
        if (scoreDisplay) {
            scoreDisplay.textContent = `${this.score}/${this.targetScore}`;
        }
        if (speedDisplay) {
            // Round the speed to whole numbers for display
            speedDisplay.textContent = Math.floor(this.gameSpeed * 100);
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.resizeCanvas();
        
        if (this.isMobile) {
            this.ctx.imageSmoothingEnabled = false;
        }
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.resizeCanvas(), 250);
        });
    }

    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const aspectRatio = 4/3;
        let width = Math.min(containerWidth, containerHeight * aspectRatio);
        let height = width / aspectRatio;
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.scale = width / 800;
    
        if (this.isRunning) {
            this.draw();
        }
    }

    setupGame() {
        console.log('Setting up game...');
        this.isRunning = false;
        this.isWinning = false;
        this.hasPlayedIntro = false;
        this.player = new Player(this);
        this.obstacles = [];
        this.score = 0;
        this.gameSpeed = GAME_CONFIG.BASE_GAME_SPEED;
        this.spawnTimer = 0;
        this.spawnInterval = this.isMobile ? GAME_CONFIG.SPAWN_INTERVALS.MOBILE : GAME_CONFIG.SPAWN_INTERVALS.DESKTOP;
        this.lastTime = performance.now();
        
        // Force proper UI state on mobile
        if (this.isMobile) {
            const startScreen = document.getElementById('startScreen');
            const mobileControls = document.getElementById('mobileControls');
            if (startScreen) startScreen.classList.remove('hidden');
            if (mobileControls) mobileControls.style.display = 'flex';
        }
        
        this.updateUI();
    }

    setupControls() {
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
        if (this.isTouchDevice) {
            this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e), false);
            this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e), false);
            this.canvas.addEventListener('touchend', () => {
                this.player.moveLeft = false;
                this.player.moveRight = false;
            }, false);
        } else {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') this.player.moveLeft = true;
                if (e.key === 'ArrowRight') this.player.moveRight = true;
            });
    
            document.addEventListener('keyup', (e) => {
                if (e.key === 'ArrowLeft') this.player.moveLeft = false;
                if (e.key === 'ArrowRight') this.player.moveRight = false;
            });
    
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
        }
    }

    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const relativeX = touchX / rect.width * this.canvas.width;
        
        this.player.x = relativeX - this.player.width / 2;
        
        // Ensure player stays within bounds
        if (this.player.x < 0) {
            this.player.x = 0;
        } else if (this.player.x + this.player.width > this.canvas.width) {
            this.player.x = this.canvas.width - this.player.width;
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const canvasWidth = this.canvas.width;
    
        // Calculate the player's position based on the mouse position
        const playerCenter = this.player.width / 2;
        this.player.x = (mouseX / rect.width * canvasWidth) - playerCenter;
    
        // Ensure the player stays within the canvas boundaries
        if (this.player.x < 0) {
            this.player.x = 0;
        } else if (this.player.x + this.player.width > canvasWidth) {
            this.player.x = canvasWidth - this.player.width;
        }
    }

    setupEventListeners() {
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', () => {
                console.log('Start button clicked');
                this.startGame();
            });
        }
    }

    setupAudio() {
        console.log('Setting up audio...');
        this.audioConfig = {
            isMuted: false,
            volume: 0.7,
            fadeTime: 2000
        };

        // Initialize audio tracks
        this.promiseMeMusic = new Audio('sounds/promise-me.mp3');
        this.f1Theme = new Audio('sounds/f1-theme.mp3');
        this.victoryMusic = new Audio('sounds/legends-made.mp3');

        // Stop any playing audio first
        this.stopAllMusic();

        // Configure volumes
        this.promiseMeMusic.volume = 0.75 * this.audioConfig.volume;
        this.f1Theme.volume = 0.65 * this.audioConfig.volume;
        this.victoryMusic.volume = 0.8 * this.audioConfig.volume;

        // Configure looping
        this.promiseMeMusic.loop = true;
        this.f1Theme.loop = true;
        this.victoryMusic.loop = true;

        // Try to play intro music immediately for desktop
        if (!this.isMobile) {
            this.playIntroMusic();
        }

        this.setupAudioControls();
    }

    playIntroMusic() {
        console.log('Attempting to play intro music...');
        // Stop any other music first
        this.stopAllMusic();
        
        this.promiseMeMusic.play()
            .then(() => {
                console.log('Intro music started successfully');
                this.hasPlayedIntro = true;
            })
            .catch(e => {
                console.log('Initial play failed, retrying on user interaction:', e);
                // Add click listener to try again
                document.addEventListener('click', () => {
                    if (!this.hasPlayedIntro) {
                        this.promiseMeMusic.play()
                            .then(() => {
                                console.log('Intro music started after click');
                                this.hasPlayedIntro = true;
                            })
                            .catch(e => console.log('Intro music retry failed:', e));
                    }
                }, { once: true });
            });
    }

loadAudio(audio) {
    return new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', reject);
        audio.load();
    });
}
// Update the setupAudioControls method
    setupAudioControls() {
        const muteButton = document.getElementById('muteButton');
        const volumeSlider = document.getElementById('volumeSlider');

        if (muteButton) {
            // Set initial state
            muteButton.textContent = this.audioConfig.isMuted ? '🔇' : '🔊';
            
            muteButton.addEventListener('click', () => {
                this.audioConfig.isMuted = !this.audioConfig.isMuted;
                muteButton.textContent = this.audioConfig.isMuted ? '🔇' : '🔊';

                // Apply mute to all audio tracks
                [this.promiseMeMusic, this.f1Theme, this.victoryMusic].forEach(audio => {
                    if (audio) audio.muted = this.audioConfig.isMuted;
                });
            });
        }

        if (volumeSlider) {
            volumeSlider.value = this.audioConfig.volume * 100;
            volumeSlider.addEventListener('input', (e) => {
                const baseVolume = e.target.value / 100;
                this.audioConfig.volume = baseVolume;

                // Update volumes for all tracks
                if (this.promiseMeMusic) this.promiseMeMusic.volume = baseVolume * 0.75;
                if (this.f1Theme) this.f1Theme.volume = baseVolume * 0.65;
                if (this.victoryMusic) this.victoryMusic.volume = baseVolume * 0.8;
            });
        }
    }

        // Update the startGame method in Game.js
    startGame() {
        console.log('Starting game...');
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.gameLoop(this.lastFrameTime);

        const startScreen = document.getElementById('startScreen');
        if (startScreen) {
            startScreen.classList.add('hidden');
        }

        // Ensure Promise Me music is fully stopped before starting F1 theme
        if (this.promiseMeMusic) {
            this.promiseMeMusic.pause();
            this.promiseMeMusic.currentTime = 0;
        }

        // Start F1 theme
        if (this.f1Theme) {
            this.f1Theme.currentTime = 0;
            this.f1Theme.volume = this.audioConfig.volume * 0.65;
            this.f1Theme.play().catch(e => console.log('F1 theme play failed:', e));
        }
    }
    stopAllMusic() {
        // Helper method to stop all music tracks
        const tracks = [this.promiseMeMusic, this.f1Theme, this.victoryMusic];
        tracks.forEach(track => {
            if (track) {
                track.pause();
                track.currentTime = 0;
            }
        });
    }

    cleanup() {
        // Enhanced cleanup method
        cancelAnimationFrame(this.animationFrameId);
        
        // Clean up celebration elements
        const fireworksCanvas = document.getElementById('fireworksCanvas');
        if (fireworksCanvas) fireworksCanvas.remove();
        
        const celebration = document.querySelector('.celebration-container');
        if (celebration) celebration.remove();
        
        // Reset audio
        this.stopAllMusic();
        
        // Reset game state
        this.isWinning = false;
        this.obstacles = [];
        this.score = 0;
    }
    // Update the playWithFade method to ensure clean transitions
    async playWithFade(newTrack, currentTrack = null) {
        if (currentTrack) {
            // Immediately stop the current track
            currentTrack.pause();
            currentTrack.currentTime = 0;
        }

        // Start the new track
        if (newTrack) {
            newTrack.currentTime = 0;
            try {
                await newTrack.play();
            } catch (e) {
                console.log('Track switch failed:', e);
            }
        }
    }


    // Add a helper method to stop all music
    stopAllMusic() {
        const tracks = [this.promiseMeMusic, this.f1Theme, this.victoryMusic];
        tracks.forEach(track => {
            if (track) {
                track.pause();
                track.currentTime = 0;
            }
        });
    }
            // Add debugging method
            // Add debugging method
            checkAudioState() {
                console.log('Promise Me Music state:', {
                    paused: this.promiseMeMusic.paused,
                    currentTime: this.promiseMeMusic.currentTime,
                    volume: this.promiseMeMusic.volume,
                    muted: this.promiseMeMusic.muted,
                    readyState: this.promiseMeMusic.readyState
            })
        }
    // Update fadeOut method with better error handling
    async fadeOut(audio) {
        if (!audio || audio.paused) return;

        try {
            const fadeInterval = 50;
            const steps = this.audioConfig.fadeTime / fadeInterval;
            const volumeStep = audio.volume / steps;

            return new Promise(resolve => {
                const fade = setInterval(() => {
                    if (audio.volume > volumeStep) {
                        audio.volume -= volumeStep;
                    } else {
                        audio.pause();
                        audio.currentTime = 0;
                        audio.volume = this.audioConfig.volume;
                        clearInterval(fade);
                        resolve();
                    }
                }, fadeInterval);
            });
        } catch (e) {
            console.log('Fade out failed:', e);
            // Fallback to immediate pause
            audio.pause();
            audio.currentTime = 0;
        }
    }

    // Update fadeIn method with better error handling
    async fadeIn(audio) {
        if (!audio) return;

        try {
            audio.volume = 0;
            await audio.play();

            const fadeInterval = 50;
            const steps = this.audioConfig.fadeTime / fadeInterval;
            const volumeStep = this.audioConfig.volume / steps;

            return new Promise(resolve => {
                const fade = setInterval(() => {
                    if (audio.volume < this.audioConfig.volume - volumeStep) {
                        audio.volume += volumeStep;
                    } else {
                        audio.volume = this.audioConfig.volume;
                        clearInterval(fade);
                        resolve();
                    }
                }, fadeInterval);
            });
        } catch (e) {
            console.log('Fade in failed:', e);
            // Fallback to immediate play
            audio.volume = this.audioConfig.volume;
            audio.play();
        }
    }

    gameLoop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = Math.min(timestamp - (this.lastFrameTime || timestamp), 50);
        this.lastFrameTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

      // Fix the speed calculation in the update method
      // Update the speed calculation in the update method
      update(deltaTime) {
        if (!this.isRunning) return;

        this.player.update();
        
        // Updated speed calculation
        this.gameSpeed = GAME_CONFIG.BASE_GAME_SPEED + 
            (this.score * GAME_CONFIG.DIFFICULTY_SCALING.SPEED_SCALING_FACTOR);

        // Spawn obstacles
        this.spawnTimer += deltaTime;
        if (this.spawnTimer > this.spawnInterval) {
            const carsToSpawn = Math.random() < 0.4 ? 2 : 1;
            for (let i = 0; i < carsToSpawn; i++) {
                const obstacle = new Obstacle(this);  // Create obstacle directly
                this.obstacles.push(obstacle);
            }
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(
                GAME_CONFIG.DIFFICULTY_SCALING.MIN_SPAWN_INTERVAL,
                this.spawnInterval - (this.score * GAME_CONFIG.DIFFICULTY_SCALING.SPAWN_INTERVAL_REDUCTION)
            );
        }

        // Update obstacles and check score
        this.obstacles = this.obstacles.filter(obstacle => {
            const isOffscreen = obstacle.update();
            if (isOffscreen) {
                this.score += 1;
                this.updateUI();

                if (this.score >= this.targetScore && !this.isWinning) {
                    this.showVictory();
                }
            }
            return !isOffscreen;
        });

        if (!this.isWinning) {
            this.checkCollisions();
        }

        // Update UI with current speed
        this.updateUI();
    }

    draw() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawRoad();
        this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
        this.player.draw(this.ctx);
        this.drawUI();
    }

    drawRoad() {
        // Road background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Lane markings
        this.ctx.fillStyle = '#FFFFFF';
        const laneWidth = this.canvas.width / 3;
        const currentTime = performance.now();
        
        for (let i = 1; i < 3; i++) {
            const x = laneWidth * i;
            const offset = (currentTime * 0.1 % 50) * (this.gameSpeed / GAME_CONFIG.BASE_GAME_SPEED);
            
            for (let y = -this.canvas.height + offset; y < this.canvas.height; y += 50) {
                this.ctx.fillRect(
                    x - 2 * this.scale,
                    y,
                    4 * this.scale,
                    30 * this.scale
                );
            }
        }
    }

    drawUI() {
        // Remove the in-game speed display since we have it in the UI header
        return;
    }

// Update showVictory method (audio part)

async showVictory() {
    this.isWinning = true;
    this.isRunning = false;

    // Ensure game loop is stopped
    cancelAnimationFrame(this.animationFrameId);

    // Clean up existing elements
    const existingCelebration = document.querySelector('.celebration-container');
    if (existingCelebration) existingCelebration.remove();

    // Handle audio transition
    await this.fadeOut(this.f1Theme);
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.fadeIn(this.victoryMusic);

    const gameContainer = document.getElementById('gameContainer');
    const celebration = document.createElement('div');
    celebration.className = 'celebration-container';

    // Adjust styles for mobile
    celebration.style.cssText = `
        background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)),
                         url('images/senna-helmet.jpg');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999;
        -webkit-transform: translate3d(0,0,0);
        transform: translate3d(0,0,0);
        overflow: hidden;
        touch-action: none;
        -webkit-overflow-scrolling: none;
    `;

    // Create content container with iOS-specific adjustments
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
        position: relative;
        z-index: 1002;
        text-align: center;
        padding: ${this.isMobile ? '15px' : '20px'};
        background: rgba(0, 0, 0, 0.6);
        border-radius: 15px;
        border: 2px solid #FFD700;
        max-width: ${this.isMobile ? '85%' : '90%'};
        margin: auto;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        touch-action: none;
        -webkit-transform: translate3d(0,0,0);
    `;

    // Adjust content for mobile
    contentContainer.innerHTML = `
        <div class="game-logo" style="
            width: ${this.isMobile ? '100px' : 'min(150px, 30vw)'};
            height: ${this.isMobile ? '100px' : 'min(150px, 30vw)'};
            margin: 0 auto 15px auto;
            background-image: url('images/senna-logo.png');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
        "></div>
        <h1 class="celebration-title" style="
            color: #FFD700;
            font-size: ${this.isMobile ? '24px' : 'clamp(24px, 5vw, 36px)'};
            margin: 15px 0;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);">
            🏆 Champion 🏆
        </h1>
        <div class="celebration-text" style="
            color: #FFFFFF;
            font-size: ${this.isMobile ? '16px' : 'clamp(16px, 4vw, 24px)'};
            margin: 15px 0;
            line-height: 1.5;">
            <p>Happy Birthday!</p>
            <p>Just like Senna, you've achieved greatness!</p>
            <p>Score: ${this.score}/${this.targetScore}</p>
        </div>
        <button class="start-button" id="celebrationButton" style="
            padding: ${this.isMobile ? '10px 20px' : 'clamp(10px, 3vw, 15px) clamp(20px, 5vw, 40px)'};
            font-size: ${this.isMobile ? '18px' : 'clamp(16px, 4vw, 24px)'};
            background: linear-gradient(45deg, #FFD700, #FFA500);
            border: none;
            color: #000;
            border-radius: 25px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: bold;
            margin-top: 15px;
            transition: all 0.3s ease;
            min-height: 44px;
            min-width: 44px;">
            Race Again
        </button>
    `;

    celebration.appendChild(contentContainer);

    // Setup fireworks with mobile optimization
    const fireworksCanvas = document.createElement('canvas');
    fireworksCanvas.id = 'fireworksCanvas';
    fireworksCanvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
        touch-action: none;
        -webkit-transform: translate3d(0,0,0);
    `;
    celebration.appendChild(fireworksCanvas);
    gameContainer.appendChild(celebration);

    // Enhanced button handling for mobile
    const celebrationButton = document.getElementById('celebrationButton');
    if (celebrationButton) {
        const handleClick = async () => {
            // Remove event listeners first
            celebrationButton.removeEventListener('click', handleClick);
            celebrationButton.removeEventListener('touchend', handleClick);
            
            // Clean up
            this.stopFireworks();
            celebration.remove();
            this.cleanup();
            
            // Reset game
            this.setupGame();
            await this.fadeOut(this.victoryMusic);
            this.f1Theme.currentTime = 0;
            
            // Start new game
            this.startGame();
        };

        celebrationButton.addEventListener('click', handleClick);
        celebrationButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleClick();
        });
    }

    this.setupFireworks();

    // Prevent scrolling on iOS
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
}

// Add this method to properly stop fireworks
stopFireworks() {
    if (this.fireworksAnimationId) {
        cancelAnimationFrame(this.fireworksAnimationId);
    }
    const fireworksCanvas = document.getElementById('fireworksCanvas');
    if (fireworksCanvas) {
        fireworksCanvas.remove();
    }
}

// Update setupFireworks method for better mobile handling
setupFireworks() {
    const fireworksCanvas = document.getElementById('fireworksCanvas');
    if (!fireworksCanvas) return;

    const fwCtx = fireworksCanvas.getContext('2d');
    fireworksCanvas.width = fireworksCanvas.clientWidth;
    fireworksCanvas.height = fireworksCanvas.clientHeight;

    this.fireworks = [];

    const animateFireworks = () => {
        if (!fwCtx || !fireworksCanvas.parentNode) return;
        
        fwCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        fwCtx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

        if (Math.random() < (this.isMobile ? 0.03 : 0.05)) {
            this.fireworks.push(new Firework(fireworksCanvas.width, fireworksCanvas.height));
        }

        this.fireworks = this.fireworks.filter(firework => {
            firework.update();
            firework.draw(fwCtx);
            return firework.particles.length > 0 || !firework.exploded;
        });

        this.fireworksAnimationId = requestAnimationFrame(animateFireworks);
    };

    animateFireworks();
}

// Update cleanup method
cleanup() {
    cancelAnimationFrame(this.animationFrameId);
    this.stopFireworks();
    
    const celebration = document.querySelector('.celebration-container');
    if (celebration) {
        celebration.remove();
    }
    
    // Reset body styles
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    
    // Reset game state
    this.isWinning = false;
    this.obstacles = [];
    this.score = 0;
}

    checkCollisions() {
        if (this.isWinning) return;
        
        for (let obstacle of this.obstacles) {
            if (this.detectCollision(this.player, obstacle)) {
                this.gameOver();
                break;
            }
        }
    }

    detectCollision(a, b) {
        const margin = 5 * this.scale;
        return !(
            (a.x + margin + a.width - margin * 2) <= b.x ||
            (a.x + margin) >= (b.x + b.width - margin) ||
            (a.y + margin + a.height - margin * 2) <= b.y ||
            (a.y + margin) >= (b.y + b.height - margin)
        );
    }

// Update gameOver method
gameOver() {
    if (this.isWinning) return;
    
    this.isRunning = false;
    
    // Stop game loop
    cancelAnimationFrame(this.animationFrameId);

    // Switch back to intro music
    this.playWithFade(this.promiseMeMusic, this.f1Theme);

    const startScreen = document.getElementById('startScreen');
    if (startScreen) {
        // Clean up any existing content
        while (startScreen.firstChild) {
            startScreen.firstChild.remove();
        }

        // Show the screen
        startScreen.classList.remove('hidden');
        
        // Set background with mobile-optimized styles
        startScreen.style.cssText = `
            background-image: linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)),
                            url('images/senna-helmet.jpg');
            background-size: cover;
            background-position: center;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: ${this.isMobile ? '10px' : '20px'};
        `;
        
        startScreen.innerHTML = `
            <div class="game-logo"></div>
            <h1 class="game-title" style="font-size: ${this.isMobile ? '24px' : '32px'}">Race Over</h1>
            <div class="quote" style="font-size: ${this.isMobile ? '14px' : '16px'}">
                Score: ${this.score}/${this.targetScore}<br>
                "Sometimes you have to go through the darkness 
                to get to the light." - Ayrton Senna
            </div>
            <button class="start-button" id="startButton">Try Again</button>
        `;
        
        const newStartButton = document.getElementById('startButton');
        if (newStartButton) {
            newStartButton.addEventListener('click', () => {
                this.setupGame();
                this.startGame();
            }, { once: true });
        }

        // Show mobile controls if needed
        if (this.isMobile) {
            const mobileControls = document.getElementById('mobileControls');
            if (mobileControls) mobileControls.style.display = 'flex';
        }
    }
}

// Add this new method for proper cleanup
cleanup() {
    cancelAnimationFrame(this.animationFrameId);
    const fireworksCanvas = document.getElementById('fireworksCanvas');
    if (fireworksCanvas) fireworksCanvas.remove();
    const celebration = document.querySelector('.celebration-container');
    if (celebration) celebration.remove();
}
}

export default Game;
