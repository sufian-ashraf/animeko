import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import placeholder from '../images/image_not_available.jpg';
import '../styles/AnimeCard.css';

function AnimeCard({ anime }) {
    const { user, token } = useAuth();
    const [isFavorite, setIsFavorite] = useState(false);
    const [libraryStatus, setLibraryStatus] = useState(null);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    const validLibraryStatuses = ['Watching', 'Completed', 'Planned to Watch', 'Dropped', 'On Hold'];

    // Fetch favorite status
    useEffect(() => {
        if (!user) return;
        
        fetch(`/api/favorites/${anime.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => setIsFavorite(data.isFavorite))
            .catch(console.error);
    }, [anime.id, user, token]);

    // Fetch library status
    useEffect(() => {
        if (!user) return;

        fetch(`/api/anime-library/${anime.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => {
                if (!r.ok && r.status !== 404) throw new Error('Server error');
                return r.json();
            })
            .then(data => setLibraryStatus(data.status))
            .catch(console.error);
    }, [anime.id, user, token]);

    const toggleFavorite = async (e) => {
        e.preventDefault(); // Prevent navigation
        if (!user) return;

        try {
            const method = isFavorite ? 'DELETE' : 'POST';
            await fetch(`/api/favorites/${anime.id}`, {
                method,
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsFavorite(!isFavorite);
        } catch (err) {
            console.error('Error toggling favorite:', err);
        }
    };

    const handleLibraryAction = async (e, action, newStatus = null) => {
        e.preventDefault(); // Prevent navigation
        if (!user) return;

        setLoading(true);
        try {
            if (action === 'add') {
                await fetch('/api/anime-library', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        animeId: anime.id,
                        status: 'Planned to Watch'
                    })
                });
                setLibraryStatus('Planned to Watch');
            } else if (action === 'update') {
                await fetch(`/api/anime-library/${anime.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: newStatus })
                });
                setLibraryStatus(newStatus);
            } else if (action === 'remove') {
                await fetch(`/api/anime-library/${anime.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLibraryStatus(null);
            }
        } catch (err) {
            console.error('Library action error:', err);
        } finally {
            setLoading(false);
            setShowStatusDropdown(false);
        }
    };

    return (
        <div className="anime-card">
            <Link to={`/anime/${anime.id}`} className="anime-card-content">
                <img
                    src={anime.imageUrl || placeholder}
                    alt={anime.title}
                    className="anime-card-image"
                />
                <h3 className="anime-card-title">{anime.title}</h3>
                <div className="anime-card-info">
                    <p className="anime-card-genre">Genre: {anime.genre || 'Not specified'}</p>
                    <p className="anime-card-year">Year: {anime.year || 'Unknown'}</p>
                </div>
            </Link>
            
            {user && (
                <div className="anime-card-controls" onClick={e => e.preventDefault()}>
                    <button 
                        className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                        onClick={toggleFavorite}
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        {isFavorite ? '❤️' : '🤍'}
                    </button>

                    <div className="library-controls">
                        {!libraryStatus ? (
                            <button
                                className="add-btn"
                                onClick={(e) => handleLibraryAction(e, 'add')}
                                disabled={loading}
                            >
                                Add
                            </button>
                        ) : (
                            <>
                                <select
                                    value={libraryStatus}
                                    onChange={(e) => handleLibraryAction(e, 'update', e.target.value)}
                                    className="status-select"
                                    disabled={loading}
                                >
                                    {validLibraryStatuses.map(status => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    className="remove-btn"
                                    onClick={(e) => handleLibraryAction(e, 'remove')}
                                    disabled={loading}
                                >
                                    Remove
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnimeCard;
