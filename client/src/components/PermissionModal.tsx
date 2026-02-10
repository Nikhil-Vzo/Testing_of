import React, { useState, useEffect } from 'react';
import { Camera, Mic, Check, X, Shield, Settings, Lock, Smartphone } from 'lucide-react';

interface PermissionModalProps {
    isOpen: boolean;
    onPermissionsGranted: () => void;
    onCancel: () => void;
    requiredPermissions: ('camera' | 'microphone')[];
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
    isOpen,
    onPermissionsGranted,
    onCancel,
    requiredPermissions
}) => {
    const [cameraStatus, setCameraStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
    const [micStatus, setMicStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
    const [checking, setChecking] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        if (isOpen) {
            checkCurrentPermissions();
            window.addEventListener('focus', checkCurrentPermissions);
            return () => window.removeEventListener('focus', checkCurrentPermissions);
        }
    }, [isOpen]);

    const checkCurrentPermissions = async () => {
        try {
            if (navigator.permissions && navigator.permissions.query) {
                try {
                    if (requiredPermissions.includes('camera')) {
                        const cam = await navigator.permissions.query({ name: 'camera' as PermissionName });
                        setCameraStatus(cam.state === 'granted' ? 'granted' : 'pending');
                    }
                    const mic = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                    setMicStatus(mic.state === 'granted' ? 'granted' : 'pending');
                } catch (e) {
                    console.log('Permission API query failed');
                }
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            let hasCamPermission = false;
            let hasMicPermission = false;

            devices.forEach(dev => {
                if (dev.kind === 'videoinput' && dev.label.length > 0) hasCamPermission = true;
                if (dev.kind === 'audioinput' && dev.label.length > 0) hasMicPermission = true;
            });

            if (hasCamPermission && requiredPermissions.includes('camera')) setCameraStatus('granted');
            if (hasMicPermission) setMicStatus('granted');
        } catch (e) {
            console.log('Permission check failed', e);
        }
    };

    const requestPermissions = async () => {
        setChecking(true);
        try {
            const constraints: MediaStreamConstraints = {};
            if (requiredPermissions.includes('camera')) constraints.video = true;
            constraints.audio = true;

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            stream.getTracks().forEach(track => track.stop());

            if (requiredPermissions.includes('camera')) setCameraStatus('granted');
            setMicStatus('granted');

            setTimeout(checkCurrentPermissions, 100);
            setTimeout(() => {
                onPermissionsGranted();
            }, 500);

        } catch (err: any) {
            console.error('Permission denied:', err);
            // If permission is denied, immediately show help
            setShowHelp(true);
            if (requiredPermissions.includes('camera')) setCameraStatus('denied');
            setMicStatus('denied');
        } finally {
            setChecking(false);
        }
    };

    if (!isOpen) return null;

    const isAllGranted =
        (requiredPermissions.includes('camera') ? cameraStatus === 'granted' : true) &&
        micStatus === 'granted';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            {/* Glow Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[500px] bg-neon/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="w-full max-w-sm relative z-10">
                <div className="bg-gray-900/90 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">

                    {/* Header Image/Icon */}
                    <div className="h-32 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1616077168712-fc6c788cd4ee?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                        <div className="relative z-10 p-4 bg-black/50 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-bold text-white tracking-tight">Enable Access</h2>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                To connect you with your match, we need access to your device.
                            </p>
                        </div>

                        {/* Status Checklist */}
                        <div className="space-y-3">
                            {requiredPermissions.includes('camera') && (
                                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${cameraStatus === 'granted'
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : cameraStatus === 'denied'
                                        ? 'bg-red-500/10 border-red-500/30'
                                        : 'bg-gray-800/50 border-gray-700'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${cameraStatus === 'granted' ? 'bg-green-500/20' : 'bg-gray-700'
                                            }`}>
                                            <Camera className={`w-5 h-5 ${cameraStatus === 'granted' ? 'text-green-400' : 'text-gray-400'
                                                }`} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-white">Camera</p>
                                            <p className="text-xs text-gray-400">For video calls</p>
                                        </div>
                                    </div>
                                    {cameraStatus === 'granted' ? (
                                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5 text-black font-bold" />
                                        </div>
                                    ) : cameraStatus === 'denied' ? (
                                        <X className="w-5 h-5 text-red-500" />
                                    ) : null}
                                </div>
                            )}

                            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${micStatus === 'granted'
                                ? 'bg-green-500/10 border-green-500/30'
                                : micStatus === 'denied'
                                    ? 'bg-red-500/10 border-red-500/30'
                                    : 'bg-gray-800/50 border-gray-700'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${micStatus === 'granted' ? 'bg-green-500/20' : 'bg-gray-700'
                                        }`}>
                                        <Mic className={`w-5 h-5 ${micStatus === 'granted' ? 'text-green-400' : 'text-gray-400'
                                            }`} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-white">Microphone</p>
                                        <p className="text-xs text-gray-400">For audio</p>
                                    </div>
                                </div>
                                {micStatus === 'granted' ? (
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <Check className="w-3.5 h-3.5 text-black font-bold" />
                                    </div>
                                ) : micStatus === 'denied' ? (
                                    <X className="w-5 h-5 text-red-500" />
                                ) : null}
                            </div>
                        </div>

                        {/* Help Section (Only on Denied) */}
                        {(cameraStatus === 'denied' || micStatus === 'denied' || showHelp) && (
                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 text-left animate-in fade-in slide-in-from-top-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Lock className="w-4 h-4 text-orange-400" />
                                    <h4 className="text-sm font-bold text-orange-400">Please enable manually</h4>
                                </div>
                                <ul className="space-y-2.5 text-xs text-gray-300">
                                    <li className="flex gap-2">
                                        <span className="w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</span>
                                        <span>Tap the <strong>Lock Icon</strong> 🔒 in your address bar (top left/bottom).</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</span>
                                        <span>Tap <strong>Permissions</strong> or <strong>Site Settings</strong>.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</span>
                                        <span>Allow <strong>Microphone</strong> & <strong>Camera</strong>.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">4</span>
                                        <span>Return here - we'll detect it automatically!</span>
                                    </li>
                                </ul>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="pt-2 flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 py-3.5 text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-wider"
                            >
                                Cancel
                            </button>

                            {!isAllGranted ? (
                                <button
                                    onClick={requestPermissions}
                                    disabled={checking}
                                    className="flex-[2] py-3.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-200 transition-all shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {checking ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            Checking...
                                        </>
                                    ) : (
                                        'Allow Access'
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={onPermissionsGranted}
                                    className="flex-[2] py-3.5 bg-green-500 text-black text-sm font-bold rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-400 transition-all flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Start Call
                                </button>
                            )}
                        </div>

                        {/* Chrome Hint */}
                        {!isAllGranted && !showHelp && (
                            <p className="text-[10px] text-gray-500 pt-2 border-t border-gray-800/50">
                                If no popup appears, check your browser settings.
                            </p>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};
