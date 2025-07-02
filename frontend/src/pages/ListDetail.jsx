// src/pages/ListDetail.js
import React, {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import placeholderImg from '../images/image_not_available.jpg';
import '../styles/ListDetail.css';

export default function ListDetail() {
    const {id} = useParams();
    const {token, user} = useAuth();

    // Updated state structure to match expected API response
    const [list, setList] = useState({
        id: null,
        title: '',
        created_at: '',
        user_id: null,
        items: []
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [enterPressed, setEnterPressed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch list metadata & items
    useEffect(() => {
        if (!token) return;

        const baseUrl = 'http://localhost:5000';
        setLoading(true);
        setError(null);

        fetch(`${baseUrl}/api/lists/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch list: ${res.status} ${res.statusText}`);
                }
                return res.json();
            })
            .then((data) => {
                console.log('Fetched list data:', data); // Debug log
                // Ensure items is always an array
                setList({
                    ...data,
                    items: Array.isArray(data.items) ? data.items : []
                });
                setLoading(false);
            })
            .catch((err) => {
                console.error('[ListDetail] Error fetching list:', err);
                setError(err.message);
                setLoading(false);
            });
    }, [id, token]);

    // Determine if current user is the owner
    const isOwner = user && list.user_id === user.user_id;

    // Live‐fetch anime suggestions while typing
    useEffect(() => {
        if (!searchTerm || !token) return;
        if (!enterPressed) return;

        const baseUrl = 'http://localhost:5000';
        
        const timeout = setTimeout(() => {
            setIsSearching(true);
            fetch(`${baseUrl}/api/animes?title=${encodeURIComponent(searchTerm)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                setSearchResults(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error('Search error:', err);
                setSearchResults([]);
            })
            .finally(() => {
                setIsSearching(false);
            });
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchTerm, token, enterPressed]);

    // Get image URL with fallback to placeholder
    const getImage = (item) => {
        // Try multiple possible image URL sources
        return item.image_url || item.anime?.image_url || placeholderImg;
    };

    // Add a new anime entry (only if owner)
    const handleAddAnime = async (animeId) => {
        if (!isOwner || !token) return;
        
        const baseUrl = 'http://localhost:5000';

        try {
            // Prevent duplicate
            const existingIds = new Set(list.items.map((i) => i.anime_id));
            if (existingIds.has(animeId)) return;

            // Create a new entry
            const newEntry = {
                anime_id: animeId,
                rank: (list.items.length > 0 ? Math.max(...list.items.map(i => i.rank || 0)) : 0) + 1,
                note: ''
            };

            const updatedItems = [...list.items, newEntry];

            const response = await fetch(`${baseUrl}/api/lists/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    title: list.title, // Include the title to prevent it from being cleared
                    animeEntries: updatedItems
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to add anime: ${response.status}`);
            }

            // Optimistically update the UI
            setList(prev => ({
                ...prev,
                items: updatedItems
            }));
        } catch (err) {
            console.error('Error adding anime:', err);
            setError(err.message);
            
            // Revert optimistic update on error
            try {
                const res = await fetch(`${baseUrl}/api/lists/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (res.ok) {
                    const updatedList = await res.json();
                    setList({
                        ...updatedList,
                        items: Array.isArray(updatedList.items) ? updatedList.items : []
                    });
                }
            } catch (fetchErr) {
                console.error('Failed to refresh list after error:', fetchErr);
            }
        }
    };

    // Remove an anime from the list (only if owner)
    const handleRemoveAnime = async (animeId) => {
        if (!isOwner || !token) return;

        const baseUrl = 'http://localhost:5000';
        
        try {
            const updatedEntries = list.items.filter((i) => i.anime_id !== animeId);

            const response = await fetch(`${baseUrl}/api/lists/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    title: list.title,
                    animeEntries: updatedEntries 
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to remove anime: ${response.status}`);
            }

            // Optimistically update the UI
            setList(prev => ({
                ...prev,
                items: updatedEntries
            }));
        } catch (err) {
            console.error('Error removing anime:', err);
            setError(err.message);
            // Revert optimistic update on error
            try {
                const res = await fetch(`${baseUrl}/api/lists/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (res.ok) {
                    const updatedList = await res.json();
                    setList({
                        ...updatedList,
                        items: Array.isArray(updatedList.items) ? updatedList.items : []
                    });
                }
            } catch (fetchErr) {
                console.error('Failed to refresh list after error:', fetchErr);
            }
        }
    };

    // Handle rank or note change on an existing entry (only if owner)
    const handleEntryChange = (animeId, field, value) => {
        if (!isOwner) return;

        const updatedItems = list.items.map((item) =>
            item.anime_id === animeId ? {...item, [field]: value} : item
        );
        setList({...list, items: updatedItems});
    };

    // Save all changes (only if owner)
    const handleSaveAll = async () => {
        if (!isOwner || !token) return;

        const baseUrl = 'http://localhost:5000';
        
        try {
            // Sort items by rank ascending, then by anime_id to break ties
            const sortedEntries = [...list.items].sort((a, b) => {
                const rA = a.rank || 0,
                    rB = b.rank || 0;
                return rA !== rB ? rA - rB : a.anime_id - b.anime_id;
            });

            const response = await fetch(`${baseUrl}/api/lists/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: list.title,
                    animeEntries: sortedEntries
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to save changes: ${response.status}`);
            }

            // Optimistically update the UI with sorted items
            setList(prev => ({
                ...prev,
                items: sortedEntries
            }));
        } catch (err) {
            console.error('Error saving changes:', err);
            setError(err.message);
            
            // Re-fetch the list to ensure consistency
            try {
                const res = await fetch(`${baseUrl}/api/lists/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (res.ok) {
                    const updatedList = await res.json();
                    setList({
                        ...updatedList,
                        items: Array.isArray(updatedList.items) ? updatedList.items : []
                    });
                }
            } catch (fetchErr) {
                console.error('Failed to refresh list after error:', fetchErr);
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setEnterPressed(true);
        }
    };

    if (loading) {
        return (
            <div className="list-detail-container">
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="list-detail-container">
                <div className="error-state">
                    <h3>Error loading list</h3>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="list-detail-container">
            <div className="list-header">
                <h2>{list.title}</h2>
                <p className="list-meta">
                    Created: {new Date(list.created_at).toLocaleDateString()}
                    {list.items.length > 0 && ` • ${list.items.length} items`}
                </p>
            </div>

            {/* ─────────── Current Items ─────────── */}
            <div className="anime-items">
                {Array.isArray(list.items) && list.items.length > 0 ? (
                    list.items
                        .sort((a, b) => (a.rank || 999) - (b.rank || 999)) // Sort by rank
                        .map((item) => (
                            <div key={item.anime_id} className="anime-card">
                                {/* Wrap the image and title in a Link */}
                                <Link to={`/anime/${item.anime_id}`} className="anime-link">
                                    <div className="anime-image-container">
                                        <img
                                            src={getImage(item)}
                                            alt={item.anime_title || item.title || 'Anime'}
                                            className="anime-thumbnail"
                                            onError={(e) => {
                                                e.target.src = placeholderImg;
                                            }}
                                        />
                                        {item.rank && (
                                            <div className="rank-badge">#{item.rank}</div>
                                        )}
                                    </div>
                                    <h3 className="anime-title">{item.anime_title || item.title || 'Unknown Title'}</h3>
                                </Link>

                                <div className="anime-info">
                                    {isOwner ? (
                                        <>
                                            <div className="input-group">
                                                <label>
                                                    Rank:
                                                    <input
                                                        type="number"
                                                        value={item.rank || ''}
                                                        min="1"
                                                        onChange={(e) =>
                                                            handleEntryChange(item.anime_id, 'rank', e.target.value)
                                                        }
                                                        className="rank-input"
                                                    />
                                                </label>
                                            </div>

                                            <div className="input-group">
                                                <label>
                                                    Note:
                                                    <textarea
                                                        value={item.note || ''}
                                                        onChange={(e) =>
                                                            handleEntryChange(item.anime_id, 'note', e.target.value)
                                                        }
                                                        className="note-input"
                                                        placeholder="Add a note..."
                                                        rows="2"
                                                    />
                                                </label>
                                            </div>

                                            <button
                                                className="remove-btn"
                                                onClick={() => handleRemoveAnime(item.anime_id)}
                                            >
                                                Remove
                                            </button>
                                        </>
                                    ) : (
                                        // Non‐owners see plain text for rank and note
                                        <>
                                            <div className="anime-rank-text">Rank: #{item.rank || 'N/A'}</div>
                                            {item.note && (
                                                <div className="anime-note-text">Note: {item.note}</div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                ) : (
                    <div className="empty-state">
                        <p>This list is empty.</p>
                        {isOwner && (
                            <p>Start by searching for anime below to add to your list!</p>
                        )}
                    </div>
                )}
            </div>

            {/* ─────────── Save All Edits (Rank & Note) ─────────── */}
            {isOwner && list.items.length > 0 && (
                <div className="save-container">
                    <button className="save-btn" onClick={handleSaveAll}>
                        Save All Changes
                    </button>
                </div>
            )}

            {/* ─────────── Search & Add New Anime ─────────── */}
            {isOwner && (
                <div className="search-add-section">
                    <h3>Add Anime to List</h3>
                    <input
                        type="text"
                        placeholder="Search anime by title..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setEnterPressed(false);
                        }}
                        onKeyDown={handleKeyDown}
                        className="search-input"
                        list="anime-suggestions"
                    />
                    <datalist id="anime-suggestions">
                        {searchResults.map((anime) => (
                            <option key={anime.id || anime.anime_id} value={anime.title}/>
                        ))}
                    </datalist>

                    {isSearching && <p className="loading-text">Searching…</p>}

                    {enterPressed && searchTerm && (
                        <div className="search-results">
                            {searchResults.length === 0 && !isSearching ? (
                                <p>No results found for "{searchTerm}".</p>
                            ) : (
                                searchResults.map((anime) => {
                                    const animeId = anime.id || anime.anime_id;
                                    const isAlreadyAdded = list.items.some((i) => i.anime_id === animeId);

                                    return (
                                        <div key={animeId} className="anime-card search-card">
                                            <img
                                                src={anime.image_url || placeholderImg}
                                                alt={anime.title}
                                                className="anime-thumbnail-small"
                                                onError={(e) => {
                                                    e.target.src = placeholderImg;
                                                }}
                                            />
                                            <h4 className="anime-title-small">{anime.title}</h4>
                                            <button
                                                className={`add-btn ${isAlreadyAdded ? 'added' : ''}`}
                                                onClick={() => handleAddAnime(animeId)}
                                                disabled={isAlreadyAdded}
                                            >
                                                {isAlreadyAdded ? 'Already Added' : 'Add to List'}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}