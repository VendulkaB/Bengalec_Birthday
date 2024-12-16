class Player {
    constructor(game) {
        this.game = game;
        this.width = 50 * game.scale;
        this.height = 80 * game.scale;
        this.x = game.canvas.width / 2 - this.width / 2;
        this.y = game.canvas.height - this.height - 20 * game.scale;
        this.speed = 5 * game.scale;
        this.moveLeft = false;
        this.moveRight = false;
    }

    update() {
        if (this.moveLeft) {
            this.x = Math.max(0, this.x - this.speed);
        }
        if (this.moveRight) {
            this.x = Math.min(this.game.canvas.width - this.width, this.x + this.speed);
        }
    }

    draw(ctx) {
        // Define colors
        const mainRed = '#FF1801';      // McLaren Red
        const darkRed = '#940000';      // Darker shade
        const marlboroWhite = '#FFFFFF'; // Sponsor color
        const carbonBlack = '#1A1A1A';   // Carbon fiber parts

        // Draw car body
        ctx.fillStyle = mainRed;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.45, this.y);
        ctx.lineTo(this.x + this.width * 0.55, this.y);
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.25);
        ctx.lineTo(this.x + this.width * 0.85, this.y + this.height * 0.6);
        ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.95);
        ctx.lineTo(this.x + this.width * 0.3, this.y + this.height * 0.95);
        ctx.lineTo(this.x + this.width * 0.15, this.y + this.height * 0.6);
        ctx.lineTo(this.x + this.width * 0.2, this.y + this.height * 0.25);
        ctx.closePath();
        ctx.fill();

        // Sidepods
        ctx.fillStyle = darkRed;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.3, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width * 0.9, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width * 0.85, this.y + this.height * 0.7);
        ctx.lineTo(this.x + this.width * 0.25, this.y + this.height * 0.7);
        ctx.closePath();
        ctx.fill();

        // Front wing
        ctx.fillStyle = marlboroWhite;
        ctx.fillRect(this.x + this.width * 0.2, this.y, this.width * 0.6, this.height * 0.05);

        // Rear wing
        ctx.fillStyle = marlboroWhite;
        ctx.fillRect(this.x + this.width * 0.2, this.y + this.height * 0.85, 
                     this.width * 0.6, this.height * 0.04);

        // Cockpit and Halo
        ctx.fillStyle = carbonBlack;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.4, this.y + this.height * 0.25);
        ctx.lineTo(this.x + this.width * 0.6, this.y + this.height * 0.25);
        ctx.lineTo(this.x + this.width * 0.55, this.y + this.height * 0.35);
        ctx.lineTo(this.x + this.width * 0.45, this.y + this.height * 0.35);
        ctx.closePath();
        ctx.fill();

        // Senna's Yellow Helmet
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.5, this.y + this.height * 0.32, 
                this.width * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Wheels
        ctx.fillStyle = carbonBlack;
        // Front wheels
        ctx.fillRect(this.x + this.width * 0.1, this.y + this.height * 0.15, 
                     this.width * 0.1, this.height * 0.15);
        ctx.fillRect(this.x + this.width * 0.8, this.y + this.height * 0.15, 
                     this.width * 0.1, this.height * 0.15);
        // Rear wheels
        ctx.fillRect(this.x + this.width * 0.1, this.y + this.height * 0.6, 
                     this.width * 0.1, this.height * 0.15);
        ctx.fillRect(this.x + this.width * 0.8, this.y + this.height * 0.6, 
                     this.width * 0.1, this.height * 0.15);
    }
}