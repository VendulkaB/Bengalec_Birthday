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
        this.vy += 0.1; // Gravity
        this.alpha -= 0.01;
    }

    draw(ctx) {
        ctx.fillStyle = this.color.replace(')', `, ${this.alpha})`).replace('rgb', 'rgba');
        ctx.fillRect(this.x, this.y, 2, 2);
    }
}

class Game {
    constructor() {
        this.preloadAssets().then(() => {
            this.setupCanvas();
            this.setupGame();
            this.setupControls();
            this.setupEventListeners();
            this.setupAudio();
            console.log('Game initialization complete');
        }).catch(error => {
            console.error('Error during initialization:', error);
        });
    }

    async preloadAssets() {
        console.log('Starting asset preload...');
        try {
            // Preload images
            const images = [
                'images/senna-bg.jpg',
                'images/senna-helmet.jpg',
                'images/senna-logo.png'
            ];

            await Promise.all(images.map(src => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = src;
                });
            }));

            console.log('Assets preloaded successfully');
        } catch (error) {
            console.error('Error preloading assets:', error);
            throw error;
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        this.canvas.width = Math.min(container.clientWidth, 800); // Set a maximum width
        this.canvas.height = Math.min(container.clientHeight, 600); // Set a maximum height
        this.scale = this.canvas.width / 800;
    }

    setupGame() {
        this.isRunning = false;
        this.isWinning = false;
        this.hasPlayedIntro = false;
        this.player = new Player(this);
        this.obstacles = [];
        this.powerups = [];
        this.score = 0;
        this.targetScore = 38;
        this.gameSpeed = 1.2;
        this.spawnTimer = 0;
        this.spawnInterval = 1200;
        this.lastTime = 0;
    }

    async setupAudio() {
        this.audioConfig = {
            isMuted: false,
            volume: 0.7,
            fadeTime: 2000
        };

        // Initialize all audio tracks
        this.f1Theme = new Audio('sounds/f1-theme.mp3');
        this.racingMusic = new Audio('sounds/promise-me.mp3');
        this.victoryMusic = new Audio('sounds/legends-made.mp3');

        // Configure volumes
        this.f1Theme.volume = 0.65;
        this.racingMusic.volume = 0.75;
        this.victoryMusic.volume = 0.8;

        // Set looping for background tracks
        this.f1Theme.loop = true;
        this.racingMusic.loop = true;

        try {
            await Promise.all([
                this.loadAudio(this.f1Theme),
                this.loadAudio(this.racingMusic),
                this.loadAudio(this.victoryMusic)
            ]);

            // Start F1 theme immediately for intro page
            this.f1Theme.play().catch(() => {
                console.log('Auto-play failed, waiting for user interaction');
                document.addEventListener('click', () => {
                    if (!this.hasPlayedIntro) {
                        this.f1Theme.play();
                        this.hasPlayedIntro = true;
                    }
                }, { once: true });
            });

            this.setupAudioControls();
        } catch (error) {
            console.error('Error loading audio:', error);
        }
    }

    loadAudio(audio) {
        return new Promise((resolve, reject) => {
            audio.addEventListener('canplaythrough', resolve, { once: true });
            audio.addEventListener('error', reject, { once: true });
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
    
    setupControls() {
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        this.isMouseControl = false;
    
        if (this.isTouchDevice) {
            this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
            this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
            this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
        }
    
        this.mouseControl = document.getElementById('mouseControl');
    }
    
    handleTouchStart(e) {
        const touch = e.touches[0];
        const canvasRect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX - canvasRect.left;
    
        if (touchX < this.canvas.width / 2) {
            this.player.moveLeft = true;
        } else {
            this.player.moveRight = true;
        }
    }
    
    handleTouchMove(e) {
        const touch = e.touches[0];
        const canvasRect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX - canvasRect.left;
    
        if (touchX < this.canvas.width / 2) {
            this.player.moveLeft = true;
            this.player.moveRight = false;
        } else {
            this.player.moveLeft = false;
            this.player.moveRight = true;
        }
    }
    
    handleTouchEnd() {
        this.player.moveLeft = false;
        this.player.moveRight = false;
    }
    
    setupEventListeners() {
        // Start button
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', () => this.startGame());
        }
    
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.player.moveLeft = true;
            if (e.key === 'ArrowRight') this.player.moveRight = true;
        });
    
        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft') this.player.moveLeft = false;
            if (e.key === 'ArrowRight') this.player.moveRight = false;
        });
    
        // Mouse controls
        if (this.mouseControl) {
            this.mouseControl.addEventListener('mousemove', (e) => {
                if (this.isRunning) {
                    const rect = this.canvas.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, mouseX - this.player.width / 2));
                }
            });
        }
    
        // Mobile touch controls
        const leftButton = document.getElementById('leftButton');
        const rightButton = document.getElementById('rightButton');
    
        if (leftButton && rightButton) {
            ['touchstart', 'mousedown'].forEach(eventType => {
                leftButton.addEventListener(eventType, () => this.player.moveLeft = true);
                rightButton.addEventListener(eventType, () => this.player.moveRight = true);
            });
    
            ['touchend', 'mouseup'].forEach(eventType => {
                leftButton.addEventListener(eventType, () => this.player.moveLeft = false);
                rightButton.addEventListener(eventType, () => this.player.moveRight = false);
            });
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
    
    async playWithFade(newTrack, currentTrack = null) {
        if (currentTrack) {
            await this.fadeOut(currentTrack);
        }
        await this.fadeIn(newTrack);
    }
    
    async startGame() {
        console.log('Starting game...');
        
        const loadingScreen = document.createElement('div');
        loadingScreen.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: #FFD700;
            font-size: 24px;
        `;
        loadingScreen.textContent = 'Loading...';
        document.getElementById('gameContainer').appendChild(loadingScreen);
    
        try {
            // Stop F1 theme before starting the racing music
            await this.fadeOut(this.f1Theme);
    
            // Switch to racing music
            await this.playWithFade(this.racingMusic);
            
            this.isRunning = true;
            this.isWinning = false;
            this.score = 0;
            this.gameSpeed = 1.2;
            this.obstacles = [];
            this.spawnTimer = 0;
            
            const startScreen = document.getElementById('startScreen');
            if (startScreen) startScreen.classList.add('hidden');
            
            loadingScreen.remove();
            
            const mouseControl = document.getElementById('mouseControl');
            if (mouseControl) mouseControl.classList.remove('hidden');
            
            this.lastTime = performance.now();
            requestAnimationFrame((time) => this.gameLoop(time));
        } catch (error) {
            console.error('Error starting game:', error);
            loadingScreen.textContent = 'Error loading game. Please refresh.';
        }
    }
    
    update(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
    
        if (!this.isRunning) return;
    
        this.player.update();
        this.gameSpeed = 1.2 + (this.score / 40);
    
        this.spawnTimer += deltaTime;
        if (this.spawnTimer > this.spawnInterval) {
            const carsToSpawn = Math.random() < 0.4 ? 2 : 1;
            for (let i = 0; i < carsToSpawn; i++) {
                this.obstacles.push(new Obstacle(this));
            }
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(600, 1200 - (this.score * 15));
        }
    
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
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
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
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `${20 * this.scale}px Arial`;
        this.ctx.fillText(`Speed: ${Math.floor(this.gameSpeed * 100)} km/h`, 20 * this.scale, 60 * this.scale);
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
        this.fireworks = [];
    
        // Switch to victory music
        await this.fadeOut(this.racingMusic);
        await new Promise(resolve => setTimeout(resolve, 500));
        this.victoryMusic.play().catch(e => console.log('Audio play failed:', e));
    
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
    
        // Create canvas for fireworks
        const fireworksCanvas = document.createElement('canvas');
        fireworksCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;
        fireworksCanvas.width = this.canvas.width;
        fireworksCanvas.height = this.canvas.height;
    
        celebration.appendChild(fireworksCanvas);
        const fwCtx = fireworksCanvas.getContext('2d');
    
        // Animation function for fireworks
        const animateFireworks = () => {
            if (!this.isWinning) return;
    
            fwCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
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
    
        // Add celebration content
        const content = document.createElement('div');
        content.innerHTML = `
            <div style="text-align: center; padding: 20px; position: relative; z-index: 1001;">
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
    
        celebration.appendChild(content);
        document.getElementById('gameContainer').appendChild(celebration);
    
        // Start fireworks animation
        animateFireworks();
    
        const celebrationButton = document.getElementById('celebrationButton');
        if (celebrationButton) {
            celebrationButton.addEventListener('click', () => {
                this.victoryMusic.pause();
                this.victoryMusic.currentTime = 0;
                this.isWinning = false;
                celebration.remove();
                // Start racing music for new game
                this.racingMusic.play();
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
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }
    
    gameLoop(timestamp) {
        if (this.isRunning) {
            this.update(timestamp);
            this.draw();
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }
    
    gameOver() {
        if (!this.isWinning) {
            this.isRunning = false;
    
            // Stop racing music and switch back to F1 theme
            this.racingMusic.pause();
            this.racingMusic.currentTime = 0;
            this.f1Theme.currentTime = 0;
            this.f1Theme.play().catch(e => console.log('Audio play failed:', e));
    
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
}
