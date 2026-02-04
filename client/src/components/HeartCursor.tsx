import React, { useEffect, useRef, useState } from 'react';

export const HeartCursor: React.FC = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const positionRef = useRef({ x: 0, y: 0 });
    const targetRef = useRef({ x: 0, y: 0 });
    const velocityRef = useRef({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;

        // Spring physics constants
        const stiffness = 0.15;
        const damping = 0.75;

        const handleMouseMove = (e: MouseEvent) => {
            targetRef.current.x = e.clientX;
            targetRef.current.y = e.clientY;
            if (!isVisible) setIsVisible(true);
        };

        const handleMouseLeave = () => {
            setIsVisible(false);
        };

        const handleMouseEnter = () => {
            setIsVisible(true);
        };

        // Animation loop with spring physics
        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);

            // Spring force calculation
            const dx = targetRef.current.x - positionRef.current.x;
            const dy = targetRef.current.y - positionRef.current.y;

            // Apply spring force
            velocityRef.current.x += dx * stiffness;
            velocityRef.current.y += dy * stiffness;

            // Apply damping
            velocityRef.current.x *= damping;
            velocityRef.current.y *= damping;

            // Update position
            positionRef.current.x += velocityRef.current.x;
            positionRef.current.y += velocityRef.current.y;

            // Apply transform
            cursor.style.transform = `translate(${positionRef.current.x - 16}px, ${positionRef.current.y - 16}px)`;
        };
        animate();

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, [isVisible]);

    // Don't render on touch devices
    if (typeof window !== 'undefined' && 'ontouchstart' in window) {
        return null;
    }

    return (
        <>
            {/* Hide default cursor globally */}
            <style>{`
        * { cursor: none !important; }
      `}</style>

            {/* Heart cursor */}
            <div
                ref={cursorRef}
                className="fixed top-0 left-0 z-[9999] pointer-events-none"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    willChange: 'transform',
                }}
            >
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{
                        filter: 'drop-shadow(0 0 8px rgba(255, 0, 127, 0.8)) drop-shadow(0 0 16px rgba(255, 0, 127, 0.4))',
                    }}
                >
                    <path
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        fill="url(#heartGradient)"
                    />
                    <defs>
                        <linearGradient id="heartGradient" x1="2" y1="3" x2="22" y2="21">
                            <stop offset="0%" stopColor="#ff007f" />
                            <stop offset="50%" stopColor="#ff1493" />
                            <stop offset="100%" stopColor="#ff69b4" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </>
    );
};
