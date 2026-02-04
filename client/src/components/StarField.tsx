import React, { useEffect, useRef } from 'react';

interface Star {
    x: number;
    y: number;
    size: number;
    baseOpacity: number;
    twinklePhase: number;
    twinkleSpeed: number;
    layer: number; // 0 (back) to 2 (front) for parallax
    color: string;
}

interface ShootingStar {
    x: number;
    y: number;
    length: number;
    speed: number;
    angle: number;
    life: number;
    opacity: number;
    width: number;
}

export const StarField: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let stars: Star[] = [];
        let shootingStars: ShootingStar[] = [];
        const colors = [
            'rgba(255, 255, 255,',     // White
            'rgba(230, 240, 255,',     // Blue-ish
            'rgba(255, 253, 240,',     // Warm white
        ];

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
            initStars();
        };

        const initStars = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            // Reduced density
            const starCount = Math.floor((width * height) / 8000);
            stars = Array.from({ length: starCount }, () => {
                const layer = Math.random();
                return {
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: Math.random() * 0.8 + 0.2 + (layer * 0.5),
                    baseOpacity: Math.random() * 0.6 + 0.3,
                    twinklePhase: Math.random() * Math.PI * 2,
                    twinkleSpeed: 0.02 + Math.random() * 0.03,
                    layer: layer,
                    color: colors[Math.floor(Math.random() * colors.length)],
                };
            });
        };

        let lastShootingStarTime = 0;
        const spawnShootingStar = (currentTime: number) => {
            // Aim for roughly one every 10-15 seconds
            if (currentTime - lastShootingStarTime > 10000 + Math.random() * 5000 && shootingStars.length < 2) {
                const angle = (Math.random() * Math.PI / 4) + Math.PI / 6;
                shootingStars.push({
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight * 0.4,
                    length: Math.random() * 150 + 50,
                    speed: Math.random() * 12 + 8,
                    angle: angle,
                    life: 1.0,
                    opacity: Math.random() * 0.4 + 0.3,
                    width: Math.random() * 1.2 + 0.5,
                });
                lastShootingStarTime = currentTime;
            }
        };

        const draw = (time: number) => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            ctx.clearRect(0, 0, width, height);

            // Draw Star Layers
            stars.forEach(star => {
                // Subtle drift based on layer (parallax)
                const speedMultiplier = 0.03 + (star.layer * 0.08);
                star.y += speedMultiplier;
                star.x += speedMultiplier * 0.15;

                // Wrap
                if (star.y > height) star.y = 0;
                if (star.x > width) star.x = 0;

                // Twinkle Logic
                const twinkle = Math.sin(time / 1000 * star.twinkleSpeed + star.twinklePhase);
                const opacity = star.baseOpacity * (0.7 + twinkle * 0.3);

                ctx.fillStyle = `${star.color} ${opacity})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();

                // Glow for brighter stars
                if (star.layer > 0.8 && opacity > 0.6) {
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = 'white';
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });

            // Draw Shooting Stars
            for (let i = shootingStars.length - 1; i >= 0; i--) {
                const s = shootingStars[i];

                ctx.save();
                ctx.globalAlpha = s.life;

                // Gradient for a "tail" feel
                const gradient = ctx.createLinearGradient(
                    s.x, s.y,
                    s.x - Math.cos(s.angle) * s.length,
                    s.y - Math.sin(s.angle) * s.length
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
                gradient.addColorStop(0.2, `rgba(255, 255, 255, ${s.opacity * 0.5})`);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.beginPath();
                ctx.strokeStyle = gradient;
                ctx.lineWidth = s.width;
                ctx.lineCap = 'round';
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(
                    s.x - Math.cos(s.angle) * s.length,
                    s.y - Math.sin(s.angle) * s.length
                );
                ctx.stroke();
                ctx.restore();

                // Update
                s.x += Math.cos(s.angle) * s.speed;
                s.y += Math.sin(s.angle) * s.speed;
                s.life -= 0.015;

                if (s.life <= 0) {
                    shootingStars.splice(i, 1);
                }
            }

            spawnShootingStar(time);
            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        resize();
        draw(0);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
            style={{
                zIndex: 5,
                background: 'transparent'
            }}
        />
    );
};
