import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, ShieldCheck } from 'lucide-react';

interface VideoCallProps {
  roomUrl: string;
  onLeave: () => void;
  partnerName: string;
}

export const VideoCall: React.FC<VideoCallProps> = ({ roomUrl, onLeave, partnerName }) => {
  const callFrameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !roomUrl) return;

    let callFrame: any = null;
    let isMounted = true;

    const initializeCall = async () => {
      try {
        // CRITICAL: Destroy any existing Daily instances ASYNCHRONOUSLY before creating a new one
        // This prevents the "Duplicate DailyIframe instances are not allowed" error

        // First, clean up our ref if it exists
        if (callFrameRef.current) {
          console.log('Destroying existing ref instance');
          try {
            await callFrameRef.current.destroy();
          } catch (err) {
            console.warn('Error destroying ref instance:', err);
          }
          callFrameRef.current = null;
        }

        // Then check for any global Daily instances
        const existingFrames = DailyIframe.getCallInstance();
        if (existingFrames) {
          console.log('Found existing global Daily instance, destroying it');
          try {
            await existingFrames.destroy();
          } catch (err) {
            console.warn('Error destroying global instance:', err);
          }
          // Wait a bit to ensure cleanup is complete
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Only proceed if component is still mounted
        if (!isMounted) return;

        // Create Daily.co call frame
        callFrame = DailyIframe.createFrame(containerRef.current!, {
          iframeStyle: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '0'
          },
          showLeaveButton: false,
          showFullscreenButton: true
        });

        callFrameRef.current = callFrame;

        // Join the room
        await callFrame.join({ url: roomUrl });

        if (isMounted) {
          setIsJoined(true);
        }
      } catch (error: any) {
        console.error('Error initializing call:', error);
        if (isMounted) {
          alert('Failed to join call: ' + (error.message || 'Unknown error'));
          onLeave();
        }
      }
    };

    // Start initialization
    initializeCall();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (callFrame) {
        callFrame.leave()
          .then(() => callFrame.destroy())
          .catch((err: any) => {
            console.error('Error during cleanup:', err);
            // Force destroy even if leave fails
            try {
              callFrame.destroy();
            } catch (destroyErr) {
              console.error('Error destroying call frame:', destroyErr);
            }
          });
      }
      callFrameRef.current = null;
    };
  }, [roomUrl, onLeave]);

  const toggleMute = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalAudio(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalVideo(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndCall = () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave();
    }
    onLeave();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent backdrop-blur z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-neon" />
          <div>
            <h3 className="text-white font-bold">{partnerName}</h3>
            <p className="text-xs text-gray-400">{isJoined ? 'Connected • Encrypted' : 'Connecting...'}</p>
          </div>
        </div>
        <button
          onClick={handleEndCall}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Video Container - Daily.co  iframe */}
      <div ref={containerRef} className="flex-1 relative bg-gray-900" />

      {/* Call Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent backdrop-blur flex items-center justify-center gap-6 z-10">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
        >
          {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
        </button>

        <button
          onClick={handleEndCall}
          className="p-5 rounded-full bg-red-600 hover:bg-red-700 transition-all shadow-lg"
        >
          <PhoneOff className="w-8 h-8 text-white" />
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
        </button>
      </div>
    </div>
  );
};