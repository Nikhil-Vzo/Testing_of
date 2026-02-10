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
            // Re-check when window gains focus (user comes back from settings)
            window.addEventListener('focus', checkCurrentPermissions);
            return () => window.removeEventListener('focus', checkCurrentPermissions);
        }
    }, [isOpen]);

    const checkCurrentPermissions = async () => {
        try {
            // 1. Try modern Permissions API first
            let apiSupported = false;
            if (navigator.permissions && navigator.permissions.query) {
                try {
                    if (requiredPermissions.includes('camera')) {
                        const cam = await navigator.permissions.query({ name: 'camera' as PermissionName });
                        setCameraStatus(cam.state === 'granted' ? 'granted' : 'pending');
                    } else {
                        // If camera not required, treat as granted logic-wise
                    }

                    const mic = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                    setMicStatus(mic.state === 'granted' ? 'granted' : 'pending');
                    apiSupported = true;
                } catch (e) {
                    console.log('Permission API query failed or inconsistent');
                }
            }

            // 2. Fallback: Check if we can enumerate devices with labels
            // If we can see labels, we have permission.
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
            console.log('Permission check failed, waiting for manual trigger', e);
        }
    };

    const requestPermissions = async () => {
        setChecking(true);
        try {
            // Request audio first if only audio is needed, or both
            const constraints: MediaStreamConstraints = {};

            // Important: Requesting both at once is often better for UI flow
            if (requiredPermissions.includes('camera')) {
                constraints.video = true;
            }
            constraints.audio = true;

            console.log('[PermissionModal] Requesting permissions with constraints:', constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // If successful, stop tracks immediately to release device
            stream.getTracks().forEach(track => track.stop());

            // Force update state locally as success
            if (requiredPermissions.includes('camera')) setCameraStatus('granted');
            setMicStatus('granted');

            // Verify with enumerate to be sure
            setTimeout(checkCurrentPermissions, 100);

            // Delay slightly for UX before closing
            setTimeout(() => {
                onPermissionsGranted();
            }, 500);

        } catch (err: any) {
            console.error('Permission denied:', err);

            // Handle "Permission denied" vs "Device not found"
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                if (requiredPermissions.includes('camera')) setCameraStatus('denied');
                setMicStatus('denied');
            } else {
                // Maybe device missing?
                console.warn('Device error:', err.message);
            }
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
                    <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-xs text-red-400 text-left">
                        <strong>Access Blocked:</strong><br />
                        1. Tap the lock icon 🔒 in your address bar<br />
                        2. Select "Permissions" or "Site Settings"<br />
                        3. Allow <strong>Microphone</strong> & <strong>Camera</strong><br />
                        4. Come back here (we'll check automatically)
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
                            className="flex-1 py-3 text-sm font-bold bg-green-500 text-white rounded-xl cursor-default animate-pulse"
                        >
                            Starting Call...
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};
