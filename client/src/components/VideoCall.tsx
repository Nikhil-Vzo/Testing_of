import React, { useEffect, useState } from 'react';
import AgoraRTC, {
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack
} from 'agora-rtc-sdk-ng';
import { X, Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { endCall as endCallAPI } from '../services/callSignaling';
import { supabase } from '../lib/supabase';

interface VideoCallProps {
  appId: string;
  channelName: string;
  token: string;
  onLeave: () => void;
  partnerName: string;
  partnerAvatar: string;
  callType: 'audio' | 'video';
  callSessionId: string;
}

export const VideoCall: React.FC<VideoCallProps> = ({ appId, channelName, token, onLeave, partnerName, partnerAvatar, callType, callSessionId }) => {
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [isJoined, setIsJoined] = useState(false);
  const [client] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));
  const { showToast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        // Set up event listeners
        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          console.log('Subscribed to user:', user.uid);

          // Update user in state (replace or add) to trigger effects and re-renders
          setRemoteUsers((prev) => {
            const index = prev.findIndex(u => u.uid === user.uid);
            if (index !== -1) {
              // Create new array with updated user object to trigger re-render
              const newUsers = [...prev];
              newUsers[index] = user;
              return newUsers;
            }
            return [...prev, user];
          });

          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        client.on('user-unpublished', (user, mediaType) => {
          console.log('User unpublished:', user.uid, mediaType);
          if (mediaType === 'video') {
            // For video calls, if they turn off video, we might want to keep them in the list 
            // but just show avatar. If we remove them, it goes to "Waiting...". 
            // Actually, we should only remove them on 'user-left'.
            // However, to re-render the video slot as empty, we might need to update state.
            // But 'remoteUsers' is "users in call". 
            // Let's NOT remove them here, just let the videoTrack be undefined on re-render.
          }
        });

        client.on('user-left', (user) => {
          console.log('User left:', user.uid);
          setRemoteUsers((prev) => prev.filter(u => u.uid !== user.uid));
        });

        // Join channel
        await client.join(appId, channelName, token, null);
        console.log('Joined channel successfully');

        // Create and publish local tracks based on call type
        let audioTrack: IMicrophoneAudioTrack;
        let videoTrack: ICameraVideoTrack | null = null;

        try {
          if (callType === 'audio') {
            // Audio-only: Only request microphone
            audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          } else {
            // Video call: Request both
            [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          }
        } catch (mediaError: any) {
          console.error('Media permission error:', mediaError);
          if (mediaError.code === 'PERMISSION_DENIED' || mediaError.name === 'NotAllowedError') {
            showToast('Microphone/Camera permission denied. Please enable them in browser settings.', 'error');
          } else {
            showToast('Failed to access media devices: ' + mediaError.message, 'error');
          }
          // Don't leave immediately, user might fix permissions? No, we need fresh tracks.
          // Better to leave and let them try again.
          onLeave();
          return;
        }

        setLocalAudioTrack(audioTrack);
        if (videoTrack) {
          setLocalVideoTrack(videoTrack);
          await client.publish([audioTrack, videoTrack]);
          videoTrack.play('local-video');
        } else {
          await client.publish([audioTrack]);
        }

        console.log('Published local tracks');

        setIsJoined(true);

      } catch (error) {
        console.error('Failed to join channel:', error);
        showToast('Failed to join call: ' + (error as Error).message, 'error');
        onLeave();
      }
    };

    init();

    return () => {
      // Cleanup
      localAudioTrack?.close();
      localVideoTrack?.close();
      client.leave();
      client.removeAllListeners();
    };
  }, [appId, channelName, token, onLeave, callType]);

  // Listen for call ended by partner
  useEffect(() => {
    if (!callSessionId) return;

    const channel = supabase
      .channel(`call_status:${callSessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
          filter: `id=eq.${callSessionId}`
        },
        (payload) => {
          const updatedSession = payload.new as any;
          if (updatedSession.status === 'ended') {
            console.log('Call ended by partner');
            onLeave(); // Exit locally
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [callSessionId, onLeave]);

  // Play remote video when users join
  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.videoTrack) {
        user.videoTrack.play(`remote-video-${user.uid}`);
      }
    });
  }, [remoteUsers]);

  const toggleMute = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (callType === 'audio') {
      showToast('Video not available in audio call', 'error');
      return;
    }



    if (localVideoTrack) {
      // Just toggle enabled state
      const newState = !isVideoOff;
      const shouldEnable = isVideoOff; // If currently off, we enable
      await localVideoTrack.setEnabled(shouldEnable);
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndCall = async () => {
    localAudioTrack?.close();
    localVideoTrack?.close();
    client.leave();

    // Update DB status to 'ended'
    if (callSessionId) {
      await endCallAPI(callSessionId);
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
            <p className="text-xs text-gray-400">
              {isJoined ? (callType === 'audio' ? 'Audio Call • Encrypted' : 'Video Call • Encrypted') : 'Connecting...'}
            </p>
          </div>
        </div>
        <button
          onClick={handleEndCall}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-gray-900">
        {/* Remote Video (full screen) */}
        {remoteUsers.length > 0 && remoteUsers[0].videoTrack ? (
          <div className="absolute inset-0">
            <div
              id={`remote-video-${remoteUsers[0].uid}`}
              className="w-full h-full"
              style={{ objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-neon shadow-lg shadow-neon/50 mx-auto mb-6 animate-pulse">
                <img
                  src={partnerAvatar || 'https://via.placeholder.com/150'}
                  alt={partnerName}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{partnerName}</h2>
              <p className="text-gray-400 animate-pulse">
                {remoteUsers.length > 0 ? 'Connected • Audio Only' : 'Waiting for connection...'}
              </p>
            </div>
          </div>
        )}

        {/* Local Video (picture-in-picture) */}
        {/* Only show if we have a video track */}
        <div className={`absolute top-20 right-4 w-32 h-44 md:w-40 md:h-56 bg-gray-800 rounded-2xl overflow-hidden border-2 border-gray-700 shadow-2xl transition-all duration-300 ${(!localVideoTrack || isVideoOff) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div
            id="local-video"
            className="w-full h-full"
            style={{ objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
        </div>

        {/* If video is valid but off, show icon? No, just hide self view for cleaner look or show icon? */}
        {/* Existing code showed "VideoOff" icon overlay. */}
      </div>

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
          className="p-5 rounded-full bg-red-600 hover:bg-red-700 transition-all shadow-lg hover:scale-110"
        >
          <PhoneOff className="w-8 h-8 text-white" />
        </button>



        {callType === 'video' && (
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <VideoIcon className="w-6 h-6 text-white" />}
          </button>
        )}
      </div>

    </div>
  );
};