import React, { useRef, useEffect, useState } from 'react';

interface ChromaKeyVideoProps {
  src: string;
  className?: string;
  rThreshold?: number;
}

export const ChromaKeyVideo: React.FC<ChromaKeyVideoProps> = ({
  src,
  className = '',
  rThreshold = 150
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animationFrameId: number;
    let lastFrameTime = 0;
    const FRAME_INTERVAL = 1000 / 30; // Throttle to 30fps — saves ~50% CPU

    const processFrame = (timestamp: number) => {
      if (video.paused || video.ended || video.videoWidth === 0) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      // Throttle: skip frame if not enough time elapsed
      if (timestamp - lastFrameTime < FRAME_INTERVAL) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }
      lastFrameTime = timestamp;

      // Match canvas to video resolution (once)
      if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
      if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frameData.data;
      const len = data.length;
      const threshold = rThreshold;

      // Tight chroma key loop — inline threshold for speed
      for (let i = 0; i < len; i += 4) {
        if (data[i] < threshold) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(frameData, 0, 0);

      if (!isLoaded) setIsLoaded(true);
      animationFrameId = requestAnimationFrame(processFrame);
    };

    const handlePlay = () => {
      requestAnimationFrame(processFrame);
    };

    video.addEventListener('play', handlePlay);
    video.play().catch(() => {});

    return () => {
      video.removeEventListener('play', handlePlay);
      cancelAnimationFrame(animationFrameId);
    };
  }, [rThreshold]);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        crossOrigin="anonymous"
        className="hidden pointer-events-none"
        preload="metadata"
      />
      {/* Fade in canvas once first frame is processed */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain pointer-events-none drop-shadow-[0_0_40px_rgba(255,0,127,0.5)] transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};
