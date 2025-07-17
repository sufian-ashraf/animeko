import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const CharactersTab = ({ searchQuery }) => {
    const { token } = useAuth();
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        voiceActorId: '',
        animeId: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [voiceActors, setVoiceActors] = useState([]);
    const [voiceActorSearch, setVoiceActorSearch] = useState('');
    const [isVaDropdownOpen, setIsVaDropdownOpen] = useState(false);
    const vaDropdownRef = useRef(null);
    
    // Anime dropdown state
    const [animeList, setAnimeList] = useState([]);
    const [animeSearch, setAnimeSearch] = useState('');
    const [isAnimeDropdownOpen, setIsAnimeDropdownOpen] = useState(false);
    const animeDropdownRef = useRef(null);

    useEffect(() => {
        fetchCharacters();
        fetchVoiceActors();
        fetchAnimeList();
        
        const handleClickOutside = (event) => {
            if (vaDropdownRef.current && !vaDropdownRef.current.contains(event.target)) {
                setIsVaDropdownOpen(false);
            }
            if (animeDropdownRef.current && !animeDropdownRef.current.contains(event.target)) {
                setIsAnimeDropdownOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const fetchAnimeList = async () => {
        try {
            const response = await fetch('/api/animes');
            if (response.ok) {
                const data = await response.json();
                setAnimeList(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Error fetching anime list:', err);
        }
    };

    const fetchCharacters = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/characters', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch characters');
            }
            
            const data = await response.json();
            setCharacters(Array.isArray(data) ? data : []);
            setError('');
        } catch (err) {
            console.error('Error fetching characters:', err);
            setError(err.message || 'Failed to load characters');
            setCharacters([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchVoiceActors = async () => {
        try {
            const response = await fetch('/api/voice-actors', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch voice actors');
            }
            
            const data = await response.json();
            setVoiceActors(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching voice actors:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const showError = (message) => {
        setError(message);
        setTimeout(() => {
            setError('');
        }, 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.name.trim()) {
            showError('Character name is required');
            setLoading(false);
            return;
        }

        const url = editingId
            ? `/api/characters/${editingId}`
            : '/api/characters';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    description: formData.description.trim() || null,
                    voiceActorId: formData.voiceActorId || null,
                    animeId: formData.animeId || null
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || (editingId ? 'Failed to update character' : 'Failed to add character'));
            }

            await fetchCharacters();
            resetForm();
        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (character) => {
        if (!character) {
            showError('No character data provided');
            return;
        }
        
        const charId = character.id || character.character_id;
        if (!charId) {
            console.error('Character data missing ID:', character);
            showError('Invalid character data: missing ID');
            return;
        }
        
        try {
            // Scroll to top of the page
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setFormData({
                name: character.name || '',
                description: character.description || '',
                voiceActorId: character.vaId || '',
                animeId: character.animeId || ''
            });
            setEditingId(charId);
        } catch (err) {
            console.error('Error formatting character data:', err);
            showError('Error loading character data');
        }
    };

    const handleDelete = async (id) => {
        if (!id) {
            showError('Invalid character ID');
            return;
        }
        if (!window.confirm('Are you sure you want to delete this character? This will remove all their associated data.')) return;

        try {
            const charId = Number(id);
            if (isNaN(charId)) {
                showError('Invalid character ID format');
                return;
            }

            setLoading(true);
            const response = await fetch(`/api/characters/${charId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete character');
            }

            await fetchCharacters();
            setError('');
            // Show success message
            setError('Character deleted successfully');
            setTimeout(() => setError(''), 3000);
        } catch (err) {
            console.error('Delete error:', err);
            showError(err.message || 'Failed to delete character');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            voiceActorId: ''
        });
        setEditingId(null);
        setError('');
    };

    const filteredCharacters = (characters || []).filter(char => {
        if (!char) return false;
        const name = char.name || '';
        const description = char.description || '';
        const search = (searchQuery || '').toLowerCase();
        return name.toLowerCase().includes(search) || 
               description.toLowerCase().includes(search);
    });

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="admin-tab-content">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="admin-form-section">
                <h2>{editingId ? 'Edit Character' : 'Add New Character'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name *</label>
                        <input
                            type="text"
                            name="name"
                            className="form-control"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            className="form-control"
                            rows="3"
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group" ref={animeDropdownRef}>
                        <label>Anime</label>
                        <div className="dropdown">
                            <div 
                                className="form-control anime-dropdown-trigger" 
                                onClick={() => {
                                    setIsAnimeDropdownOpen(!isAnimeDropdownOpen);
                                    setAnimeSearch('');
                                }}
                            >
                                {animeList.find(a => a.id == formData.animeId)?.title || 'Select an anime'}
                            </div>
                            {isAnimeDropdownOpen && (
                                <div className="dropdown-menu show anime-dropdown-content">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm mb-2"
                                        placeholder="Search anime..."
                                        value={animeSearch}
                                        onChange={(e) => setAnimeSearch(e.target.value)}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="dropdown-scroll-container">
                                        {animeList
                                            .filter(anime => 
                                                !animeSearch || 
                                                (anime.title && anime.title.toLowerCase().includes(animeSearch.toLowerCase()))
                                            )
                                            .map(anime => (
                                                <button
                                                    key={anime.id || anime.anime_id}
                                                    className="dropdown-item"
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData(prev => ({
                                                            ...prev, 
                                                            animeId: anime.id || anime.anime_id
                                                        }));
                                                        setIsAnimeDropdownOpen(false);
                                                    }}
                                                >
                                                    {anime.title}
                                                </button>
                                            ))
                                        }
                                        {animeList.filter(anime => 
                                            !animeSearch || 
                                            (anime.title && anime.title.toLowerCase().includes(animeSearch.toLowerCase()))
                                        ).length === 0 && (
                                            <div className="dropdown-item text-muted">No anime found</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="form-group" ref={vaDropdownRef}>
                        <label>Voice Actor</label>
                        <div className="dropdown">
                            <div 
                                className="form-control va-dropdown-trigger" 
                                onClick={() => {
                                    setIsVaDropdownOpen(!isVaDropdownOpen);
                                    setVoiceActorSearch('');
                                }}
                            >
                                {voiceActors.find(va => va.id == formData.voiceActorId || va.voice_actor_id == formData.voiceActorId)?.name || 'Select a voice actor'}
                            </div>
                            {isVaDropdownOpen && (
                                <div className="dropdown-menu show va-dropdown-content">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm mb-2"
                                        placeholder="Search voice actors..."
                                        value={voiceActorSearch}
                                        onChange={(e) => setVoiceActorSearch(e.target.value)}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="dropdown-scroll-container">
                                        {voiceActors
                                            .filter(va => 
                                                !voiceActorSearch || 
                                                (va.name && va.name.toLowerCase().includes(voiceActorSearch.toLowerCase()))
                                            )
                                            .map(va => (
                                                <button
                                                    key={va.id || va.voice_actor_id}
                                                    className="dropdown-item"
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData(prev => ({
                                                            ...prev, 
                                                            voiceActorId: va.id || va.voice_actor_id
                                                        }));
                                                        setIsVaDropdownOpen(false);
                                                    }}
                                                >
                                                    {va.name}
                                                </button>
                                            ))
                                        }
                                        {voiceActors.filter(va => 
                                            !voiceActorSearch || 
                                            (va.name && va.name.toLowerCase().includes(voiceActorSearch.toLowerCase()))
                                        ).length === 0 && (
                                            <div className="dropdown-item text-muted">No voice actors found</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {editingId ? 'Update' : 'Add'} Character
                        </button>
                        {editingId && (
                            <button type="button" onClick={resetForm} className="btn btn-secondary">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="admin-list-section">
                <h2>Character List</h2>
                {filteredCharacters.length === 0 ? (
                    <p>No characters found.</p>
                ) : (
                    <div className="admin-table">
                        <div className="table-header">
                            <div className="col-name">Name</div>
                            <div className="col-description">Description</div>
                            <div className="col-va">Voice Actor</div>
                            <div className="col-actions">Actions</div>
                        </div>
                        {filteredCharacters.map(char => {
                            if (!char) return null;
                            const charId = char.id || char.character_id;
                            if (!charId) {
                                console.error('Character missing ID:', char);
                                return null;
                            }
                            
                            return (
                                <div key={`char-${charId}`} className="table-row">
                                    <div className="col-name">{char.name || 'N/A'}</div>
                                    <div className="col-description">
                                        {char.description ? 
                                            (char.description.length > 50 
                                                ? `${char.description.substring(0, 50)}...` 
                                                : char.description) 
                                            : 'N/A'}
                                    </div>
                                    <div className="col-va">
                                        {char.vaName || 'N/A'}
                                    </div>
                                    <div className="col-actions">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(char)}
                                            className="btn btn-edit btn-sm"
                                            disabled={loading}
                                            aria-label={`Edit ${char.name || 'character'}`}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(charId)}
                                            className="btn btn-delete btn-sm"
                                            disabled={loading}
                                            aria-label={`Delete ${char.name || 'character'}`}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CharactersTab;
