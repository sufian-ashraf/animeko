import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import '../styles/MyLibrary.css';
import placeholder from '../images/image_not_available.jpg';

const validStatuses = ['All', 'Watching', 'Completed', 'Planned to Watch', 'Dropped', 'On Hold'];

function MyLibrary() {
    const { token } = useContext(AuthContext);
    const [library, setLibrary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        const fetchLibrary = async () => {
            if (!token) {
                setError('You must be logged in to view your library.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                let url = '/api/anime-library';
                if (filterStatus !== 'All') {
                    url += `?status=${filterStatus}`;
                }
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch library');
                }

                const data = await response.json();
                setLibrary(data);
            } catch (err) {
                console.error('Error fetching library:', err);
                setError(err.message || 'Failed to load your anime library.');
            } finally {
                setLoading(false);
            }
        };

        fetchLibrary();
    }, [token, filterStatus]);

    const handleUpdateStatus = async (animeId, newStatus) => {
        if (!token) return;
        try {
            const response = await fetch(`/api/anime-library/${animeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update status');
            }

            // Update local state
            setLibrary((prevLibrary) =>
                prevLibrary.map((anime) =>
                    anime.anime_id === animeId ? { ...anime, status: newStatus } : anime
                )
            );
        } catch (err) {
            console.error('Error updating status:', err);
            alert(err.message);
        }
    };

    const handleRemoveAnime = async (animeId) => {
        if (!token) return;
        if (!window.confirm('Are you sure you want to remove this anime from your library?')) {
            return;
        }
        try {
            const response = await fetch(`/api/anime-library/${animeId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to remove anime');
            }

            // Update local state
            setLibrary((prevLibrary) =>
                prevLibrary.filter((anime) => anime.anime_id !== animeId)
            );
        } catch (err) {
            console.error('Error removing anime:', err);
            alert(err.message);
        }
    };

    if (loading) {
        return (
            <div className="my-library-container">
                <div className="spinner-container">
                    <div className="spinner"></div>
                    <p>Loading your library...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="my-library-container">
                <p className="error-message">{error}</p>
            </div>
        );
    }

    return (
        <div className="my-library-container">
            <div className="refresh-notice">
                ⚠️ To see status changes made here, refresh the page
            </div>
            
            <h2>My Anime Library</h2>

            <div className="filter-controls">
                <label htmlFor="status-filter">Filter by Status:</label>
                <select
                    id="status-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    {validStatuses.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
            </div>

            {library.length === 0 ? (
                <p>Your library is empty. Add some anime!</p>
            ) : (
                <div className="library-grid">
                    {library.map((anime) => (
                        <div key={anime.anime_id} className="library-item-card">
                            <Link to={`/anime/${anime.anime_id}`}>
                                <img
                                    src={anime.image_url || placeholder}
                                    alt={`${anime.title} poster`}
                                    className="library-item-poster"
                                />
                                <h3>{anime.title}</h3>
                            </Link>
                            <p>Status: {anime.status}</p>
                            <div className="library-item-actions">
                                <select
                                    value={anime.status}
                                    onChange={(e) => handleUpdateStatus(anime.anime_id, e.target.value)}
                                >
                                    {validStatuses.filter(s => s !== 'All').map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                                <button onClick={() => handleRemoveAnime(anime.anime_id)} className="remove-btn">
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyLibrary;
