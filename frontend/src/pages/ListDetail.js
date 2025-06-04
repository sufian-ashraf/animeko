// src/pages/ListDetail.js
import React, {useContext, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {AuthContext} from '../contexts/AuthContext';
import placeholderImg from '../images/image_not_available.jpg';
import '../styles/ListDetail.css'; // Make sure you import your CSS

function ListDetail() {
    const {id} = useParams();
    const {token} = useContext(AuthContext);

    // `list.items` will be an array of { anime_id, title, image_url, rank, note }
    const [list, setList] = useState({title: '', items: []});
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [enterPressed, setEnterPressed] = useState(false);

    // Fetch the list’s metadata and items on mount / token / id change
    useEffect(() => {
        if (!token) return;
        fetch(`/lists/${id}`, {
            headers: {'Authorization': `Bearer ${token}`}
        })
            .then(res => res.json())
            .then(data => setList(data))
            .catch(err => console.error('[ListDetail] Error fetching list:', err));
    }, [id, token]);

    // Live-fetch anime suggestions while typing
    useEffect(() => {
        if (!searchTerm) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const timeout = setTimeout(() => {
            fetch(`/api/animes?title=${encodeURIComponent(searchTerm)}`)
                .then(res => res.json())
                .then(data => {
                    setSearchResults(data);
                    setIsSearching(false);
                })
                .catch(err => {
                    console.error('[Anime Search] Error:', err);
                    setIsSearching(false);
                });
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchTerm]);

    // Safely get `image_url` or a placeholder
    const getImage = (anime) => anime.image_url || placeholderImg;

    // Add a new anime entry with default rank = (maxRank+1), note = ''
    const handleAddAnime = async (animeId) => {
        // Prevent duplicate
        const existingIds = new Set(list.items.map(i => i.anime_id));
        if (existingIds.has(animeId)) return;

        // Determine a new rank = (max existing rank + 1) or 1 if none exist
        const maxRank = list.items.reduce((max, i) => Math.max(max, i.rank || 0), 0);
        const newEntry = {anime_id: animeId, rank: maxRank + 1, note: ''};

        const updatedEntries = [...list.items, newEntry];

        await fetch(`/lists/${id}`, {
            method: 'PUT', headers: {
                'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`
            }, body: JSON.stringify({animeEntries: updatedEntries})
        });

        // Refresh list
        const res = await fetch(`/lists/${id}`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        const updatedList = await res.json();
        setList(updatedList);
    };

    // Handle removing an anime from the list
    const handleRemoveAnime = async (animeId) => {
        const updatedEntries = list.items.filter(i => i.anime_id !== animeId);

        await fetch(`/lists/${id}`, {
            method: 'PUT', headers: {
                'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`
            }, body: JSON.stringify({animeEntries: updatedEntries})
        });

        const res = await fetch(`/lists/${id}`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        const updatedList = await res.json();
        setList(updatedList);
    };

    // Handle rank or note change on an existing entry
    const handleEntryChange = (animeId, field, value) => {
        setList(prev => ({
            ...prev,
            items: prev.items.map(item => item.anime_id === animeId ? {
                ...item,
                [field]: field === 'rank' ? Number(value) : value
            } : item)
        }));
    };

    // Save all edits (ranks & notes) in one go
    const handleSaveAll = async () => {
        // Sort items by rank ascending, then by anime_id (optional)
        const sortedEntries = [...list.items].sort((a, b) => {
            const rA = a.rank || 0, rB = b.rank || 0;
            return rA !== rB ? rA - rB : a.anime_id - b.anime_id;
        });

        await fetch(`/lists/${id}`, {
            method: 'PUT', headers: {
                'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`
            }, body: JSON.stringify({animeEntries: sortedEntries})
        });

        const res = await fetch(`/lists/${id}`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        const updatedList = await res.json();
        setList(updatedList);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setEnterPressed(true);
        }
    };

    return (<div className="list-detail-container">
            <h2>{list.title}</h2>

            {/* ─────────── Current Items ─────────── */}
            <div className="anime-items">
                {Array.isArray(list.items) && list.items.length > 0 ? (list.items.map(item => (
                        <div key={item.anime_id} className="anime-card">
                            <img
                                src={getImage(item)}
                                alt={item.title}
                                className="anime-thumbnail"
                            />
                            <div className="anime-info">
                                <p className="anime-title">{item.title}</p>

                                <label>
                                    Rank:{' '}
                                    <input
                                        type="number"
                                        value={item.rank || ''}
                                        min="1"
                                        onChange={e => handleEntryChange(item.anime_id, 'rank', e.target.value)}
                                        className="rank-input"
                                    />
                                </label>

                                <label>
                                    Note:{' '}
                                    <input
                                        type="text"
                                        value={item.note || ''}
                                        onChange={e => handleEntryChange(item.anime_id, 'note', e.target.value)}
                                        className="note-input"
                                        placeholder="Add a note..."
                                    />
                                </label>

                                <button
                                    className="remove-btn"
                                    onClick={() => handleRemoveAnime(item.anime_id)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>))) : (<p>This list is empty.</p>)}
            </div>

            {/* ─────────── Save All Edits (Rank & Note) ─────────── */}
            {list.items.length > 0 && (<div className="save-container">
                    <button className="save-btn" onClick={handleSaveAll}>
                        Save Rank & Notes
                    </button>
                </div>)}

            {/* ─────────── Search & Add New Anime ─────────── */}
            <div className="search-add-section">
                {/* Input with datalist always visible */}
                <input
                    type="text"
                    placeholder="Search anime by title..."
                    value={searchTerm}
                    onChange={e => {
                        setSearchTerm(e.target.value);
                        setEnterPressed(false);
                    }}
                    onKeyDown={handleKeyDown}
                    className="search-input"
                    list="anime-suggestions"
                />
                <datalist id="anime-suggestions">
                    {searchResults.map(anime => (<option key={anime.id} value={anime.title}/>))}
                </datalist>

                {isSearching && <p className="loading-text">Searching…</p>}

                {enterPressed && (<div className="search-results">
                        {searchResults.length === 0 && !isSearching ? (
                            <p>No results found.</p>) : (searchResults.map(anime => (
                                <div key={anime.id} className="anime-card search-card">
                                    <img
                                        src={anime.image_url || placeholderImg}
                                        alt={anime.title}
                                        className="anime-thumbnail-small"
                                    />
                                    <p className="anime-title-small">{anime.title}</p>
                                    <button
                                        className="add-btn"
                                        onClick={() => handleAddAnime(anime.id)}
                                        disabled={list.items.some(i => i.anime_id === anime.id)}
                                    >
                                        {list.items.some(i => i.anime_id === anime.id) ? 'Added' : 'Add to List'}
                                    </button>
                                </div>)))}
                    </div>)}
            </div>
        </div>);
}

export default ListDetail;
