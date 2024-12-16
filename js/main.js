    
    // Add background music (optional)
    const bgMusic = new Audio('assets/sounds/background.mp3');
    bgMusic.loop = true;
    
    // Setup sound effects
    const sounds = {
        collision: new Audio('assets/sounds/collision.mp3'),
        powerup: new Audio('assets/sounds/powerup.mp3'),
        engine: new Audio('assets/sounds/engine.mp3')
    };

    // Handle window focus/blur
    window.addEventListener('blur', () => {
        if (game.isRunning) {
            game.pause();
        }
    });

    // Handle screen resize
    window.addEventListener('resize', () => {
        game.handleResize();
    });

    // Start button click handler
    document.getElementById('startButton').addEventListener('click', () => {
        bgMusic.play().catch(() => {
            console.log('Audio playback requires user interaction first');
        });
        game.start();
    });

    // Instructions button click handler
    document.getElementById('instructionsButton').addEventListener('click', () => {
        showInstructions();
    });

function showInstructions() {
    const instructions = `
        <div class="instructions">
            <h2>How to Play</h2>
            <ul>
                <li>Use ← → arrow keys to move</li>
                <li>Hold SPACE for speed boost</li>
                <li>Collect powerups:</li>
                <ul>
                    <li>🛡️ Shield - Temporary invincibility</li>
                    <li>⚡ Boost - Refill boost meter</li>
                    <li>⭐ Points - Extra score</li>
                </ul>
                <li>Avoid obstacles and survive as long as possible!</li>
            </ul>
            <button onclick="this.parentElement.remove()">Got it!</button>
        </div>
    `;
    
    const div = document.createElement('div');
    div.innerHTML = instructions;
    document.body.appendChild(div);
}
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    
    // Initialize game instance
    const game = new Game();
    
    // Debug logging
    console.log('Game instance created');
    
    // Add keyboard event listeners
    document.addEventListener('keydown', (event) => {
        // Prevent space bar from scrolling the page
        if (event.code === 'Space') {
            event.preventDefault();
        }
    });
    
    // Log when start button is clicked
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', () => {
            console.log('Start button clicked, game should start...');
        });
    }
});
