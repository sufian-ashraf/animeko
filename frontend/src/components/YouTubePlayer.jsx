import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const YouTubePlayer = ({ 
    videoId, 
    episodeId, 
    onProgress, 
    onComplete, 
    initialPosition = 0,
    width = '100%',
    height = '100%'
}) => {
    const { user, token } = useAuth();
    const playerRef = useRef(null);
    const intervalRef = useRef(null);
    const lastSavedProgress = useRef(0);
    const [player, setPlayer] = useState(null);
    const [playerReady, setPlayerReady] = useState(false);
    const [error, setError] = useState(null);

    // Load YouTube iframe API
    useEffect(() => {
        if (window.YT && window.YT.Player) {
            return;
        }

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // Set up the callback for when the API is ready
        window.onYouTubeIframeAPIReady = () => {
            console.log('YouTube iframe API loaded');
        };

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Initialize player when API is ready
    useEffect(() => {
        const initPlayer = () => {
            if (!window.YT || !window.YT.Player || !playerRef.current) return;

            try {
                const newPlayer = new window.YT.Player(playerRef.current, {
                    width,
                    height,
                    videoId,
                    playerVars: {
                        autoplay: 1,
                        controls: 1,
                        modestbranding: 1,
                        rel: 0,
                        enablejsapi: 1,
                        origin: window.location.origin
                    },
                    events: {
                        onReady: onPlayerReady,
                        onStateChange: onPlayerStateChange,
                        onError: onPlayerError
                    }
                });

                setPlayer(newPlayer);
            } catch (err) {
                console.error('Error initializing YouTube player:', err);
                setError('Failed to initialize video player');
            }
        };

        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            const checkAPI = setInterval(() => {
                if (window.YT && window.YT.Player) {
                    clearInterval(checkAPI);
                    initPlayer();
                }
            }, 100);

            return () => clearInterval(checkAPI);
        }
    }, [videoId, width, height]);

    const onPlayerReady = useCallback((event) => {
        console.log('Player ready');
        setPlayerReady(true);
        setError(null);

        // Seek to initial position if provided
        if (initialPosition > 0) {
            setTimeout(() => {
                try {
                    event.target.seekTo(initialPosition, true);
                    console.log(`Resumed from ${initialPosition} seconds`);
                } catch (err) {
                    console.error('Error seeking to initial position:', err);
                }
            }, 1000);
        }
    }, [initialPosition]);

    const onPlayerStateChange = useCallback((event) => {
        const playerState = event.data;
        
        if (playerState === window.YT.PlayerState.PLAYING) {
            startProgressTracking();
        } else {
            stopProgressTracking();
        }

        if (playerState === window.YT.PlayerState.ENDED) {
            handleVideoComplete();
        }
    }, []);

    const onPlayerError = useCallback((event) => {
        console.error('YouTube player error:', event.data);
        setError('Video playback error occurred');
        stopProgressTracking();
    }, []);

    const startProgressTracking = useCallback(() => {
        if (!user || !token || intervalRef.current) return;

        intervalRef.current = setInterval(() => {
            if (!player || !playerReady) return;

            try {
                const currentTime = player.getCurrentTime();
                const duration = player.getDuration();
                
                if (duration > 0) {
                    const watchedPercentage = (currentTime / duration) * 100;
                    
                    // Only save progress if there's meaningful change (more than 2% or 10 seconds)
                    if (Math.abs(watchedPercentage - lastSavedProgress.current) >= 2 || 
                        Math.abs(currentTime - (lastSavedProgress.current * duration / 100)) >= 10) {
                        
                        saveProgress(Math.floor(currentTime), watchedPercentage);
                        lastSavedProgress.current = watchedPercentage;
                    }
                }
            } catch (err) {
                console.error('Error tracking progress:', err);
            }
        }, 8000); // Save every 8 seconds
    }, [player, playerReady, user, token]);

    const stopProgressTracking = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const saveProgress = useCallback(async (timestampPosition, watchedPercentage) => {
        if (!user || !token || !episodeId) return;

        try {
            const response = await fetch('/api/watch/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    episode_id: episodeId,
                    timestamp_position: Math.max(0, Math.floor(timestampPosition)),
                    watched_percentage: Math.min(100, Math.max(0, Math.round(watchedPercentage * 100) / 100))
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (onProgress) {
                    onProgress(timestampPosition, watchedPercentage, data.completed);
                }
                
                if (data.completed && onComplete) {
                    onComplete();
                }
            } else {
                console.error('Failed to save progress:', response.statusText);
            }
        } catch (err) {
            console.error('Error saving progress:', err);
        }
    }, [user, token, episodeId, onProgress, onComplete]);

    const handleVideoComplete = useCallback(() => {
        if (!user || !token || !episodeId || !player) return;

        try {
            const duration = player.getDuration();
            saveProgress(Math.floor(duration), 100);
        } catch (err) {
            console.error('Error handling video completion:', err);
        }
    }, [user, token, episodeId, player, saveProgress]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopProgressTracking();
            if (player && typeof player.destroy === 'function') {
                try {
                    player.destroy();
                } catch (err) {
                    console.error('Error destroying player:', err);
                }
            }
        };
    }, [player, stopProgressTracking]);

    if (error) {
        return (
            <div className="video-error">
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>
                    Reload Page
                </button>
            </div>
        );
    }

    return (
        <div className="youtube-player-container">
            <div ref={playerRef} />
        </div>
    );
};

export default YouTubePlayer;
