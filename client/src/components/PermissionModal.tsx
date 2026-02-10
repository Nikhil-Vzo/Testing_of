import React, { useState, useEffect } from 'react';
import { Camera, Mic, Check, X, ShieldAlert } from 'lucide-react';

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

    useEffect(() => {
        if (isOpen) {
            checkCurrentPermissions();
        }
    }, [isOpen]);

    const checkCurrentPermissions = async () => {
        // Basic check if already granted
        try {
            if (requiredPermissions.includes('camera')) {
                const cam = await navigator.permissions.query({ name: 'camera' as PermissionName });
                setCameraStatus(cam.state === 'granted' ? 'granted' : 'pending');
            } else {
                setCameraStatus('granted'); // Not needed
            }

            const mic = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            setMicStatus(mic.state === 'granted' ? 'granted' : 'pending');
        } catch (e) {
            // Firefox/Safari might not support query
            console.log('Permission query not supported, waiting for manual trigger');
        }
    };

    const requestPermissions = async () => {
        setChecking(true);
        try {
            const constraints: MediaStreamConstraints = {};
            if (requiredPermissions.includes('camera')) constraints.video = true;
            constraints.audio = true;

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // If successful, stop tracks immediately to release device
            stream.getTracks().forEach(track => track.stop());

            setCameraStatus('granted');
            setMicStatus('granted');

            // Delay slightly for UX
            setTimeout(() => {
                onPermissionsGranted();
            }, 500);

        } catch (err) {
            console.error('Permission denied:', err);
            // Try to detect which one failed (not precise in all browsers)
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 text-center space-y-6">

                <div className="flex justify-center">
                    <div className="p-4 bg-gray-800 rounded-full">
                        <ShieldAlert className="w-8 h-8 text-neon" />
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-white mb-2">Enable Access</h2>
                    <p className="text-sm text-gray-400">
                        To start the call, we need access to your device's inputs.
                        Your privacy is protected appropriately.
                    </p>
                </div>

                <div className="space-y-3">
                    {requiredPermissions.includes('camera') && (
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                            <div className="flex items-center gap-3">
                                <Camera className="w-5 h-5 text-blue-400" />
                                <span className="text-sm font-medium text-gray-200">Camera</span>
                            </div>
                            <div>
                                {cameraStatus === 'granted' ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                ) : cameraStatus === 'denied' ? (
                                    <span className="text-xs text-red-500 font-bold">DENIED</span>
                                ) : (
                                    <span className="text-xs text-gray-500">Required</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                        <div className="flex items-center gap-3">
                            <Mic className="w-5 h-5 text-purple-400" />
                            <span className="text-sm font-medium text-gray-200">Microphone</span>
                        </div>
                        <div>
                            {micStatus === 'granted' ? (
                                <Check className="w-5 h-5 text-green-500" />
                            ) : micStatus === 'denied' ? (
                                <span className="text-xs text-red-500 font-bold">DENIED</span>
                            ) : (
                                <span className="text-xs text-gray-500">Required</span>
                            )}
                        </div>
                    </div>
                </div>

                {(cameraStatus === 'denied' || micStatus === 'denied') && (
                    <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-xs text-red-400">
                        Access was blocked. Please enable permissions in your browser settings (lock icon in address bar) and reload.
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>

                    {!isAllGranted ? (
                        <button
                            onClick={requestPermissions}
                            disabled={checking}
                            className="flex-1 py-3 text-sm font-bold bg-neon hover:bg-neon/90 text-black rounded-xl transition-all shadow-lg shadow-neon/20 disabled:opacity-50"
                        >
                            {checking ? 'Checking...' : 'Allow Access'}
                        </button>
                    ) : (
                        <button
                            className="flex-1 py-3 text-sm font-bold bg-green-500 text-white rounded-xl cursor-default"
                        >
                            Access Granted
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};
