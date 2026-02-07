import React, { useEffect, useState } from 'react';
import AgoraRTC, {
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack
} from 'agora-rtc-sdk-ng';
import { X, Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, ShieldCheck } from 'lucide-react';

interface VideoCallProps {
  appId: string;
  channelName: string;
  token: string;
  onLeave: () => void;
  partnerName: string;
}

export const VideoCall: React.FC<VideoCallProps> = ({ appId, channelName, token, onLeave, partnerName }) => {
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [client] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));

  useEffect(() => {
    const init = async () => {
      try {
        // Set up event listeners
        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          console.log('Subscribed to user:', user.uid);

          if (mediaType === 'video') {
            setRemoteUsers((prev) => {
              const exists = prev.find(u => u.uid === user.uid);
              if (exists) return prev;
              return [...prev, user];
            });
          }

          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        client.on('user-unpublished', (user, mediaType) => {
          console.log('User unpublished:', user.uid, mediaType);
          if (mediaType === 'video') {
            setRemoteUsers((prev) => prev.filter(u => u.uid !== user.uid));
          }
        });

        client.on('user-left', (user) => {
          console.log('User left:', user.uid);
          setRemoteUsers((prev) => prev.filter(u => u.uid !== user.uid));
        });

        // Join channel
        await client.join(appId, channelName, token, null);
        console.log('Joined channel successfully');

        // Create and publish local tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        await client.publish([audioTrack, videoTrack]);
        console.log('Published local tracks');

        setIsJoined(true);

        // Play local video
        videoTrack.play('local-video');
      } catch (error) {
        console.error('Failed to join channel:', error);
        alert('Failed to join call: ' + (error as Error).message);
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
  }, [appId, channelName, token, onLeave]);

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

  const toggleVideo = () => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndCall = () => {
    localAudioTrack?.close();
    localVideoTrack?.close();
    client.leave();
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

      {/* Video Container */}
      <div className="flex-1 relative bg-gray-900">
        {/* Remote Video (full screen) */}
        {remoteUsers.length > 0 ? (
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
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👻</span>
              </div>
              <p className="text-gray-400">Waiting for {partnerName} to join...</p>
            </div>
          </div>
        )}

        {/* Local Video (picture-in-picture) */}
        <div className="absolute top-20 right-4 w-32 h-44 md:w-40 md:h-56 bg-gray-800 rounded-2xl overflow-hidden border-2 border-gray-700 shadow-2xl">
          <div
            id="local-video"
            className="w-full h-full"
            style={{ objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-500" />
            </div>
          )}
        </div>
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
          className="p-5 rounded-full bg-red-600 hover:bg-red-700 transition-all shadow-lg"
        >
          <PhoneOff className="w-8 h-8 text-white" />
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <VideoIcon className="w-6 h-6 text-white" />}
        </button>
      </div>
    </div>
  );
};