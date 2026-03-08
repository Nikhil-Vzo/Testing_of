import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Play, Pause, Search, Music, X, Hash, Users, Copy, PlusCircle, LogIn, LogOut, MessageSquare, Send, Mic, MicOff, Video, VideoOff, Loader, Volume2, Maximize, Minimize, FileText, Image as ImageIcon, SkipForward } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Peer, { DataConnection } from 'peerjs';
import { useAuth } from '../../context/AuthContext';
import { analytics } from '../../utils/analytics';

type DateMode = 'landing' | 'create_room' | 'join_room' | 'room';

interface Track {
    id: string;
    song: string;
    singers: string;
    image: string;
    media_url: string;
    duration: string;
}

interface PeerStream {
    peerId: string;
    stream: MediaStream;
}

const StreamVideo = ({ stream, muted = false, mirrored, volume = 1 }: { stream: MediaStream, muted?: boolean, mirrored: boolean, volume?: number }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
        }
    }, [volume]);
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

export const MusicDate = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<DateMode>('landing');
    const [roomName, setRoomName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Music State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Track[]>([]);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [queue, setQueue] = useState<Track[]>([]);

    // Volume & Fullscreen State
    const [showVolumeControls, setShowVolumeControls] = useState(false);
    const [musicVolume, setMusicVolume] = useState(1);
    const [partnerVolume, setPartnerVolume] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    type LyricLine = { time: number; text: string };

    // Lyrics State
    const [showLyrics, setShowLyrics] = useState(false);
    const [lyricsData, setLyricsData] = useState<LyricLine[] | null>(null);
    const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
    const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
    const lyricsContainerRef = useRef<HTMLDivElement>(null);

    const audioRef = useRef<HTMLAudioElement>(null);

    // Draggable Cams State
    const [camPositions, setCamPositions] = useState<{ [key: string]: { x: number, y: number } }>({});
    const dragInfo = useRef<{ id: string | null, startX: number, startY: number, initialX: number, initialY: number }>({
        id: null, startX: 0, startY: 0, initialX: 0, initialY: 0
    });

    // Peer & WebRTC State
    const [myPeerId, setMyPeerId] = useState<string>('');
    const [peers, setPeers] = useState<PeerStream[]>([]);
    const [peerNames, setPeerNames] = useState<Record<string, string>>({});
    const [isHost, setIsHost] = useState(false);
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const { currentUser } = useAuth();
    const displayName = currentUser?.realName || currentUser?.anonymousId || 'Anonymous';

    // Chat State
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState<{ user: string, text: string }[]>([
        { user: 'System', text: 'Welcome to the Music Jam!' }
    ]);
    const [newMessage, setNewMessage] = useState('');

    const peerInstance = useRef<Peer | null>(null);
    const connections = useRef<{ [key: string]: DataConnection }>({});

    // References for callbacks
    const currentTrackRef = useRef(currentTrack);
    const isPlayingRef = useRef(isPlaying);
    const queueRef = useRef(queue);
    useEffect(() => {
        currentTrackRef.current = currentTrack;
        isPlayingRef.current = isPlaying;
        queueRef.current = queue;
    }, [currentTrack, isPlaying, queue]);

    // Initialize Peer
    useEffect(() => {
        if (roomCode) {
            if (peerInstance.current) {
                peerInstance.current.destroy();
            }

            const initPeer = async () => {
                try {
                    let stream: MediaStream;
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    } catch (err) {
                        console.warn("Media Access Failed", err);
                        const canvas = document.createElement('canvas');
                        const videoTrack = canvas.captureStream(30).getVideoTracks()[0];
                        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const audioTrack = audioCtx.createMediaStreamDestination().stream.getAudioTracks()[0];
                        stream = new MediaStream([videoTrack, audioTrack]);
                    }
                    setMyStream(stream);

                    const newPeerId = isHost ? roomCode : undefined;
                    const peer = newPeerId ? new Peer(newPeerId) : new Peer();

                    peer.on('open', (id) => {
                        setMyPeerId(id);
                        if (isHost) {
                            analytics.virtualDateStart('Music Jam');
                        } else {
                            analytics.virtualDateJoin();
                            connectToPeer(roomCode, stream, peer);
                        }
                    });

                    peer.on('call', (call) => {
                        call.answer(stream);
                        call.on('stream', (remoteStream) => {
                            setPeers(prev => prev.find(p => p.peerId === call.peer) ? prev : [...prev, { peerId: call.peer, stream: remoteStream }]);
                        });
                        call.on('close', () => setPeers(prev => prev.filter(p => p.peerId !== call.peer)));
                    });

                    peer.on('connection', setupDataConnection);
                    peerInstance.current = peer;
                } catch (err: any) {
                    setError(`System Error: ${err.message}`);
                }
            };
            initPeer();

            return () => {
                peerInstance.current?.destroy();
                setPeers([]);
                if (myStream) myStream.getTracks().forEach(track => track.stop());
            };
        }
    }, [roomCode, isHost]);

    const connectToPeer = (targetId: string, stream: MediaStream, peer: Peer) => {
        const call = peer.call(targetId, stream);
        const conn = peer.connect(targetId, { reliable: true });

        setupDataConnection(conn);

        call.on('stream', (remoteStream) => {
            setPeers(prev => prev.find(p => p.peerId === targetId) ? prev : [...prev, { peerId: targetId, stream: remoteStream }]);
        });
        call.on('close', () => setPeers(prev => prev.filter(p => p.peerId !== targetId)));
    };

    const setupDataConnection = (conn: DataConnection) => {
        conn.on('open', () => {
            connections.current[conn.peer] = conn;
            conn.send({ type: 'IDENTITY', payload: { name: displayName } });

            if (isHost) {
                conn.send({ type: 'SYNC_PLAYER', action: 'queue_sync', payload: queueRef.current });
                if (currentTrackRef.current) {
                    conn.send({ type: 'SYNC_PLAYER', action: 'track', payload: currentTrackRef.current });
                    if (isPlayingRef.current) {
                        conn.send({ type: 'SYNC_PLAYER', action: 'play' });
                        if (audioRef.current) {
                            conn.send({ type: 'SYNC_PLAYER', action: 'seek', time: audioRef.current.currentTime });
                        }
                    }
                }
            }
        });

        conn.on('data', (data: any) => handleDataMessage(data, conn.peer));
        conn.on('close', () => {
            setPeers(prev => prev.filter(p => p.peerId !== conn.peer));
            delete connections.current[conn.peer];
        });
    };

    const handleDataMessage = (data: any, senderId: string) => {
        if (data.type === 'IDENTITY') {
            setPeerNames(prev => ({ ...prev, [senderId]: data.payload.name }));
        } else if (data.type === 'CHAT') {
            const senderName = peerNames[senderId] || senderId.substring(0, 5);
            setMessages(prev => [...prev, { user: senderName, text: data.text }]);
        } else if (data.type === 'SYNC_PLAYER') {
            if (data.action === 'track') {
                setCurrentTrack(data.payload);
            } else if (data.action === 'play') {
                setIsPlaying(true);
            } else if (data.action === 'pause') {
                setIsPlaying(false);
            } else if (data.action === 'seek' && audioRef.current) {
                audioRef.current.currentTime = data.time;
            } else if (data.action === 'time_update' && audioRef.current) {
                const diff = Math.abs(audioRef.current.currentTime - data.time);
                if (diff > 1.5) audioRef.current.currentTime = data.time;
            } else if (data.action === 'queue_add') {
                setQueue(prev => [...prev, data.payload]);
            } else if (data.action === 'queue_sync') {
                setQueue(data.payload);
            }
        }
    };

    const broadcastData = (data: any) => {
        Object.values(connections.current).forEach(conn => {
            if (conn.open) conn.send(data);
        });
    };

    const broadcastSync = (action: string, payload: any = {}) => {
        if (!isHost && action !== 'queue_add') return;
        broadcastData({ type: 'SYNC_PLAYER', action, ...payload });
    };

    // Fullscreen and Volume Effects
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = musicVolume;
        }
    }, [musicVolume]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            if (containerRef.current?.requestFullscreen) {
                await containerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            }
        }
    };

    // Audio Sync Effects
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Audio play error", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentTrack]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isHost && isPlaying) {
            interval = setInterval(() => {
                if (audioRef.current) {
                    broadcastSync('time_update', { time: audioRef.current.currentTime });
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isHost, isPlaying]);

    // Reset lyrics when track changes
    useEffect(() => {
        setShowLyrics(false);
        setLyricsData(null);
        setPlainLyrics(null);
        setActiveLyricIndex(-1);
    }, [currentTrack]);

    // Search JioSaavn API
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setSearchResults(data);
            } else {
                setSearchResults([]);
            }
        } catch (err) {
            setError('Failed to search music. Try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const parseLyrics = (lrcString: string) => {
        const lines = lrcString.split('\n');
        const lyricsList: LyricLine[] = [];
        const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
        for (const line of lines) {
            const match = timeRegex.exec(line);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const ms = parseInt(match[3].padEnd(3, '0'));
                const time = minutes * 60 + seconds + ms / 1000;
                const text = line.replace(timeRegex, '').trim();
                if (text) lyricsList.push({ time, text });
            }
        }
        return lyricsList;
    };

    const toggleLyrics = async () => {
        if (!currentTrack) return;
        if (!showLyrics) {
            if (!lyricsData && !plainLyrics) {
                setIsLoadingLyrics(true);
                try {
                    const q = encodeURIComponent(`${currentTrack.song} ${currentTrack.singers.split(',')[0]}`);
                    const res = await fetch(`https://lrclib.net/api/search?q=${q}`);
                    const data = await res.json();

                    if (data && data.length > 0) {
                        const topHit = data[0];
                        if (topHit.syncedLyrics) {
                            setLyricsData(parseLyrics(topHit.syncedLyrics));
                        } else if (topHit.plainLyrics) {
                            setPlainLyrics(topHit.plainLyrics.replace(/\n/g, '<br>'));
                        } else {
                            setPlainLyrics("<p class='text-gray-500 italic mt-8'>No lyrics available for this track.</p>");
                        }
                    } else {
                        setPlainLyrics("<p class='text-gray-500 italic mt-8'>No lyrics available for this track.</p>");
                    }
                } catch (err) {
                    setPlainLyrics("<p class='text-red-400 mt-8'>Error loading lyrics.</p>");
                } finally {
                    setIsLoadingLyrics(false);
                }
            }
            setShowLyrics(true);
        } else {
            setShowLyrics(false);
        }
    };

    const playSelectedTrack = (track: Track) => {
        setCurrentTrack(track);
        setIsPlaying(true);
        if (audioRef.current) {
            audioRef.current.src = track.media_url;
            audioRef.current.play().catch(e => console.error("Audio play error", e));
        }
        broadcastSync('track', { payload: track });
        broadcastSync('play');
    };

    const handleTrackSelect = (track: Track, forcePlay: boolean = false) => {
        if (isHost && (forcePlay || !currentTrack)) {
            playSelectedTrack(track);
        } else {
            // Add to queue for everyone
            broadcastSync('queue_add', { payload: track });
            setQueue(prev => [...prev, track]);
        }
    };

    const handleSongEnded = () => {
        if (isHost) {
            if (queueRef.current.length > 0) {
                const nextTrack = queueRef.current[0];
                const newQueue = queueRef.current.slice(1);
                setQueue(newQueue);
                broadcastSync('queue_sync', { payload: newQueue });
                playSelectedTrack(nextTrack);
            } else {
                setIsPlaying(false);
                broadcastSync('pause');
            }
        }
    };

    const handleSkip = () => {
        if (isHost) handleSongEnded();
    };

    const handlePlayPause = () => {
        if (!currentTrack) return;
        const newPlayingState = !isPlaying;
        setIsPlaying(newPlayingState);
        if (audioRef.current) {
            if (newPlayingState) audioRef.current.play().catch(e => console.error("Audio play error", e));
            else audioRef.current.pause();
        }
        broadcastSync(newPlayingState ? 'play' : 'pause');
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const time = audioRef.current.currentTime;
            setCurrentTime(time);

            if (showLyrics && lyricsData) {
                let activeIdx = -1;
                for (let i = 0; i < lyricsData.length; i++) {
                    if (time >= lyricsData[i].time) {
                        activeIdx = i;
                    } else {
                        break;
                    }
                }

                if (activeIdx !== activeLyricIndex && activeIdx !== -1) {
                    setActiveLyricIndex(activeIdx);
                    const activeEl = document.getElementById(`lyric-${activeIdx}`);
                    if (activeEl) {
                        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }
        }
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isHost || !audioRef.current) return;
        const newTime = Number(e.target.value);
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
        broadcastSync('seek', { time: newTime });
    };

    const generateRoomCode = () => {
        const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const numbers = '0123456789';
        let code = '';
        for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
        code += '-';
        for (let i = 0; i < 3; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));
        return code;
    };

    const handleCreateRoom = () => {
        if (!roomName.trim()) {
            setError('Please enter a room name');
            return;
        }
        setIsConnecting(true);
        setRoomCode(generateRoomCode());
        setIsHost(true);
        setMode('room');
        setTimeout(() => setIsConnecting(false), 1000);
    };

    const handleJoinRoom = () => {
        const formatted = joinCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (formatted.length !== 6) {
            setError('Please enter a valid room code (e.g., ABC-123)');
            return;
        }
        setRoomCode(`${formatted.slice(0, 3)}-${formatted.slice(3, 6)}`);
        setRoomName('Joined Room');
        setIsHost(false);
        setMode('room');
    };

    const toggleMute = () => {
        if (myStream) {
            myStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (myStream) {
            myStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
            setIsVideoOff(!isVideoOff);
        }
    };

    // Draggable Cam logic
    const handleCamMouseDown = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        const pos = camPositions[id] || { x: 0, y: 0 };
        dragInfo.current = { id, startX: e.clientX, startY: e.clientY, initialX: pos.x, initialY: pos.y };

        const handleMouseMove = (mvEvent: MouseEvent) => {
            if (!dragInfo.current.id) return;
            const dx = mvEvent.clientX - dragInfo.current.startX;
            const dy = mvEvent.clientY - dragInfo.current.startY;
            setCamPositions(prev => ({
                ...prev,
                [dragInfo.current.id as string]: { x: dragInfo.current.initialX + dx, y: dragInfo.current.initialY + dy }
            }));
        };

        const handleMouseUp = () => {
            dragInfo.current.id = null;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setMessages([...messages, { user: displayName, text: newMessage }]);
        broadcastData({ type: 'CHAT', text: newMessage });
        setNewMessage('');
    };

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    if (mode === 'landing') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-black relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none -z-0 animate-pulse" style={{ animationDuration: '4s' }} />

                <button onClick={() => navigate('/virtual-date')} className="absolute top-6 left-6 p-3 bg-gray-900/50 hover:bg-gray-800 rounded-full transition-colors z-20 border border-gray-800">
                    <ArrowLeft className="w-6 h-6 text-gray-400 hover:text-white" />
                </button>

                <div className="text-center mb-16 relative z-10">
                    <h2 className="text-5xl md:text-7xl font-black mb-4 text-white tracking-tighter">
                        SOUL <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-600">SYNC</span>
                    </h2>
                    <p className="text-gray-400 max-w-md mx-auto">Listen to your favorite tracks together in perfect harmony.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4 max-w-2xl relative z-10">
                    <button onClick={() => setMode('create_room')} className="group flex flex-col items-center p-10 bg-gray-900/40 backdrop-blur-md hover:bg-gray-800/80 border-2 border-gray-800 hover:border-violet-500 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/20">
                        <div className="p-6 rounded-full bg-violet-500/10 text-violet-500 mb-6 group-hover:scale-110 transition-transform shadow-lg">
                            <PlusCircle className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Create Jam</h3>
                        <p className="text-gray-400 text-sm">Host a new music session</p>
                    </button>

                    <button onClick={() => setMode('join_room')} className="group flex flex-col items-center p-10 bg-gray-900/40 backdrop-blur-md hover:bg-gray-800/80 border-2 border-gray-800 hover:border-indigo-500 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20">
                        <div className="p-6 rounded-full bg-indigo-500/10 text-indigo-500 mb-6 group-hover:scale-110 transition-transform shadow-lg">
                            <LogIn className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Join Jam</h3>
                        <p className="text-gray-400 text-sm">Enter a room code</p>
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'create_room' || mode === 'join_room') {
        const isCreate = mode === 'create_room';
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-black relative px-4">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                <button onClick={() => setMode('landing')} className="absolute top-6 left-6 p-3 bg-gray-900/50 hover:bg-gray-800 rounded-full z-20 border border-gray-800">
                    <ArrowLeft className="w-6 h-6 text-gray-400 hover:text-white" />
                </button>

                <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">{isCreate ? 'Create Jam Room' : 'Join Jam Room'}</h2>
                        <p className="text-sm text-gray-400">{isCreate ? 'Give your room a fun name' : 'Enter the host\'s code'}</p>
                    </div>
                    {error && <div className="mb-4 text-red-500 text-sm text-center bg-red-500/10 py-2 rounded-xl">{error}</div>}
                    <div className="space-y-4">
                        {isCreate ? (
                            <input type="text" value={roomName} onChange={e => setRoomName(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleCreateRoom()} placeholder="e.g., Midnight Vibes 🌙" maxLength={30} className="w-full bg-black/50 border-2 border-gray-700 rounded-xl px-4 py-4 text-white focus:border-violet-500 focus:outline-none transition-colors" autoFocus />
                        ) : (
                            <input type="text" value={joinCode} onChange={e => {
                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                                setJoinCode(val.length === 3 && !val.includes('-') ? val + '-' : val.slice(0, 7));
                            }} onKeyPress={e => e.key === 'Enter' && handleJoinRoom()} placeholder="ABC-123" className="w-full bg-black/50 border-2 border-gray-700 rounded-xl px-4 py-4 text-center text-2xl tracking-widest text-white focus:border-indigo-500 focus:outline-none transition-colors font-mono" autoFocus />
                        )}
                        <button onClick={isCreate ? handleCreateRoom : handleJoinRoom} disabled={isConnecting} className={`w-full bg-gradient-to-r text-white font-bold py-4 rounded-xl shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2 ${isCreate ? 'from-violet-500 to-indigo-500 shadow-violet-500/20' : 'from-indigo-500 to-purple-500 shadow-indigo-500/20'}`}>
                            {isConnecting ? <Loader className="w-5 h-5 animate-spin" /> : (isCreate ? 'Start Jam' : 'Join Jam')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="flex flex-col h-full w-full bg-[#050510] text-white overflow-hidden font-sans relative">
            <audio ref={audioRef} src={currentTrack?.media_url} onTimeUpdate={handleTimeUpdate} onEnded={handleSongEnded} />

            {/* Header / Nav Bar */}
            {!isFullscreen && (
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md relative z-30">
                    <div className="flex items-center gap-4 border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 rounded-full">
                        <span className="font-bold text-gray-200">{roomName}</span>
                        <div className="w-px h-4 bg-white/20" />
                        <span className="font-mono text-neon font-bold flex items-center gap-1 cursor-pointer">
                            <Hash className="w-3 h-3" /> {roomCode}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button onClick={() => setShowVolumeControls(!showVolumeControls)} className={`p-2 rounded-xl transition-colors ${showVolumeControls ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-gray-800 text-gray-400'}`}>
                                <Volume2 className="w-5 h-5" />
                            </button>
                            {showVolumeControls && (
                                <div className="absolute top-12 right-0 w-64 bg-gray-900 border border-white/10 rounded-2xl p-5 shadow-2xl z-50 flex flex-col gap-6">
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                                            <span>Music Volume</span>
                                            <span>{Math.round(musicVolume * 100)}%</span>
                                        </div>
                                        <input type="range" min="0" max="1" step="0.01" value={musicVolume} onChange={e => setMusicVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                                            <span>Partner Volume</span>
                                            <span>{Math.round(partnerVolume * 100)}%</span>
                                        </div>
                                        <input type="range" min="0" max="1" step="0.01" value={partnerVolume} onChange={e => setPartnerVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setShowChat(!showChat)} className={`p-2 rounded-xl transition-colors ${showChat ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-gray-800 text-gray-400'}`}>
                            <MessageSquare className="w-5 h-5" />
                        </button>
                        <button onClick={toggleFullscreen} className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 transition-colors">
                            <Maximize className="w-5 h-5" />
                        </button>
                        <button onClick={() => setMode('landing')} className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Float Controls in Fullscreen */}
            {isFullscreen && (
                <div className="absolute top-4 right-6 flex items-center gap-3 z-50">
                    <div className="relative">
                        <button onClick={() => setShowVolumeControls(!showVolumeControls)} className={`p-2 rounded-xl backdrop-blur-md transition-colors shadow-lg ${showVolumeControls ? 'bg-violet-500/80 text-white shadow-violet-500/20' : 'bg-black/60 hover:bg-black/80 text-gray-300'}`}>
                            <Volume2 className="w-5 h-5" />
                        </button>
                        {showVolumeControls && (
                            <div className="absolute top-12 right-0 w-64 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl z-50 flex flex-col gap-6">
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                                        <span>Music Volume</span>
                                        <span>{Math.round(musicVolume * 100)}%</span>
                                    </div>
                                    <input type="range" min="0" max="1" step="0.01" value={musicVolume} onChange={e => setMusicVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                                        <span>Partner Volume</span>
                                        <span>{Math.round(partnerVolume * 100)}%</span>
                                    </div>
                                    <input type="range" min="0" max="1" step="0.01" value={partnerVolume} onChange={e => setPartnerVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500" />
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setShowChat(!showChat)} className={`p-2 rounded-xl backdrop-blur-md transition-colors shadow-lg ${showChat ? 'bg-violet-500/80 text-white shadow-violet-500/20' : 'bg-black/60 hover:bg-black/80 text-gray-300'}`}>
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    <button onClick={toggleFullscreen} className="p-2 rounded-xl backdrop-blur-md bg-black/60 hover:bg-black/80 text-gray-300 transition-colors shadow-lg">
                        <Minimize className="w-5 h-5" />
                    </button>
                </div>
            )}

            <div className="flex-1 flex overflow-hidden relative">

                {/* Visualizer Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none overflow-hidden">
                    <div className={`w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 blur-[150px] transition-transform duration-[10s] ${isPlaying ? 'scale-110 animate-pulse' : 'scale-90 opacity-10'}`} />
                </div>

                {/* Left Side: Now Playing */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 z-10 flex flex-col items-center justify-center relative">
                    {showLyrics ? (
                        <div ref={lyricsContainerRef} className="absolute inset-0 w-full h-full bg-[#050510]/95 backdrop-blur-3xl p-8 md:p-16 overflow-y-auto custom-scrollbar flex flex-col items-center scroll-smooth z-40">
                            {isLoadingLyrics ? (
                                <div className="flex-1 flex items-center justify-center h-full">
                                    <Loader className="w-10 h-10 text-violet-500 animate-spin" />
                                </div>
                            ) : lyricsData ? (
                                <div className="w-full max-w-5xl mx-auto text-center py-32 space-y-12 transition-all">
                                    {lyricsData.map((line, idx) => (
                                        <p key={idx} id={`lyric-${idx}`} className={`transition-all duration-500 leading-tight ${idx === activeLyricIndex ? 'text-white text-4xl md:text-6xl lg:text-7xl font-black drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'text-gray-600 text-2xl md:text-4xl font-bold opacity-50 hover:opacity-100 hover:text-gray-300'}`}>
                                            {line.text}
                                        </p>
                                    ))}
                                </div>
                            ) : (
                                <div
                                    className="text-lg md:text-2xl text-gray-300 text-center leading-loose pb-12 mt-4 font-mono w-full px-2 max-w-4xl mx-auto py-32"
                                    dangerouslySetInnerHTML={{ __html: plainLyrics || '' }}
                                />
                            )}

                            <button
                                onClick={toggleLyrics}
                                className="fixed top-8 right-8 bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-full text-white shadow-2xl transition-transform hover:scale-105 active:scale-95 border border-white/20 z-50 mix-blend-difference"
                                title="Hide Lyrics"
                            >
                                <ImageIcon className="w-6 h-6" />
                            </button>
                        </div>
                    ) : (
                        <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center transition-all my-auto z-10">
                            <div className="relative w-80 h-80 sm:w-96 sm:h-96 shrink-0 shadow-[0_0_60px_rgba(139,92,246,0.15)] rounded-[2.5rem] overflow-hidden mb-12 border border-white/5 group">
                                {currentTrack ? (
                                    <img src={currentTrack.image.replace('150x150', '500x500')} alt={currentTrack.song} className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full bg-gray-900/50 backdrop-blur flex items-center justify-center">
                                        <Music className="w-24 h-24 text-gray-700" />
                                    </div>
                                )}

                                {isPlaying && (
                                    <div className="absolute inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="flex gap-2.5 h-12 items-end">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="w-2.5 bg-neon rounded-full animate-pulse shadow-[0_0_15px_#fff]" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {currentTrack && (
                                    <button
                                        onClick={toggleLyrics}
                                        className="absolute bottom-5 right-5 bg-black/60 hover:bg-black/80 backdrop-blur-md p-3.5 rounded-2xl text-white shadow-xl transition-all hover:scale-110 active:scale-95 border border-white/20 z-20 group/btn"
                                        title="Show Lyrics"
                                    >
                                        <FileText className="w-6 h-6 group-hover/btn:text-violet-400 transition-colors" />
                                    </button>
                                )}
                            </div>

                            <div className="w-full flex flex-col items-center px-4">
                                <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 line-clamp-2 tracking-tight drop-shadow-xl">{currentTrack?.song || 'Select a track'}</h1>
                                <p className="text-xl sm:text-2xl text-violet-300 mb-12 font-medium tracking-wide opacity-90">{currentTrack?.singers || 'JioSaavnAPI Jam'}</p>

                                {/* Playback Controls */}
                                <div className="w-full max-w-lg mt-auto">
                                    <input
                                        type="range"
                                        min="0"
                                        max={currentTrack ? Number(currentTrack.duration) : 100}
                                        value={currentTime}
                                        onChange={handleProgressChange}
                                        disabled={!isHost || !currentTrack}
                                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-violet-500 hover:accent-violet-400 transition-all mb-3"
                                    />
                                    <div className="flex justify-between text-sm text-gray-400 font-mono font-medium">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{currentTrack ? formatTime(Number(currentTrack.duration)) : '0:00'}</span>
                                    </div>

                                    <div className="flex items-center justify-center gap-8 mt-8">
                                        <button
                                            onClick={handlePlayPause}
                                            disabled={!isHost || !currentTrack}
                                            className="w-20 h-20 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                                        >
                                            {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
                                        </button>
                                        <button
                                            onClick={handleSkip}
                                            disabled={!isHost || !currentTrack}
                                            className="w-14 h-14 flex items-center justify-center bg-white/10 text-white rounded-full hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 backdrop-blur-sm"
                                            title="Skip to next in queue"
                                        >
                                            <SkipForward className="w-6 h-6 fill-current" />
                                        </button>
                                    </div>
                                    {!isHost && <p className="mt-6 text-xs text-gray-500">Only host can skip tracks or control playback progress.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Search & Queue (Hidden in Fullscreen) */}
                {!isFullscreen && (
                    <div className="w-96 border-l border-white/5 bg-black/40 backdrop-blur-md z-20 flex flex-col flex-shrink-0">
                        <div className="p-4 border-b border-white/5 bg-gray-950/50">
                            <form onSubmit={handleSearch} className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search for a song..."
                                    className="w-full bg-gray-900/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                                />
                            </form>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                            {searchResults.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Search Results</h3>
                                    <div className="space-y-1">
                                        {searchResults.map((track) => (
                                            <div key={track.id} onClick={() => handleTrackSelect(track, true)} className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl cursor-pointer transition-colors group">
                                                <img src={track.image} alt={track.song} className="w-10 h-10 rounded-md object-cover" />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-white text-sm font-bold truncate group-hover:text-violet-300">{track.song}</h4>
                                                    <p className="text-gray-400 text-xs truncate">{track.singers}</p>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); handleTrackSelect(track, false); }} className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    <PlusCircle className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Up Next Queue ({queue.length})</h3>
                                {queue.length === 0 ? (
                                    <p className="text-sm text-gray-600 px-2 italic">Queue is empty</p>
                                ) : (
                                    <div className="space-y-1">
                                        {queue.map((track, idx) => (
                                            <div key={`${track.id}-${idx}`} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                                                <span className="text-xs text-gray-500 w-4 font-mono text-center">{idx + 1}</span>
                                                <img src={track.image} alt={track.song} className="w-8 h-8 rounded-md object-cover" />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-white text-sm font-medium truncate">{track.song}</h4>
                                                    <p className="text-gray-400 text-[10px] truncate">{track.singers}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat Panel - Absolutely Positioned if open */}
                {showChat && (
                    <div className="absolute right-96 top-0 bottom-0 w-80 border-l border-white/5 bg-gray-950/95 backdrop-blur-2xl flex flex-col z-30 shadow-2xl transition-all">
                        <div className="h-14 border-b border-white/5 flex items-center justify-between px-4">
                            <span className="font-bold text-gray-300 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-violet-400" /> Chat</span>
                            <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex flex-col ${msg.user === displayName ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${msg.user === displayName ? 'bg-violet-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-200 rounded-bl-sm'}`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[10px] text-gray-500 mt-1 px-1">{msg.user}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-white/5 bg-black">
                            <form onSubmit={handleSendMessage} className="relative">
                                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-violet-500" />
                                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-violet-400 hover:bg-violet-500/20 rounded-lg transition-colors"><Send className="w-4 h-4" /></button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Video Grids Overlay - Draggable Absolute Position */}
            <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
                {myStream && (
                    <div
                        onMouseDown={(e) => handleCamMouseDown(e, 'me')}
                        style={{
                            transform: `translate(${camPositions['me']?.x || 24}px, ${camPositions['me']?.y || 24}px)`,
                            position: 'absolute', top: 0, left: 0
                        }}
                        className="w-32 h-24 md:w-48 md:h-32 bg-gray-900 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl pointer-events-auto cursor-move shadow-black/50 group"
                    >
                        <StreamVideo stream={myStream} muted={true} mirrored={true} />
                        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center bg-black/40 backdrop-blur-md rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs font-bold text-white">You</span>
                            <div className="flex gap-1">
                                <button onMouseDown={e => e.stopPropagation()} onClick={toggleMute} className={`p-1 rounded-md ${isMuted ? 'text-red-400' : 'text-gray-300 hover:text-white'}`}>{isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}</button>
                                <button onMouseDown={e => e.stopPropagation()} onClick={toggleVideo} className={`p-1 rounded-md ${isVideoOff ? 'text-red-400' : 'text-gray-300 hover:text-white'}`}>{isVideoOff ? <VideoOff className="w-3 h-3" /> : <Video className="w-3 h-3" />}</button>
                            </div>
                        </div>
                    </div>
                )}
                {peers.map((peer, i) => (
                    <div
                        key={peer.peerId}
                        onMouseDown={(e) => handleCamMouseDown(e, peer.peerId)}
                        style={{
                            transform: `translate(${camPositions[peer.peerId]?.x || 24}px, ${camPositions[peer.peerId]?.y || 24 + ((i + 1) * 140)}px)`,
                            position: 'absolute', top: 0, left: 0
                        }}
                        className="w-32 h-24 md:w-48 md:h-32 bg-gray-900 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl pointer-events-auto cursor-move shadow-black/50 group"
                    >
                        <StreamVideo stream={peer.stream} mirrored={true} volume={partnerVolume} />
                        <span className="absolute bottom-2 left-2 text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">{peerNames[peer.peerId] || 'Peer'}</span>
                    </div>
                ))}
            </div>

            {/* Global Error Toast */}
            {error && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-red-500/90 backdrop-blur-md text-white font-medium flex items-center gap-2 shadow-2xl z-50 animate-fade-in-down pointer-events-auto">
                    <AlertCircle className="w-5 h-5" /> {error}
                    <button onClick={() => setError(null)} className="ml-2 hover:bg-black/20 p-1 rounded-full"><X className="w-4 h-4" /></button>
                </div>
            )}
        </div>
    );
};

export default MusicDate;
