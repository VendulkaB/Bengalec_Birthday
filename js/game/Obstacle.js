class Obstacle {
    constructor(game) {
        this.game = game;
        this.width = 50 * game.scale;
        this.height = 80 * game.scale;
        this.x = Math.random() * (game.canvas.width - this.width);
        this.y = -this.height;
        this.speed = (3 + Math.random() * 2) * game.scale * game.gameSpeed;
        this.team = this.getRandomTeam();
    }

    getRandomTeam() {
        const teams = [
            {
                mainColor: '#00D2BE',    // Mercedes
                secondColor: '#00B0B2',
                accent: '#000000'
            },
            {
                mainColor: '#DC0000',    // Ferrari
                secondColor: '#950000',
                accent: '#FFFFFF'
            },
            {
                mainColor: '#0600EF',    // Red Bull
                secondColor: '#1E41FF',
                accent: '#FFD700'
            },
            {
                mainColor: '#2293D1',    // Alpine
                secondColor: '#0F65A1',
                accent: '#FF1E1E'
            },
            {
                mainColor: '#006F62',    // Aston Martin
                secondColor: '#004C42',
                accent: '#FFFFFF'
            }
        ];
        return teams[Math.floor(Math.random() * teams.length)];
    }

    update() {
        this.y += this.speed;
        return this.y > this.game.canvas.height;
    }

    draw(ctx) {
        // Draw car body
        ctx.fillStyle = this.team.mainColor;
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
        ctx.fillStyle = this.team.secondColor;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.3, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width * 0.9, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width * 0.85, this.y + this.height * 0.7);
        ctx.lineTo(this.x + this.width * 0.25, this.y + this.height * 0.7);
        ctx.closePath();
        ctx.fill();

        // Front wing
        ctx.fillStyle = this.team.accent;
        ctx.fillRect(this.x + this.width * 0.2, this.y, this.width * 0.6, this.height * 0.05);

        // Rear wing
        ctx.fillStyle = this.team.accent;
        ctx.fillRect(this.x + this.width * 0.2, this.y + this.height * 0.85, 
                     this.width * 0.6, this.height * 0.04);

        // Cockpit
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.4, this.y + this.height * 0.25);
        ctx.lineTo(this.x + this.width * 0.6, this.y + this.height * 0.25);
        ctx.lineTo(this.x + this.width * 0.55, this.y + this.height * 0.35);
        ctx.lineTo(this.x + this.width * 0.45, this.y + this.height * 0.35);
        ctx.closePath();
        ctx.fill();

        // Wheels
        ctx.fillStyle = '#1a1a1a';
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

export default Obstacle;
