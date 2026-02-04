import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform float uRippleStrength;
  varying vec2 vUv;

  // Simplex noise function for organic feel
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    
    // Cursor distance for ripple
    vec2 mouseNorm = uMouse / uResolution;
    float dist = distance(uv * aspect, mouseNorm * aspect);
    
    // Ripple wave from cursor
    float ripple = sin(dist * 25.0 - uTime * 3.0) * exp(-dist * 4.0) * uRippleStrength;
    
    // Ambient liquid motion
    float noise1 = snoise(uv * 3.0 + uTime * 0.2) * 0.02;
    float noise2 = snoise(uv * 5.0 - uTime * 0.15) * 0.015;
    
    // Combine distortions
    vec2 distortion = vec2(ripple * 0.03 + noise1, ripple * 0.03 + noise2);
    vec2 distortedUv = uv + distortion;
    
    // Background gradient with distortion
    vec3 color1 = vec3(0.0, 0.0, 0.0); // Black
    vec3 color2 = vec3(0.08, 0.0, 0.12); // Deep purple
    vec3 color3 = vec3(0.15, 0.0, 0.2); // Neon hint
    
    // Create flowing gradient
    float gradient = distortedUv.y + snoise(distortedUv * 2.0 + uTime * 0.1) * 0.2;
    vec3 baseColor = mix(color1, color2, smoothstep(0.0, 0.6, gradient));
    baseColor = mix(baseColor, color3, smoothstep(0.6, 1.0, gradient));
    
    // Add subtle highlight near cursor
    float glow = exp(-dist * 3.0) * uRippleStrength * 0.3;
    vec3 glowColor = vec3(1.0, 0.0, 0.5); // Neon pink
    baseColor += glowColor * glow;
    
    gl_FragColor = vec4(baseColor, 1.0);
  }
`;

export const LiquidBackground: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
    const rippleStrengthRef = useRef(0);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        // Shader material
        const uniforms = {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2) },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uRippleStrength: { value: 0 }
        };

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Mouse handling with throttling
        let lastMoveTime = 0;
        const handleMouseMove = (e: MouseEvent) => {
            const now = Date.now();
            if (now - lastMoveTime < 16) return; // ~60fps throttle
            lastMoveTime = now;

            mouseRef.current.targetX = e.clientX;
            mouseRef.current.targetY = window.innerHeight - e.clientY; // Flip Y for WebGL
            rippleStrengthRef.current = 1;
        };

        // Touch handling
        const handleTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            mouseRef.current.targetX = touch.clientX;
            mouseRef.current.targetY = window.innerHeight - touch.clientY;
            rippleStrengthRef.current = 1;
        };

        // Resize handling
        const handleResize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('resize', handleResize, { passive: true });

        // Animation loop
        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);

            // Smooth mouse interpolation (spring effect)
            mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
            mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

            // Decay ripple strength
            rippleStrengthRef.current *= 0.98;

            uniforms.uTime.value += 0.016;
            uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);
            uniforms.uRippleStrength.value = rippleStrengthRef.current;

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            geometry.dispose();
            material.dispose();
            container.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{ background: 'black' }}
        />
    );
};
