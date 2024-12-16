// Remove 'let' or 'const' if it's there at the start
class PowerUp {
    constructor(game) {
        this.game = game;
        this.width = 30 * game.scale;
        this.height = 30 * game.scale;
        this.x = Math.random() * (game.canvas.width - this.width);
        this.y = -this.height;
        this.speed = 2 * game.scale;
        
        this.types = ['shield', 'boost', 'points'];
        this.type = this.types[Math.floor(Math.random() * this.types.length)];
    }

    update() {
        this.y += this.speed;
        return this.y > this.game.canvas.height;
    }

    draw(ctx) {
        ctx.fillStyle = this.getTypeColor();
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    getTypeColor() {
        switch(this.type) {
            case 'shield': return '#00ff00';
            case 'boost': return '#ffa500';
            case 'points': return '#ffff00';
            default: return '#ffffff';
        }
    }
}