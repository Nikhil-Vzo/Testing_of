import React, { useEffect, useState } from 'react';

interface ForceLogoutCountdownProps {
    onComplete: () => void;
}

const ForceLogoutCountdown: React.FC<ForceLogoutCountdownProps> = ({ onComplete }) => {
    const [count, setCount] = useState(5);

    useEffect(() => {
        if (count <= 0) {
            onComplete();
            return;
        }
        const timer = setTimeout(() => setCount(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [count, onComplete]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.3s ease',
        }}>
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes ring {
          0% { transform: scale(0.95); opacity: 0.7; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>

            <div style={{
                textAlign: 'center',
                padding: '40px 32px',
                borderRadius: '24px',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))',
                border: '1px solid rgba(255,255,255,0.12)',
                maxWidth: '340px',
                width: '90%',
            }}>
                {/* Icon */}
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>🔄</div>

                {/* Title */}
                <h2 style={{
                    color: '#fff',
                    fontSize: '20px',
                    fontWeight: 700,
                    margin: '0 0 8px 0',
                    fontFamily: 'system-ui, sans-serif',
                }}>
                    New updates available
                </h2>

                {/* Subtitle */}
                <p style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '14px',
                    margin: '0 0 32px 0',
                    lineHeight: 1.5,
                    fontFamily: 'system-ui, sans-serif',
                }}>
                    We're logging you out to apply the latest updates. Your data is safe — just log back in.
                </p>

                {/* Countdown circle */}
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Pulsing ring */}
                    <div style={{
                        position: 'absolute',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        border: '2px solid rgba(255, 75, 110, 0.6)',
                        animation: 'ring 1s ease-out infinite',
                    }} />
                    {/* Circle */}
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ff4b6e, #ff6b35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'pulse 1s ease-in-out infinite',
                        boxShadow: '0 0 30px rgba(255, 75, 110, 0.4)',
                    }}>
                        <span style={{
                            color: '#fff',
                            fontSize: '32px',
                            fontWeight: 800,
                            fontFamily: 'system-ui, sans-serif',
                            lineHeight: 1,
                        }}>
                            {count}
                        </span>
                    </div>
                </div>

                {/* Bottom label */}
                <p style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '12px',
                    margin: '20px 0 0 0',
                    fontFamily: 'system-ui, sans-serif',
                    letterSpacing: '0.5px',
                }}>
                    Logging out in {count} second{count !== 1 ? 's' : ''}...
                </p>
            </div>
        </div>
    );
};

export default ForceLogoutCountdown;
