import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { ArrowLeft, Link as LinkIcon, AlertCircle, Monitor, FolderOpen, Youtube, X, Hash, Users, Copy, PlusCircle, LogIn, LogOut, MonitorPlay, Home, Gamepad, Settings as SettingsIcon, Mic, MicOff, Video, VideoOff, MonitorUp, Send, MessageSquare, Maximize, Minimize } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Peer, { DataConnection } from 'peerjs';
import { useAuth } from '../../context/AuthContext';
import { analytics } from '../../utils/analytics';

type DateMode = 'landing' | 'create_room' | 'join_room' | 'select' | 'youtube' | 'file' | 'screen' | 'viewer';

interface PeerStream {
    peerId: string;
    stream: MediaStream;
}

const StreamVideo = ({ stream, muted = false, mirrored }: { stream: MediaStream, muted?: boolean, mirrored: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (videoRef.current && stream) videoRef.current.srcObject = stream;
    }, [stream]);
    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className="w-full h-full object-cover"
            style={{ transform: mirrored ? 'rotateY(180deg)' : 'none' }}
        />
    );
};

export const CinemaDate: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mode, setMode] = useState<DateMode>('landing');
    const [url, setUrl] = useState<string>('');
    const [inputUrl, setInputUrl] = useState(''); // Separate state for input tracking
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [camPositions, setCamPositions] = useState<Record<string, { x: number, y: number }>>(() => ({
        'YOU': { x: window.innerWidth - 140, y: 20 }
    }));
    const [camSizes, setCamSizes] = useState<Record<string, { width: number, height: number }>>({ 'YOU': { width: 96, height: 64 } });
    const activeDragId = useRef<string | null>(null);
    const activeResizeId = useRef<string | null>(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const resizeStart = useRef({ width: 0, height: 0, mouseX: 0, mouseY: 0 });

    // Chat State
    const [messages, setMessages] = useState<{ user: string, text: string }[]>([
        { user: 'System', text: 'Welcome to the room!' }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [hasUnread, setHasUnread] = useState(false);
    const [chatNotification, setChatNotification] = useState<{ user: string, text: string } | null>(null);

    // Room & Peer State
    const [roomName, setRoomName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [myPeerId, setMyPeerId] = useState<string>('');
    const [peers, setPeers] = useState<PeerStream[]>([]);
    const [peerNames, setPeerNames] = useState<Record<string, string>>({});
    const [isHost, setIsHost] = useState(false);

    // Profile Info
    const { currentUser } = useAuth();
    const displayName = currentUser?.realName || currentUser?.anonymousId || 'Anonymous';

    // Media State
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [remoteVideoStream, setRemoteVideoStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const peerInstance = useRef<Peer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<any>(null);
    const connections = useRef<{ [key: string]: DataConnection }>({});

    // State Refs for Closures (Peer Callbacks)
    const urlRef = useRef(url);
    const modeRef = useRef(mode);
    const playingRef = useRef(isPlaying);
    const hostRef = useRef(isHost);
    const peersRef = useRef(peers);
    const showChatRef = useRef(showChat);

    useEffect(() => {
        urlRef.current = url;
        modeRef.current = mode;
        playingRef.current = isPlaying;
        hostRef.current = isHost;
        peersRef.current = peers;
        showChatRef.current = showChat;
    }, [url, mode, isPlaying, isHost, peers, showChat]);

    // Helper: Create Dummy Stream (Black Screen + Silence) for Spectators/Errors
    const createDummyStream = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 640, 480);
            ctx.font = '30px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('Spectator', 250, 240);
        }
        const videoTrack = canvas.captureStream(30).getVideoTracks()[0];

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const dst = audioCtx.createMediaStreamDestination();
        osc.connect(dst); // Connect to destination
        // Don't start osc or keep it silent/frequency 0 to avoid noise, or just disable track
        const audioTrack = dst.stream.getAudioTracks()[0];
        audioTrack.enabled = false; // Mute it tightly

        return new MediaStream([videoTrack, audioTrack]);
    };

    // Initialize Peer on Room Entry
    useEffect(() => {
        if (roomCode) {
            // Only re-init if the roomCode actually changed or we don't have an instance
            if (peerInstance.current && peerInstance.current.id === (isHost ? roomCode : myPeerId)) {
                // Already have correct peer for this room
                return;
            }

            // Destroy previous peer if exists
            if (peerInstance.current) {
                console.log("Destroying old peer instance");
                peerInstance.current.destroy();
                peerInstance.current = null;
            }

            // Clear previous peers when room changes/re-inits
            setPeers([]);

            const initPeer = async () => {
                try {
                    // Request Permissions first
                    let stream: MediaStream;
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    } catch (mediaErr: any) {
                        console.warn("Media Access Failed:", mediaErr);
                        stream = createDummyStream();
                        const wasDenied = mediaErr.name === 'NotAllowedError' || mediaErr.name === 'PermissionDeniedError';
                        setError(wasDenied ? "Camera permission denied." : "Camera unavailable. Joining as Spectator.");
                        setTimeout(() => setError(null), 5000);
                    }

                    setMyStream(stream);

                    // If Host, try to grab the roomCode as ID. If Joiner, random ID.
                    const newPeerId = isHost ? roomCode : undefined;

                    // Add config for better reliability
                    const peerConfig: any = {
                        debug: 2, // Errors
                        config: {
                            iceServers: [
                                { urls: 'stun:stun.l.google.com:19302' },
                                { urls: 'stun:global.stun.twilio.com:3478' }
                            ]
                        }
                    };

                    const peer = newPeerId ? new Peer(newPeerId, peerConfig) : new Peer(peerConfig);

                    peer.on('open', (id) => {
                        setMyPeerId(id);
                        console.log('My Peer ID:', id);

                        // Track virtual date start or join
                        if (isHost) {
                            analytics.virtualDateStart('Movie Date');
                        } else {
                            analytics.virtualDateJoin();
                        }

                        if (!isHost) {
                            connectToPeer(roomCode, stream, peer);
                        }
                    });

                    peer.on('error', (err) => {
                        console.error('Peer error (Full):', err);
                        // Clean error messages for user
                        let msg = `Connection Error: ${err.type || 'Unknown'}`;

                        if (err.type === 'unavailable-id') {
                            msg = isHost
                                ? "Room Name/Code is already taken. Please try another."
                                : "Room empty or fully occupied. Try again.";
                            if (isHost) setMode('landing');
                        } else if (err.type === 'peer-unavailable') {
                            msg = "Room not found. The host may have left or the code is wrong.";
                            // Optional: Don't kick to landing immediately, allow retry
                        } else if (err.type === 'network') {
                            msg = "Network connection lost. Reconnecting...";
                        } else if (err.type === 'server-error') {
                            msg = "Signaling server error. Please retry.";
                        } else if (err.type === 'socket-error') {
                            msg = "Socket error. Check your connection.";
                        } else if (err.type === 'webrtc') {
                            msg = "WebRTC Error. Browser may be blocking connections.";
                        }

                        setError(msg);
                        // specific handling for fatal errors
                        if (['unavailable-id', 'invalid-id', 'invalid-key'].includes(err.type)) {
                            // Fatal
                            setTimeout(() => setMode('landing'), 3000);
                        } else {
                            setTimeout(() => setError(null), 5000);
                        }
                    });

                    peer.on('call', (call) => {
                        console.log('Receiving call from:', call.peer, 'Metadata:', call.metadata);
                        try {
                            if (call.metadata?.type === 'video') {
                                call.answer(); // Video stream doesn't need my camera back
                                call.on('stream', (stream) => {
                                    console.log("Received remote video stream");
                                    setRemoteVideoStream(stream);
                                });
                            } else {
                                call.answer(stream);
                                call.on('stream', (remoteStream) => {
                                    addPeerStream(call.peer, remoteStream);
                                });
                                call.on('close', () => {
                                    console.log("Call closed for peer:", call.peer);
                                    removePeer(call.peer);
                                });
                                call.on('error', (e) => console.error("Call Error in handler:", e));
                            }
                        } catch (e) {
                            console.error("Failed to answer call:", e);
                        }
                    });

                    peer.on('connection', (conn) => {
                        console.log('Data connection from:', conn.peer);
                        setupDataConnection(conn);
                    });



                    peerInstance.current = peer;

                } catch (err: any) {
                    console.error("Critical Peer Init Error:", err);
                    setError(`System Error: ${err.message || 'Unknown'}`);
                }
            };

            initPeer();

            initPeer();

            return () => {
                // CLEANUP: Destroy peer when component unmounts or room changes
                if (peerInstance.current) {
                    console.log("Cleaning up Peer instance...");
                    peerInstance.current.destroy();
                    peerInstance.current = null;
                }
                setPeers([]);
                setMyStream(null); // Stop stream? Maybe not if we want to reuse it, but here we re-init.
                // Actually, stopping the stream tracks is good practice if we re-acquire them.
                if (myStream) {
                    myStream.getTracks().forEach(track => track.stop());
                }
            };
        }
    }, [roomCode, isHost]); // Only re-run if room identity changes

    // URL Hash Sync for Sharing
    useEffect(() => {
        if (window.location.hash) {
            const codeStart = window.location.hash.indexOf('#room=');
            if (codeStart !== -1) {
                const hashId = window.location.hash.substring(codeStart + 6);
                if (hashId && mode === 'landing') {
                    setJoinCode(hashId);
                    setMode('join_room');
                }
            }
        } else if (roomCode) {
            window.location.hash = `room=${roomCode}`;
        }
    }, [roomCode, mode]);


    const connectToPeer = (peerId: string, stream: MediaStream, peer: Peer) => {
        console.log(`Attempting to connect to Host: ${peerId}`);

        // 1. Call for Media
        const call = peer.call(peerId, stream, { metadata: { type: 'camera' } });

        // 2. Data Connection for Sync
        const conn = peer.connect(peerId, { reliable: true });

        const connectionTimeout = setTimeout(() => {
            if (!conn.open) {
                console.warn("Connection timeout - Host unreachable");
                setError("Host unreachable (Timeout). Check code or try again.");
                conn.close();
                setMode('landing');
            }
        }, 8000);

        setupDataConnection(conn);

        conn.on('open', () => {
            clearTimeout(connectionTimeout);
            console.log("Connected to Host Data Channel!");
        });

        conn.on('error', (err) => {
            clearTimeout(connectionTimeout);
            console.error("Data Connection Error:", err);
            setError("Lost connection to Host.");
        });

        conn.on('close', () => {
            clearTimeout(connectionTimeout);
            console.log("Disconnected from Host");
            // If we lose host, maybe leave?
            // setMode('landing'); 
            // Optional: Don't force leave, just show error
            setError("Host disconnected.");
        });

        // Setup Call Events
        call.on('stream', (remoteStream) => {
            addPeerStream(peerId, remoteStream);
        });

        call.on('close', () => {
            console.log("Call closed for peer:", peerId);
            removePeer(peerId);
        });

        call.on('error', (err) => {
            console.error("Call error:", err);
        });
    };

    // --- YouTube API Integration (Manual) ---
    useEffect(() => {
        if (!url || mode !== 'youtube') return;

        const getYouTubeId = (u: string) => {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = u.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        };
        const videoId = getYouTubeId(url);
        if (!videoId) return;

        // 1. Inject API Script
        if (!(window as any).YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        // 2. Init Player
        const initPlayer = () => {
            if ((window as any).YT && (window as any).YT.Player) {
                // If element exists (it should, rendered by JSX)
                if (!document.getElementById('youtube-iframe-element')) return;

                playerRef.current = new (window as any).YT.Player('youtube-iframe-element', {
                    events: {
                        'onReady': (event: any) => {
                            // setIsPlaying(true); // Don't force play here, let useEffect handle it or user interaction
                        },
                        'onStateChange': (event: any) => {
                            // If Player Drives State (Host)
                            if (isHost) {
                                if (event.data === 1) { setIsPlaying(true); handleVideoPlay(); }
                                if (event.data === 2) { setIsPlaying(false); handleVideoPause(); }
                                // Buffer
                                if (event.data === 3) handleVideoBuffer();
                            }
                        }
                    }
                });
            }
        };

        if ((window as any).YT && (window as any).YT.Player) {
            setTimeout(initPlayer, 1000); // Small delay to ensure IFrame ready
        } else {
            (window as any).onYouTubeIframeAPIReady = initPlayer;
        }

    }, [url, mode, isHost]);

    // 3. Sync State -> Player
    useEffect(() => {
        if (!playerRef.current || !playerRef.current.seekTo || typeof playerRef.current.getPlayerState !== 'function') return;
        const p = playerRef.current;
        try {
            const state = p.getPlayerState();
            if (isPlaying && state !== 1 && state !== 3) p.playVideo();
            if (!isPlaying && state === 1) p.pauseVideo();
        } catch (e) { console.error("Sync Error", e); }
    }, [isPlaying]);

    // 4. Progress Loop
    useEffect(() => {
        let interval: any;
        if (isHost && isPlaying) {
            interval = setInterval(() => {
                handleVideoProgress();
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isHost, isPlaying]);

    // 5. State Integrity Poller (Fixes "Event Missed" bugs)
    useEffect(() => {
        if (!isHost) return;
        const statePoller = setInterval(() => {
            if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
                try {
                    const rawState = playerRef.current.getPlayerState();
                    // 1 = Playing, 2 = Paused, 3 = Buffering
                    if (rawState === 1 && !isPlaying) {
                        console.log("State Correction: Force PLAY");
                        setIsPlaying(true);
                        broadcastSync('play');
                    }
                    if (rawState === 2 && isPlaying) {
                        console.log("State Correction: Force PAUSE");
                        setIsPlaying(false);
                        broadcastSync('pause');
                    }
                } catch (e) { /* Ignore not-ready errors */ }
            }
        }, 500);
        return () => clearInterval(statePoller);
    }, [isHost, isPlaying]);

    const setupDataConnection = (conn: DataConnection) => {
        conn.on('open', () => {
            connections.current[conn.peer] = conn;

            // Send my IDENTITY immediately
            conn.send({
                type: 'IDENTITY',
                payload: { name: displayName }
            });

            // Send my stream info / peers list if I am host
            if (hostRef.current) {
                // 1. Sync Player State to New Peer
                // 1. Sync Player State to New Peer
                if (urlRef.current || modeRef.current === 'file') {
                    console.log(`Syncing new peer ${conn.peer} with URL: ${urlRef.current} Mode: ${modeRef.current}`);
                    conn.send({
                        type: 'SYNC_PLAYER',
                        action: 'url',
                        payload: modeRef.current === 'file' ? 'LOCAL_FILE' : urlRef.current,
                        mode: modeRef.current
                    });
                    if (playingRef.current) {
                        conn.send({ type: 'SYNC_PLAYER', action: 'play' });
                        // Try to sync timestamp if player is ready
                        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                            conn.send({ type: 'SYNC_PLAYER', action: 'seek', time: playerRef.current.getCurrentTime() });
                        }
                    }
                }

                // 2. Send Peer List (Mesh)
                const currentPeers = peersRef.current.map(p => p.peerId);
                if (currentPeers.length > 0) {
                    conn.send({ type: 'PEER_LIST', peers: currentPeers });
                }

                // 3. If streaming local file, send video call
                if (modeRef.current === 'file' && localVideoRef.current && peerInstance.current) {
                    const video = localVideoRef.current;
                    // @ts-ignore
                    const stream = video.captureStream ? video.captureStream(30) : (video as any).mozCaptureStream ? (video as any).mozCaptureStream(30) : null;
                    if (stream) {
                        const videoTrack = stream.getVideoTracks()[0];
                        if (videoTrack && 'contentHint' in videoTrack) {
                            // @ts-ignore
                            videoTrack.contentHint = 'motion';
                        }
                        console.log(`Sending high-quality video stream call to late-joiner: ${conn.peer}`);
                        peerInstance.current.call(conn.peer, stream, { metadata: { type: 'video' } });
                    }
                }
            }
        });

        conn.on('data', (data: any) => {
            handleDataMessage(data, conn.peer);
        });

        conn.on('close', () => {
            removePeer(conn.peer);
            delete connections.current[conn.peer];
        });
    };

    const handleDataMessage = (data: any, senderId: string) => {
        if (data.type === 'IDENTITY') {
            const { name } = data.payload;
            console.log(`Received identity from ${senderId}: ${name}`);
            setPeerNames(prev => ({ ...prev, [senderId]: name }));
            return;
        }

        if (data.type === 'SYNC_PLAYER') {
            // Only Viewer responds to sync? Or everyone?
            // Ideally everyone but the sender updates state, but careful of loops.
            // For now, if I am not host, I obey.
            if (data.action === 'play') {
                setIsPlaying(true);
                if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
                    playerRef.current.playVideo();
                }
            }
            if (data.action === 'pause') {
                setIsPlaying(false);
                if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
                    playerRef.current.pauseVideo();
                }
            }
            if (data.action === 'seek' && playerRef.current && typeof playerRef.current.seekTo === 'function') {
                playerRef.current.seekTo(data.time, true);
            }
            if (data.action === 'time_update' && playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                // Drift correction: if receiving time update from host
                const currentTime = playerRef.current.getCurrentTime();
                const diff = Math.abs(currentTime - data.time);
                // If drift is > 1.5 seconds, sync up
                if (diff > 1.5) {
                    playerRef.current.seekTo(data.time, true);
                }
            }
            if (data.action === 'url') {
                setUrl(data.payload);
                setMode(data.mode || 'youtube');
            }
        } else if (data.type === 'PEER_LIST') {
            // I just joined and host sent me a list or peers
            // Connect to them (Mesh)
            if (peerInstance.current && myStream) {
                data.peers.forEach((pid: string) => {
                    if (pid !== myPeerId && !connections.current[pid]) {
                        connectToPeer(pid, myStream!, peerInstance.current!);
                    }
                });
            }
        } else if (data.type === 'CHAT') {
            const senderName = peerNames[senderId] || senderId.substring(0, 5);
            setMessages(prev => [...prev, { user: senderName, text: data.text }]);

            // Notification Logic
            if (!showChatRef.current) {
                setHasUnread(true);
                setChatNotification({ user: senderName, text: data.text });
                setTimeout(() => setChatNotification(null), 5000);
            }
        } else if (data.type === 'LEAVE') {
            const senderName = peerNames[senderId] || senderId.substring(0, 5);
            setMessages(prev => [...prev, { user: 'System', text: `${senderName} has left the room` }]);
            removePeer(senderId);
        }
    };

    const broadcastData = (data: any) => {
        Object.values(connections.current).forEach(conn => {
            if (conn.open) conn.send(data);
        });
    };

    const addPeerStream = (peerId: string, stream: MediaStream) => {
        setPeers(prev => {
            if (prev.find(p => p.peerId === peerId)) return prev;
            return [...prev, { peerId, stream }];
        });
    };

    const removePeer = (peerId: string) => {
        setPeers(prev => prev.filter(p => p.peerId !== peerId));
    };


    // --- View Control ---

    const handleCreateRoom = () => {
        if (!roomName.trim()) {
            setError('Please enter a room name');
            return;
        }
        // Generate simple 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setRoomCode(code);
        setIsHost(true);
        setMode('select');
        setError(null);
    };

    const handleJoinRoom = () => {
        if (joinCode.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }
        setRoomCode(joinCode);
        setRoomName('Joined Room');
        setIsHost(false);
        setMode('viewer');
        setError(null);
    };



    // Handle Input Change (Local Only)
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputUrl(e.target.value);
    };

    // Handle Input Submit (Commit & Broadcast)
    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputUrl.trim()) {
            setUrl(inputUrl);
            setMode('youtube');
            setIsPlaying(true); // Auto-play on load
            broadcastData({ type: 'SYNC_PLAYER', action: 'url', payload: inputUrl, mode: 'youtube' });
            broadcastData({ type: 'SYNC_PLAYER', action: 'play' }); // Ensure peers play too
            setInputUrl(''); // Clear input
            setError(null);
        }
    };

    // --- Sync Helpers ---

    const broadcastSync = (action: string, payload: any = {}) => {
        if (!isHost) return; // Only Host broadcasts sync
        broadcastData({ type: 'SYNC_PLAYER', action, ...payload });
    };

    const handleVideoPlay = () => {
        setIsPlaying(true);
        broadcastSync('play');
    };

    const handleVideoPause = () => {
        setIsPlaying(false);
        broadcastSync('pause');
    };

    const handleVideoBuffer = () => {
        // Optional: Could pause everyone to buffer
    };

    const handleVideoProgress = (state: any = null) => {
        // Host periodically sends time updates for drift correction
        if (isHost && isPlaying && playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            const now = Date.now();
            // @ts-ignore
            if (!window.lastSyncTime || now - window.lastSyncTime > 2000) {
                const currentTime = playerRef.current.getCurrentTime();
                broadcastSync('time_update', { time: currentTime });
                // @ts-ignore
                window.lastSyncTime = now;
            }
        }
    };

    const handleVideoSeek = (seconds: number) => {
        if (isHost) {
            broadcastSync('seek', { time: seconds });
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const fileUrl = URL.createObjectURL(file);
            setUrl(fileUrl);
            setMode('file');
            setIsPlaying(true);

            // Broadcast Mode Change
            broadcastSync('url', { payload: 'LOCAL_FILE', mode: 'file' });
        }
    };

    // Effect to start streaming when local video is ready
    useEffect(() => {
        if (isHost && mode === 'file' && url && localVideoRef.current && peerInstance.current) {
            const video = localVideoRef.current;

            const startStreaming = () => {
                // @ts-ignore
                const stream = video.captureStream ? video.captureStream(30) : (video as any).mozCaptureStream ? (video as any).mozCaptureStream(30) : null;

                if (stream) {
                    const videoTrack = stream.getVideoTracks()[0];
                    if (videoTrack && 'contentHint' in videoTrack) {
                        // @ts-ignore
                        videoTrack.contentHint = 'motion';
                    }
                    console.log("Starting broadcast of high-quality local video stream...");
                    Object.values(connections.current).forEach(conn => {
                        peerInstance.current?.call(conn.peer, stream, { metadata: { type: 'video' } });
                    });
                }
            };

            if (video.readyState >= 2) {
                startStreaming();
            } else {
                video.onloadedmetadata = startStreaming;
            }
        }
    }, [isHost, mode, url]);


    const handleScreenShare = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            setUrl(mediaStream as any);
            setMode('screen');
            setIsPlaying(true);

            // We could try to replace our video track in the peer connection with this screen track
            // But for simplicity, we treat it as "Main Stage" content and local user sees it.
            // To show to others, we'd need to replaceTrack on all peer connections.
            // Current "Main Stage" architecture (ReactPlayer) vs "Video Grid" (PeerJS) separation.
            // If we want to broadcast screen, usually we add it as a stream.
        } catch (err) {
            setError("Screen sharing cancelled or failed.");
        }
    };

    const toggleMute = () => {
        if (myStream) {
            myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (myStream) {
            myStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoOff(!isVideoOff);
        }
    };

    const handleLeaveRoom = () => {
        // Broadcast that I am leaving
        broadcastData({ type: 'LEAVE' });

        setMode('landing');
        setRoomCode('');
        setRoomName('');
        setJoinCode('');
        setUrl('');
        setIsPlaying(false);
        window.location.hash = '';
        if (peerInstance.current) {
            peerInstance.current.destroy();
            peerInstance.current = null;
        }
        setPeers([]);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        // Local Echo
        setMessages([...messages, { user: displayName, text: newMessage }]);
        // Send
        broadcastData({ type: 'CHAT', text: newMessage });

        setNewMessage('');
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement && containerRef.current) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
            setIsFullScreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        }
    };

    // --- Draggable Cam Box Logic ---
    const handleCamMouseDown = (e: React.MouseEvent, id: string) => {
        if ((e.target as HTMLElement).closest('.resize-handle')) return; // Don't drag if clicking resize handle
        activeDragId.current = id;
        const pos = camPositions[id] || { x: 0, y: 0 };
        dragOffset.current = {
            x: e.clientX - pos.x,
            y: e.clientY - pos.y
        };
    };

    const handleCamResizeMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        activeResizeId.current = id;
        const size = camSizes[id] || { width: 96, height: 64 };
        resizeStart.current = {
            width: size.width,
            height: size.height,
            mouseX: e.clientX,
            mouseY: e.clientY
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (activeDragId.current) {
                const id = activeDragId.current;

                // Calculate raw new position
                let newX = e.clientX - dragOffset.current.x;
                let newY = e.clientY - dragOffset.current.y;

                // Clamp to screen edges
                const size = camSizes[id] || { width: 96, height: 64 };
                const maxX = window.innerWidth - size.width;
                const maxY = window.innerHeight - size.height;

                newX = Math.max(0, Math.min(newX, maxX));
                newY = Math.max(0, Math.min(newY, maxY));

                setCamPositions(prev => ({
                    ...prev,
                    [id]: {
                        x: newX,
                        y: newY
                    }
                }));
            } else if (activeResizeId.current) {
                const id = activeResizeId.current;
                const deltaX = e.clientX - resizeStart.current.mouseX;
                const deltaY = e.clientY - resizeStart.current.mouseY;

                setCamSizes(prev => ({
                    ...prev,
                    [id]: {
                        width: Math.max(80, resizeStart.current.width + deltaX),
                        height: Math.max(50, resizeStart.current.height + deltaY)
                    }
                }));
            }
        };
        const handleMouseUp = () => {
            activeDragId.current = null;
            activeResizeId.current = null;
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [camPositions, camSizes]);

    // Listen for fullscreen change events (e.g. user pressing ESC)
    useEffect(() => {
        const handleFullScreenChange = async () => {
            const isFS = !!document.fullscreenElement;
            setIsFullScreen(isFS);

            // Mobile Enhancements: Auto-rotate and Reposition PIP
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isFS && isMobile) {
                // 1. Force Landscape
                try {
                    if (screen.orientation && (screen.orientation as any).lock) {
                        await (screen.orientation as any).lock('landscape');
                    }
                } catch (e) {
                    console.warn("Orientation lock failed:", e);
                }

                // 2. Auto-position PIP to Top Right
                setCamPositions(prev => ({
                    ...prev,
                    'YOU': { x: window.innerWidth - 120, y: 20 }
                }));
            } else if (!isFS && isMobile) {
                // Unlock orientation when exiting
                try {
                    if (screen.orientation && screen.orientation.unlock) {
                        screen.orientation.unlock();
                    }
                } catch (e) {
                    console.warn("Orientation unlock failed:", e);
                }
            }
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    // --- Window Resize Handler ---
    useEffect(() => {
        const handleResize = () => {
            setCamPositions(prev => {
                const next = { ...prev };
                let changed = false;
                Object.keys(next).forEach(key => {
                    const pos = next[key];
                    const size = camSizes[key] || { width: 96, height: 64 };
                    let newX = pos.x;
                    let newY = pos.y;

                    if (newX + size.width > window.innerWidth) {
                        newX = Math.max(0, window.innerWidth - size.width);
                        changed = true;
                    }
                    if (newY + size.height > window.innerHeight) {
                        newY = Math.max(0, window.innerHeight - size.height);
                        changed = true;
                    }
                    if (changed) {
                        next[key] = { x: newX, y: newY };
                    }
                });
                return changed ? next : prev;
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [camSizes]);

    // --- Render Helpers ---

    // Helper to render video elements (Moved to top level)

    const renderLandingScreen = () => (
        <div className="flex flex-col items-center justify-center min-h-screen w-full animate-fade-in-up bg-black relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon/10 rounded-full blur-[120px] pointer-events-none -z-0" />

            <button
                onClick={() => navigate('/virtual-date')}
                className="absolute top-6 left-6 p-3 bg-gray-900/50 hover:bg-gray-800 rounded-full transition-colors z-20 group border border-gray-800"
            >
                <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-white" />
            </button>

            <h2 className="text-4xl md:text-6xl font-black mb-16 text-white text-center tracking-tighter relative z-10">
                CINEMA <span className="text-neon text-transparent bg-clip-text bg-gradient-to-r from-neon to-purple-500">PARADISO</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4 max-w-2xl relative z-10">
                <button
                    onClick={() => setMode('create_room')}
                    className="group flex flex-col items-center justify-center p-10 bg-gray-900/40 backdrop-blur-md hover:bg-gray-800/60 border border-gray-800 hover:border-neon rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-neon/10"
                >
                    <div className="p-6 rounded-full bg-neon/10 text-neon mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-neon/20">
                        <PlusCircle className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Create Room</h3>
                    <p className="text-gray-400 text-center text-sm">Host a new session</p>
                </button>

                <button
                    onClick={() => setMode('join_room')}
                    className="group flex flex-col items-center justify-center p-10 bg-gray-900/40 backdrop-blur-md hover:bg-gray-800/60 border border-gray-800 hover:border-purple-500 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10"
                >
                    <div className="p-6 rounded-full bg-purple-500/10 text-purple-500 mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
                        <LogIn className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Join Room</h3>
                    <p className="text-gray-400 text-center text-sm">Enter a room code</p>
                </button>
            </div>
        </div>
    );

    const renderCreateRoomScreen = () => (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-black relative">
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white">Name Your Room</h2>
                </div>
                <div className="space-y-4">
                    <input
                        type="text"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="e.g. Movie Night 🍿"
                        className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:border-neon focus:outline-none transition-colors"
                    />
                    <button
                        onClick={handleCreateRoom}
                        className="w-full bg-neon hover:bg-neon/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-neon/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Enter Lobby
                    </button>
                    <button onClick={() => setMode('landing')} className="w-full text-gray-500 hover:text-white py-2 text-sm">Cancel</button>
                </div>
            </div>
        </div>
    );

    const renderJoinRoomScreen = () => (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-black relative">
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white">Enter Code</h2>
                </div>
                <div className="space-y-4">
                    <input
                        type="text"
                        maxLength={6}
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="000000"
                        className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none transition-colors font-mono text-center text-2xl tracking-[0.5em]"
                    />
                    <button
                        onClick={handleJoinRoom}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Join Room
                    </button>
                    <button onClick={() => setMode('landing')} className="w-full text-gray-500 hover:text-white py-2 text-sm">Cancel</button>
                </div>
            </div>
        </div>
    );

    const renderSelectionScreen = () => (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl animate-fade-in-up px-4 py-6 md:py-0">
            <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-8 text-white text-center">
                Choose Your <span className="text-neon">View</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-[300px] md:max-w-none">
                <button
                    onClick={() => setMode('youtube')}
                    className="group flex flex-col items-center justify-center p-4 md:p-8 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-red-500 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                >
                    <div className="p-2 md:p-4 rounded-full bg-red-500/10 text-red-500 mb-2 md:mb-4 group-hover:scale-110 transition-transform">
                        <Youtube className="w-6 h-6 md:w-10 md:h-10" />
                    </div>
                    <h3 className="text-sm md:text-xl font-bold text-gray-200 group-hover:text-white">YouTube</h3>
                </button>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex flex-col items-center justify-center p-4 md:p-8 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-blue-500 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                >
                    <div className="p-2 md:p-4 rounded-full bg-blue-500/10 text-blue-500 mb-2 md:mb-4 group-hover:scale-110 transition-transform">
                        <FolderOpen className="w-6 h-6 md:w-10 md:h-10" />
                    </div>
                    <h3 className="text-sm md:text-xl font-bold text-gray-200 group-hover:text-white">Choose File</h3>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="video/*" className="hidden" />
                </button>

                <button
                    onClick={handleScreenShare}
                    className="group flex flex-col items-center justify-center p-4 md:p-8 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-green-500 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                >
                    <div className="p-2 md:p-4 rounded-full bg-green-500/10 text-green-500 mb-2 md:mb-4 group-hover:scale-110 transition-transform">
                        <Monitor className="w-6 h-6 md:w-10 md:h-10" />
                    </div>
                    <h3 className="text-sm md:text-xl font-bold text-gray-200 group-hover:text-white">Share Screen</h3>
                </button>

            </div>
        </div>
    );

    // --- SPA Application Layout (Kosmi Style) ---

    if (mode === 'landing') return renderLandingScreen();
    if (mode === 'create_room') return renderCreateRoomScreen();
    if (mode === 'join_room') return renderJoinRoomScreen();

    return (
        <div ref={containerRef} className="flex flex-col h-full w-full bg-black text-white overflow-hidden font-sans relative pb-20 md:pb-0">

            {/* 2. Main Center Stage Area */}
            <div className="flex-1 flex flex-col relative min-w-0 bg-[#0a0a0c] overflow-hidden">
                {/* Top Bar (Room Info) */}
                <div className="h-14 md:h-16 border-b border-gray-900/50 flex items-center justify-between px-3 md:px-6 bg-gray-950/30 backdrop-blur-sm z-20">
                    <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                        <span className="font-bold text-gray-200 truncate max-w-[80px] md:max-w-none text-sm md:text-base">{roomName}</span>
                        <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 bg-gray-900 rounded-full border border-gray-800 shrink-0">
                            <Hash className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-500" />
                            <span className="font-mono text-[10px] md:text-xs text-neon">{roomCode}</span>
                            <button onClick={() => copyToClipboard(roomCode)} className="hover:text-white text-gray-500"><Copy className="w-2.5 h-2.5 md:w-3 md:h-3" /></button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="flex items-center gap-1 md:gap-2">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Live</span>
                        </div>
                        <button
                            onClick={toggleFullScreen}
                            className="p-1.5 md:p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                            title="Toggle Full Screen"
                        >
                            {isFullScreen ? <Minimize className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize className="w-4 h-4 md:w-5 md:h-5" />}
                        </button>
                        <button
                            onClick={() => {
                                setShowChat(!showChat);
                                if (!showChat) setHasUnread(false);
                            }}
                            className={`p-1.5 md:p-2 rounded-lg transition-colors relative ${showChat ? 'bg-neon/20 text-neon' : 'hover:bg-gray-800 text-gray-400'}`}
                            title="Toggle Chat"
                        >
                            <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                            {hasUnread && !showChat && (
                                <span className="absolute top-1 right-1 w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full border-2 border-gray-950 animate-pulse" />
                            )}
                        </button>
                        <button
                            onClick={handleLeaveRoom}
                            className="p-1.5 md:p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                            title="Leave Room"
                        >
                            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>

                {/* Stage Content - Ultimate Clean YouTube Style */}
                <div className="flex-shrink-0 w-full flex items-center justify-center relative bg-black">
                    <div className="w-full max-w-[1600px] md:aspect-video min-h-[240px] md:min-h-0 relative flex flex-col justify-center items-center group">

                        {/* Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-purple-900/5 to-neon/5 rounded-full blur-3xl pointer-events-none" />

                        {/* --- Content Logic Based on Sub-Mode --- */}

                        {mode === 'select' && renderSelectionScreen()}

                        {mode === 'youtube' && !url && (
                            <div className="w-full max-w-lg z-10 p-6 animate-fade-in-up">
                                <form onSubmit={handleUrlSubmit} className="flex items-center gap-2 bg-black/60 border border-gray-700 rounded-xl p-2 focus-within:border-neon/50 transition-colors shadow-xl">
                                    <div className="p-2"><LinkIcon className="w-5 h-5 text-gray-500" /></div>
                                    <input
                                        type="text"
                                        placeholder="Paste YouTube URL..."
                                        value={inputUrl}
                                        onChange={handleUrlChange}
                                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 text-sm"
                                        autoFocus
                                    />
                                    <button type="button" onClick={() => setMode('select')} className="p-2 hover:bg-gray-800 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
                                    <button type="submit" className="p-2 bg-neon/20 hover:bg-neon/40 text-neon rounded-lg font-bold text-xs px-4 transition-colors">
                                        LOAD
                                    </button>
                                </form>
                            </div>
                        )}

                        {mode === 'viewer' && !url && (
                            <div className="text-center z-10 animate-fade-in-up">
                                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <MonitorPlay className="w-10 h-10 text-gray-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-300">Waiting for Host...</h3>
                            </div>
                        )}

                        {mode === 'file' && (
                            <div className="w-full h-full relative bg-black flex items-center justify-center">
                                {isHost ? (
                                    <video
                                        ref={localVideoRef}
                                        src={url}
                                        controls
                                        autoPlay
                                        className="w-full h-full max-h-full max-w-full pointer-events-auto"
                                    />
                                ) : (
                                    <div className="w-full h-full relative">
                                        {remoteVideoStream ? (
                                            <StreamVideo stream={remoteVideoStream} mirrored={false} />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-4 text-gray-500">
                                                <MonitorPlay className="w-12 h-12 animate-pulse" />
                                                <p className="text-sm font-medium">Connecting to Host's Stream...</p>
                                            </div>
                                        )}
                                        {/* Spectator Blockers */}
                                        <div className="absolute inset-0 z-20 cursor-default bg-transparent" />
                                    </div>
                                )}
                            </div>
                        )}

                        {url && mode === 'youtube' && (
                            <div className="w-full h-full relative bg-black">
                                {(() => {
                                    // Simple logic just to render the iframe with the current URL
                                    const getYouTubeId = (u: string) => {
                                        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                                        const match = u.match(regExp);
                                        return (match && match[2].length === 11) ? match[2] : null;
                                    };
                                    const videoId = getYouTubeId(url);
                                    if (!videoId) return <div className="text-white pt-20 text-center">Invalid Video URL</div>;

                                    return (
                                        <iframe
                                            id="youtube-iframe-element"
                                            width="100%"
                                            height="100%"
                                            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=0&controls=${isHost ? 1 : 0}&disablekb=${isHost ? 0 : 1}&origin=${window.location.origin}`}
                                            title="YouTube video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full pointer-events-auto"
                                        ></iframe>
                                    );
                                })()}
                            </div>
                        )}

                        {/* --- Shared UI Components --- */}
                        {['select', 'youtube', 'file', 'screen', 'viewer'].includes(mode) && (
                            <>
                                {/* Spectator Overlay for Non-Hosts */}
                                {!isHost && (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-transparent cursor-default">
                                    </div>
                                )}

                                {/* Error Toast */}
                                {error && (
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-500/90 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-fade-in-down z-50">
                                        <AlertCircle className="w-4 h-4" /> {error}
                                    </div>
                                )}

                                {/* Bottom Control Bar (Overlay) */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-gray-950/60 backdrop-blur-xl border border-gray-800 rounded-full shadow-2xl z-40 transition-transform duration-300 translate-y-20 group-hover:translate-y-0 opacity-0 group-hover:opacity-100">
                                    <button onClick={toggleMute} className={`p-3 rounded-full hover:bg-gray-800/80 transition-colors ${isMuted ? 'text-red-500 bg-red-500/10' : 'text-white'}`}>
                                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                    </button>
                                    <button onClick={toggleVideo} className={`p-3 rounded-full hover:bg-gray-800/80 transition-colors ${isVideoOff ? 'text-red-500 bg-red-500/10' : 'text-white'}`}>
                                        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. Bottom Chat Panel - Adaptive for Mobile */}
                {showChat && (
                    <div className={`
                        flex-1 flex flex-col bg-black border-t border-gray-900 min-h-0
                        md:relative md:w-auto md:h-auto
                        absolute inset-x-0 bottom-0 top-[40%] z-50 border-t-2 border-neon/50 shadow-2xl
                    `}>
                        <div className="h-8 border-b border-gray-900/50 flex items-center justify-between px-4 bg-black">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="w-3 h-3 text-neon" /> Live Chat
                            </h3>
                            <button onClick={() => setShowChat(false)} className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-white transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex flex-col ${msg.user === 'You' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.user === 'You' ? 'bg-neon/10 text-neon border border-neon/20' : 'bg-gray-900 text-gray-300 border border-gray-800'}`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[9px] text-gray-600 mt-1 px-2">{msg.user}</span>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t border-gray-900 bg-gray-950">
                            <form onSubmit={handleSendMessage} className="relative">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-4 pr-12 py-2 text-sm text-white focus:border-neon/50 focus:outline-none transition-colors"
                                />
                                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-neon/10 text-neon rounded-lg hover:bg-neon hover:text-white transition-colors">
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Drag Area for Camera Boxes - OUTSIDE for global movement */}
            <div className="fixed top-20 left-0 right-0 bottom-0 pointer-events-none z-[100]">
                {myStream && (
                    <div
                        onMouseDown={(e) => handleCamMouseDown(e, 'YOU')}
                        style={{
                            position: 'absolute',
                            left: '20px',
                            top: '20px',
                            transform: `translate(${camPositions['YOU']?.x || 0}px, ${camPositions['YOU']?.y || 0}px)`,
                            width: `${camSizes['YOU']?.width || 96}px`,
                            height: `${camSizes['YOU']?.height || 64}px`
                        }}
                        className="bg-black rounded-lg overflow-hidden border border-gray-800 shadow-xl select-none pointer-events-auto opacity-90 hover:opacity-100 transition-opacity cursor-move"
                    >
                        <StreamVideo stream={myStream} muted={true} mirrored={true} />
                        <div className="absolute bottom-1 right-1 text-[8px] bg-black/50 px-1 rounded text-white font-bold pointer-events-none">{displayName}</div>
                        <div onMouseDown={(e) => handleCamResizeMouseDown(e, 'YOU')} className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-10"></div>
                    </div>
                )}
                {peers.map((peer) => (
                    <div
                        key={peer.peerId}
                        onMouseDown={(e) => handleCamMouseDown(e, peer.peerId)}
                        style={{
                            position: 'absolute',
                            left: '20px',
                            top: '100px',
                            transform: `translate(${camPositions[peer.peerId]?.x || 0}px, ${camPositions[peer.peerId]?.y || 0}px)`,
                            width: `${camSizes[peer.peerId]?.width || 96}px`,
                            height: `${camSizes[peer.peerId]?.height || 64}px`
                        }}
                        className="bg-black rounded-lg overflow-hidden border border-gray-800 shadow-xl select-none pointer-events-auto opacity-90 hover:opacity-100 transition-opacity cursor-move"
                    >
                        <StreamVideo stream={peer.stream} mirrored={true} />
                        <div className="absolute bottom-1 right-1 text-[8px] bg-black/50 px-1 rounded text-white font-bold pointer-events-none">{peerNames[peer.peerId] || peer.peerId.substring(0, 4)}</div>
                        <div onMouseDown={(e) => handleCamResizeMouseDown(e, peer.peerId)} className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-10"></div>
                    </div>
                ))}
            </div>

            {/* Chat Notification Popup */}
            {chatNotification && !showChat && (
                <div
                    onClick={() => {
                        setShowChat(true);
                        setHasUnread(false);
                        setChatNotification(null);
                    }}
                    className="fixed top-20 right-6 z-[60] cursor-pointer animate-fade-in-right bg-gray-900/90 backdrop-blur-xl border border-neon/30 rounded-2xl p-4 shadow-2xl max-w-[280px]"
                >
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-neon uppercase tracking-wider">{chatNotification.user}</span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">{chatNotification.text}</p>
                </div>
            )}
        </div>
    );
};
