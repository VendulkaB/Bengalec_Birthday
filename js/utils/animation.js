class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExplosion(x, y, color, count = 20) {
        for(let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    update() {
        this.particles = this.particles.filter(particle => particle.life > 0);
        this.particles.forEach(particle => particle.update());
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.life = 1.0;
        this.gravity = 0.1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.life -= 0.02;
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Effects {
    static async shake(element, intensity = 5, duration = 500) {
        const originalPosition = element.style.transform;
        const start = performance.now();

        return new Promise(resolve => {
            function update() {
                const elapsed = performance.now() - start;
                if (elapsed < duration) {
                    const x = Math.random() * intensity - intensity/2;
                    const y = Math.random() * intensity - intensity/2;
                    element.style.transform = `translate(${x}px, ${y}px)`;
                    requestAnimationFrame(update);
                } else {
                    element.style.transform = originalPosition;
                    resolve();
                }
            }
            requestAnimationFrame(update);
        });
    }

    static flash(element, color = '#fff', duration = 100) {
        const originalColor = element.style.backgroundColor;
        element.style.backgroundColor = color;
        setTimeout(() => {
            element.style.backgroundColor = originalColor;
        }, duration);
    }
}