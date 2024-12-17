// First add Firework and Particle classes at the top
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
    BASE_GAME_SPEED: 1.2,
    SPAWN_INTERVALS: {
        DESKTOP: 1200,
        MOBILE: 1400
    },
    DIFFICULTY_SCALING: {
        SPAWN_INTERVAL_REDUCTION: 15,
        MIN_SPAWN_INTERVAL: 600,
        SPEED_SCALING_FACTOR: 0.025
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
        this.lastTime = null;
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
    
        // Trigger redraw after resize
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
        this.targetScore = GAME_CONFIG.TARGET_SCORE;
        this.gameSpeed = GAME_CONFIG.BASE_GAME_SPEED;
        this.spawnTimer = 0;
        this.spawnInterval = this.isMobile ? GAME_CONFIG.SPAWN_INTERVALS.MOBILE : GAME_CONFIG.SPAWN_INTERVALS.DESKTOP;
        this.lastTime = performance.now();
    }

    setupControls() {
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
        if (this.isTouchDevice) {
            this.canvas.addEventListener('touchstart', this.handleTouchMove.bind(this), false);
            this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
            this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
        } else {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') this.player.moveLeft = true;
                if (e.key === 'ArrowRight') this.player.moveRight = true;
            });
    
            document.addEventListener('keyup', (e) => {
                if (e.key === 'ArrowLeft') this.player.moveLeft = false;
                if (e.key === 'ArrowRight') this.player.moveRight = false;
            });
    
            // Mouse control
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const canvasWidth = this.canvas.width;
    
        // Calculate the player's position based on the mouse position
        const playerCenter = this.player.width / 2;
        this.player.x = mouseX - playerCenter;
    
        // Ensure the player stays within the canvas boundaries
        if (this.player.x < 0) {
            this.player.x = 0;
        } else if (this.player.x + this.player.width > canvasWidth) {
            this.player.x = canvasWidth - this.player.width;
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseMove(touch);
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.player.moveLeft = false;
        this.player.moveRight = false;
    }
    setupEventListeners() {
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', () => {
                console.log('Start button clicked');
                this.startGame();
            });
        }

        // Add other event listeners here if needed
    }

    setupAudio() {
        this.audioConfig = {
            isMuted: false,
            volume: 0.7,
            fadeTime: 2000
        };

        // Setup all audio tracks
        this.f1Theme = new Audio('sounds/f1-theme.mp3');
        this.racingMusic = new Audio('sounds/promise-me.mp3');
        this.victoryMusic = new Audio('sounds/legends-made.mp3');

        // Configure volumes
        this.f1Theme.volume = 0.65;
        this.racingMusic.volume = 0.75;
        this.victoryMusic.volume = 0.8;

        // Configure looping for background tracks
        this.f1Theme.loop = true;
        this.racingMusic.loop = true;
        this.victoryMusic.loop = true;

        // Load all audio
        Promise.all([
            this.loadAudio(this.f1Theme),
            this.loadAudio(this.racingMusic),
            this.loadAudio(this.victoryMusic)
        ]).then(() => {
            // Start F1 theme after user interaction
            document.addEventListener('click', () => {
                if (!this.hasPlayedIntro) {
                    this.f1Theme.play().catch(e => console.log('Audio play failed:', e));
                    this.hasPlayedIntro = true;
                }
            }, { once: true });
        });

        // Setup audio controls
        this.setupAudioControls();
    }

    loadAudio(audio) {
        return new Promise((resolve, reject) => {
            audio.addEventListener('canplaythrough', resolve, { once: true });
            audio.addEventListener('error', reject);
            audio.load();
        });
    }

    setupAudioControls() {
        const muteButton = document.getElementById('muteButton');
        const volumeSlider = document.getElementById('volumeSlider');

        if (muteButton) {
            muteButton.addEventListener('click', () => {
                this.audioConfig.isMuted = !this.audioConfig.isMuted;
                muteButton.textContent = this.audioConfig.isMuted ? '🔇' : '🔊';

                [this.f1Theme, this.racingMusic, this.victoryMusic].forEach(audio => {
                    audio.muted = this.audioConfig.isMuted;
                });
            });
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const baseVolume = e.target.value / 100;
                this.audioConfig.volume = baseVolume;

                // Adjust volumes for different tracks
                this.f1Theme.volume = baseVolume * 0.65;
                this.racingMusic.volume = baseVolume * 0.75;
                this.victoryMusic.volume = baseVolume * 0.8;
            });
        }
    }

    startGame() {
        console.log('Starting game...');
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.gameLoop(this.lastFrameTime);

        // Hide the start screen
        const startScreen = document.getElementById('startScreen');
        if (startScreen) {
            startScreen.classList.add('hidden');
        }
        // Stop victory music if it's playing
        if (this.victoryMusic) {
            this.victoryMusic.pause();
            this.victoryMusic.currentTime = 0;
        }

        // Start racing music
        this.playWithFade(this.racingMusic, this.f1Theme);
    }

    gameLoop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = timestamp - (this.lastFrameTime || timestamp);
        this.lastFrameTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        if (!this.isRunning) return;

        this.player.update();
        this.gameSpeed = GAME_CONFIG.BASE_GAME_SPEED + (this.score * GAME_CONFIG.DIFFICULTY_SCALING.SPEED_SCALING_FACTOR);

        // Spawn obstacles
        this.spawnTimer += deltaTime;
        if (this.spawnTimer > this.spawnInterval) {
            const carsToSpawn = Math.random() < 0.4 ? 2 : 1;
            for (let i = 0; i < carsToSpawn; i++) {
                const obstacle = this.spawnObstacle();
                if (obstacle) {
                    this.obstacles.push(obstacle);
                }
            }
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(GAME_CONFIG.DIFFICULTY_SCALING.MIN_SPAWN_INTERVAL, GAME_CONFIG.SPAWN_INTERVALS.DESKTOP - (this.score * GAME_CONFIG.DIFFICULTY_SCALING.SPAWN_INTERVAL_REDUCTION));
        }

        // Update obstacles and check score
        this.obstacles = this.obstacles.filter(obstacle => {
            const isOffscreen = obstacle.update();
            if (isOffscreen) {
                this.score += 1;
                this.updateUI();

                if (this.score >= this.targetScore && !this.isWinning) {
                    this.showBirthdayCelebration();
                }
            }
            return !isOffscreen;
        });

        if (!this.isWinning) {
            this.checkCollisions();
        }
    }

    draw() {
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
        
        for (let i = 1; i < 3; i++) {
            const x = laneWidth * i;
            for (let y = -this.canvas.height + (this.lastTime * 0.1 % 50); y < this.canvas.height; y += 50) {
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
        if (!this.isMobile) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = `${20 * this.scale}px Arial`;
            this.ctx.fillText(`Speed: ${Math.floor(this.gameSpeed * 100)} km/h`, 20 * this.scale, 60 * this.scale);
        }
    }

    updateUI() {
        const scoreDisplay = document.getElementById('scoreDisplay');
        const speedDisplay = document.getElementById('speedDisplay');
        
        if (scoreDisplay) scoreDisplay.textContent = `${this.score}/${this.targetScore}`;
        if (speedDisplay) speedDisplay.textContent = Math.floor(this.gameSpeed * 100);
    }

    async showBirthdayCelebration() {
        this.isWinning = true;
        this.isRunning = false;

        // Switch to victory music with delay
        await this.fadeOut(this.racingMusic);
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.fadeIn(this.victoryMusic);

        const celebration = document.createElement('div');
        celebration.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)),
                        url('images/senna-bg.jpg');
            background-size: cover;
            background-position: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeIn 1s ease-in;
        `;

        celebration.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div class="game-logo"></div>
                <h1 class="game-title" style="animation: scaleIn 1s ease-out; white-space: nowrap;">
                    🏆&nbsp;Champion&nbsp;🏆
                </h1>
                <p style="color: #fff; font-size: 24px; margin: 20px 0; 
                          animation: slideIn 1s ease-out;">
                    Happy Birthday!<br>
                    Just like Senna, you've achieved greatness!<br>
                    Score: ${this.score}/${this.targetScore}
                </p>
                <button class="start-button" id="celebrationButton">
                    Race Again
                </button>
            </div>
        `;

        document.getElementById('gameContainer').appendChild(celebration);

        const fireworksCanvas = document.createElement('canvas');
        fireworksCanvas.id = 'fireworksCanvas';
        fireworksCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1001;
        `;
        document.getElementById('gameContainer').appendChild(fireworksCanvas);

        const fwCtx = fireworksCanvas.getContext('2d');
        fireworksCanvas.width = fireworksCanvas.clientWidth;
        fireworksCanvas.height = fireworksCanvas.clientHeight;

        this.fireworks = [];

        const animateFireworks = () => {
            fwCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
            fwCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            fwCtx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

            if (Math.random() < 0.05) {
                this.fireworks.push(new Firework(fireworksCanvas.width, fireworksCanvas.height));
            }

            this.fireworks.forEach(firework => {
                firework.update();
                firework.draw(fwCtx);
            });

            requestAnimationFrame(animateFireworks);
        };

        animateFireworks();

        const celebrationButton = document.getElementById('celebrationButton');
        if (celebrationButton) {
            celebrationButton.addEventListener('click', () => {
                celebration.remove();
                fireworksCanvas.remove();
                this.setupGame();
                this.startGame();
            });
        }
    }

    checkCollisions() {
        for (let obstacle of this.obstacles) {
            if (this.detectCollision(this.player, obstacle)) {
                this.gameOver();
                break;
            }
        }
    }

    detectCollision(a, b) {
        // Use more precise and performance-friendly collision detection
        return !(
            a.x + a.width <= b.x ||
            a.x >= b.x + b.width ||
            a.y + a.height <= b.y ||
            a.y >= b.y + b.height
        );
    }

    async gameOver() {
        if (!this.isWinning) {
            this.isRunning = false;
            
            // Switch back to F1 theme after crash
            await this.playWithFade(this.f1Theme, this.racingMusic);

            const startScreen = document.getElementById('startScreen');
            if (startScreen) {
                startScreen.classList.remove('hidden');
                startScreen.style.backgroundImage = `
                    linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)),
                    url('images/senna-helmet.jpg')`;
                startScreen.innerHTML = `
                    <div class="game-logo"></div>
                    <h1 class="game-title">Race Over</h1>
                    <div class="quote">
                        Score: ${this.score}/${this.targetScore}<br>
                        "Sometimes you have to go through the darkness 
                        to get to the light." - Ayrton Senna
                    </div>
                    <button class="start-button" id="startButton">Try Again</button>
                `;
                
                document.getElementById('startButton').addEventListener('click', () => {
                    this.setupGame();
                    this.startGame();
                });
            }
        }
    }

    async fadeOut(audio) {
        if (!audio || audio.paused) return;

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
    }

    async fadeIn(audio) {
        if (!audio) return;

        audio.volume = 0;
        audio.play().catch(e => console.log('Audio play failed:', e));

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
    }

    /**
     * Fades out the current audio track and fades in the new audio track.
     * @param {Audio} newTrack - The new audio track to play.
     * @param {Audio} [currentTrack=null] - The current audio track to fade out.
     */
    async playWithFade(newTrack, currentTrack = null) {
        if (currentTrack) {
            await this.fadeOut(currentTrack);
        }
        await this.fadeIn(newTrack);
    }

    spawnObstacle() {
        const obstacle = new Obstacle(this);
        console.log('Obstacle created');
        return obstacle;
    }
}

// Ensure Game is exported
export default Game;
