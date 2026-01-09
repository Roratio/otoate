import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

/**
 * Helper to convert Google Drive shareable link to a direct download link.
 * Note: specific format required.
 * https://drive.google.com/file/d/VIEW_ID/view?usp=sharing -> https://drive.google.com/uc?export=download&id=VIEW_ID
 */
// Helper to extract YouTube ID
const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export function AudioPlayer({ src, autoPlay = false, showVideo = false }) {
    const audioRef = useRef(null);
    const iframeRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isYouTube, setIsYouTube] = useState(false);
    const [ytId, setYtId] = useState(null);
    // Initialize volume from localStorage or default to 50
    const [volume, setVolume] = useState(() => {
        const saved = localStorage.getItem('er-volume');
        return saved ? Number(saved) : 50;
    });

    useEffect(() => {
        const id = getYouTubeId(src);
        if (id) {
            setIsYouTube(true);
            setYtId(id);
        } else {
            setIsYouTube(false);
            setYtId(null);
        }
        setIsPlaying(autoPlay);
    }, [src, autoPlay]);

    // Force Auto-Play for Native Video
    useEffect(() => {
        if (!isYouTube && audioRef.current && autoPlay) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                    })
                    .catch((error) => {
                        console.log("Auto-play prevented:", error);
                        setIsPlaying(false);
                    });
            }
        }
    }, [src, autoPlay, isYouTube]);

    // Trigger Replay / Show Video Logic
    useEffect(() => {
        if (showVideo && audioRef.current && !isYouTube) {
            audioRef.current.currentTime = 0;
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(e => console.log("Video reveal auto-play failed", e));
        }
    }, [showVideo, isYouTube]);

    // Handle Volume Changes
    useEffect(() => {
        // Save to localStorage
        localStorage.setItem('er-volume', volume);

        // Native Video
        if (audioRef.current) {
            audioRef.current.volume = volume / 100;
        }

        // YouTube IFrame (via postMessage)
        if (isYouTube && iframeRef.current) {
            try {
                // Note: contentWindow might be null on cross-origin if not handled right, but generally works for sending
                iframeRef.current.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: 'setVolume',
                    args: [volume]
                }), '*');
            } catch (e) {
                console.warn("YouTube volume set failed", e);
            }
        }
    }, [volume, isYouTube]);

    const togglePlay = () => {
        if (isYouTube) return; // YouTube click-to-play
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '1rem', width: '100%' }}>

            {/* Hidden Player Elements / Video Display */}
            <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                // Keep hidden strictly if not showVideo and not YouTube (YouTube has its own frame)
                // But structure needs to be clean.
            }}>
                {isYouTube ? (
                    <iframe
                        ref={iframeRef}
                        width="100%"
                        style={{ aspectRatio: '16/9', maxWidth: '600px' }}
                        src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=${autoPlay ? 1 : 0}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                ) : (
                    <video
                        ref={audioRef}
                        src={src}
                        autoPlay={autoPlay}
                        controls={showVideo} // Enable controls when video is shown
                        onEnded={() => setIsPlaying(false)}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        style={{
                            display: showVideo ? 'block' : 'none',
                            width: '100%',
                            maxWidth: '600px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                        }}
                    />
                )}
            </div>

            {/* Audio Only UI: Large Play Button */}
            {/* Show only if NOT YouTube AND NOT showing video */}
            {!isYouTube && !showVideo && (
                <button
                    onClick={togglePlay}
                    className={isPlaying ? 'playing-pulse' : ''}
                    style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'var(--er-primary)',
                        border: '4px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: isPlaying ? '0 10px 25px rgba(245, 158, 11, 0.6)' : '0 10px 25px rgba(245, 158, 11, 0.4)',
                        transform: isPlaying ? 'scale(1.05)' : 'scale(1)',
                        padding: 0
                    }}
                    onMouseOver={(e) => !isPlaying && (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseOut={(e) => !isPlaying && (e.currentTarget.style.transform = 'scale(1)')}
                >
                    {isPlaying ? (
                        <Pause size={48} color="#111" fill="#111" />
                    ) : (
                        <Play size={56} color="#111" fill="#111" style={{ marginLeft: '4px' }} />
                    )}
                </button>
            )}

            {/* YouTube specific display placeholder */}
            {isYouTube && (
                <div style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    ※ YouTube動画は自動再生または動画をクリックして再生してください
                </div>
            )}

            {/* Volume Control Bar */}
            {/* If video is shown with controls, we might not need this bar, but keeping it for consistency/safety is okay */}
            {!showVideo && (
                <div style={{
                    width: '100%',
                    background: '#222',
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    border: '1px solid #333'
                }}>
                    <div onClick={togglePlay} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        {isPlaying ? <Pause size={20} color="var(--er-primary)" /> : <Play size={20} color="#666" />}
                    </div>

                    <Volume2 size={20} color="#888" />

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            style={{
                                width: '100%',
                                height: '6px',
                                borderRadius: '3px',
                                background: `linear-gradient(to right, var(--er-primary) ${volume}%, #444 ${volume}%)`,
                                appearance: 'none',
                                cursor: 'pointer'
                            }}
                            className="volume-slider"
                        />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#666', minWidth: '3ch', textAlign: 'right' }}>
                        {volume}
                    </span>
                </div>
            )}
        </div>
    );
}
