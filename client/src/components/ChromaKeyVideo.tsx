import React, { useRef, useEffect, useState } from 'react';

interface ChromaKeyVideoProps {
  src: string;
  className?: string;
  // Any pixel with Red value below this will be perfectly transparent
  rThreshold?: number; 
}

export const ChromaKeyVideo: React.FC<ChromaKeyVideoProps> = ({ 
  src, 
  className = '',
  rThreshold = 150 // Since the ticket is neon pink, its R value is very high (200+). Dark background is < 50.
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Use willReadFrequently for heavy getImageData operations
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animationFrameId: number;

    const processFrame = () => {
      if (video.paused || video.ended) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }
      
      // Match canvas internal resolution to video source resolution
      if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
      if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
      
      if (video.videoWidth === 0) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      // Draw original frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Extract pixel data
      const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frameData.data;
      const len = data.length;

      // Chroma Key Loop
      // The background is a dark vignette green/grey. The ticket is neon pink.
      // We brutally drop the Alpha of any pixel that is not bright red/pink.
      for (let i = 0; i < len; i += 4) {
        const r = data[i];     // Red
        const g = data[i + 1]; // Green
        const b = data[i + 2]; // Blue
        
        // If the red channel is below our threshold, it's the background.
        if (r < rThreshold) {
          data[i + 3] = 0; // Set Alpha to 0 (fully transparent)
        } else {
          // Optional: soften the edges of the ticket by smoothing the alpha based on red
          // Instead of a harsh cutoff, we can ramp it, but harsh is safer to drop all background.
        }
      }
      
      // Push the manipulated pixels back to canvas
      ctx.putImageData(frameData, 0, 0);
      animationFrameId = requestAnimationFrame(processFrame);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      processFrame();
    };

    video.addEventListener('play', handlePlay);

    // Force play in case autoplay was blocked until interaction
    video.play().catch(e => console.log("Autoplay prevented:", e));

    return () => {
      video.removeEventListener('play', handlePlay);
      cancelAnimationFrame(animationFrameId);
    };
  }, [rThreshold]);

  return (
    <div className={`relative ${className}`}>
      {/* Hidden source video */}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        crossOrigin="anonymous"
        className="hidden pointer-events-none"
      />
      {/* Transparent Canvas Output */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-contain pointer-events-none drop-shadow-[0_0_40px_rgba(255,0,127,0.5)]" 
      />
    </div>
  );
};
