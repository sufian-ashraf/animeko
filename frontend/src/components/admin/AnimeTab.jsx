import React, {useEffect, useState, useRef, useCallback} from 'react';
import {useAuth} from '../../contexts/AuthContext';
import { X } from 'react-feather'; // For the close icon in selected tags

const AnimeTab = ({searchQuery}) => {
    const {token} = useAuth();
    const [animeList, setAnimeList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        synopsis: '',
        release_date: '',
        company_id: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [companySearch, setCompanySearch] = useState('');
    const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
    const [genres, setGenres] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [genreSearch, setGenreSearch] = useState('');
    const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
    const companyDropdownRef = useRef(null);
    const genreDropdownRef = useRef(null);

    useEffect(() => {
        fetchAnime();
        fetchCompanies();
        fetchGenres();
        
        const handleClickOutside = (event) => {
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
                setIsCompanyDropdownOpen(false);
            }
            if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target)) {
                setIsGenreDropdownOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const fetchGenres = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/genre');
            if (response.ok) {
                const data = await response.json();
                // Normalize the genre data structure
                const normalizedGenres = Array.isArray(data) 
                    ? data.map(g => ({
                        id: g.id || g.genre_id,
                        genre_id: g.genre_id || g.id,
                        name: g.name || g.genre_name || 'Unnamed Genre'
                    }))
                    : [];
                setGenres(normalizedGenres);
            }
        } catch (err) {
            console.error('Error fetching genres:', err);
            showError('Failed to load genres');
        }
    };
    
    const toggleGenre = (genre) => {
        setSelectedGenres(prev => {
            const genreId = genre.genre_id || genre.id;
            const exists = prev.some(g => (g.genre_id || g.id) === genreId);
            if (exists) {
                return prev.filter(g => (g.genre_id || g.id) !== genreId);
            } else {
                // Ensure we're adding a properly structured genre object
                return [...prev, {
                    id: genre.id || genre.genre_id,
                    genre_id: genre.genre_id || genre.id,
                    name: genre.name || genre.genre_name || 'Unnamed Genre'
                }];
            }
        });
    };
    
    const removeGenre = (genreId) => {
        setSelectedGenres(prev => prev.filter(g => (g.genre_id || g.id) !== genreId));
    };
    
    // Initialize selected genres when editing
    const initializeSelectedGenres = useCallback((anime) => {
        if (anime.genres) {
            setSelectedGenres(anime.genres);
        } else if (anime.genre) {
            // Handle case where genre is a string (from initial data)
            const genreNames = anime.genre.split(',').map(g => g.trim());
            const matchedGenres = genres.filter(g => genreNames.includes(g.name));
            setSelectedGenres(matchedGenres);
        } else {
            setSelectedGenres([]);
        }
    }, [genres]);

    const fetchAnime = async () => {
        try {
            console.log('Fetching anime list...');
            const response = await fetch('http://localhost:5000/api/animes');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error('Failed to fetch anime list: ' + errorText);
            }
            const data = await response.json();
            console.log(data);

            
            
            // Log the first anime to see the data structure
            if (Array.isArray(data) && data.length > 0) {
                console.log('Sample anime data:', {
                    id: data[0].id,
                    anime_id: data[0].anime_id,
                    title: data[0].title,
                    release_date: data[0].release_date,
                    company_id: data[0].company_id,
                    raw_data: data[0]
                });
            }
            
            // Format the data with consistent fields
            const formattedData = Array.isArray(data) ? data.map(anime => {
                // Parse the release date if it exists
                let releaseDate = null;
                if (anime.release_date) {
                    try {
                        // Handle case where release_date might be a string or Date object
                        const date = new Date(anime.release_date);
                        releaseDate = isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
                    } catch (e) {
                        console.error('Error parsing release date:', e);
                    }
                }
                
                return {
                    ...anime,
                    anime_id: anime.anime_id || anime.id,
                    id: anime.anime_id || anime.id,
                    release_date: releaseDate,
                    company_id: anime.company_id || anime.companyId || null
                };
            }) : [];
            
            console.log('Anime data loaded:', { 
                count: formattedData.length,
                hasReleaseDates: formattedData.some(a => a.release_date),
                hasCompanyIds: formattedData.some(a => a.company_id)
            });
            setAnimeList(formattedData);
        } catch (err) {
            setError(err.message || 'Failed to fetch anime list');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            console.log('Fetching companies...');
            const response = await fetch('http://localhost:5000/api/company');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error('Failed to fetch companies: ' + errorText);
            }
            const data = await response.json();
            
            // Log sample company data
            if (Array.isArray(data) && data.length > 0) {
                console.log('Sample company data:', {
                    id: data[0].id,
                    company_id: data[0].company_id,
                    name: data[0].name,
                    raw_data: data[0]
                });
            }
            
            const companiesList = Array.isArray(data) 
                ? data.map(company => ({
                    ...company,
                    id: company.id || company.company_id,
                    // Ensure we have a consistent ID field
                    company_id: company.company_id || company.id
                })) 
                : [];
                
            console.log('Companies loaded:', { 
                count: companiesList.length,
                sampleIds: companiesList.slice(0, 3).map(c => c.id)
            });
            setCompanies(companiesList);
        } catch (err) {
            console.error('Error fetching companies:', err);
            setError('Failed to fetch companies');
        }
    };

    const handleInputChange = (e) => {
        const {name, value} = e.target;
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

        if (!formData.title.trim()) {
            showError('Anime title is required');
            setLoading(false);
            return;
        }
        
        try {
            const url = editingId 
                ? `http://localhost:5000/api/animes/${editingId}`
                : 'http://localhost:5000/api/animes';
            const method = editingId ? 'PUT' : 'POST';

            // Prepare the request body with genres
            const requestBody = {
                title: formData.title,
                synopsis: formData.synopsis,
                release_date: formData.release_date || null,
                company_id: formData.company_id || null,
                genres: selectedGenres.map(g => ({
                    genre_id: g.genre_id || g.id,
                    name: g.name
                }))
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                showError(errorData.message || (editingId ? 'Failed to update anime' : 'Failed to add anime'));
                setLoading(false);
                return;
            }

            await fetchAnime();
            resetForm();
        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (anime) => {
        if (!anime) return;

        // Use either anime_id or id, whichever is available
        const animeId = anime.anime_id || anime.id;
        if (!animeId) {
            showError('Invalid anime data: missing ID');
            return;
        }

        // Scroll to top of the page
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setFormData({
            title: anime.title || '',
            synopsis: anime.synopsis || '',
            release_date: anime.release_date ? anime.release_date.split('T')[0] : '',
            company_id: anime.company_id ? String(anime.company_id) : ''
        });
        
        // Initialize selected genres
        initializeSelectedGenres(anime);
        setEditingId(animeId);
    };

    const handleDelete = async (id) => {
        if (!id) {
            showError('Invalid anime ID');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this anime?')) return;

        try {
            // Convert to number in case it's a string
            const animeId = Number(id);
            if (isNaN(animeId)) {
                throw new Error('Invalid anime ID format');
            }

            const response = await fetch(`http://localhost:5000/api/animes/${animeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                showError(errorData.message || 'Failed to delete anime');
                return;
            }

            // Refresh the list after successful deletion
            await fetchAnime();

            // Show success message
            setError('');
        } catch (err) {
            console.error('Delete error:', err);
            showError(err.message || 'Failed to delete anime');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            synopsis: '',
            release_date: '',
            company_id: ''
        });
        setEditingId(null);
        setError('');
    };

    const filteredAnime = animeList.filter(anime =>
        anime.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="spinner-container">
            <div className="spinner"></div>
            <p>Loading anime data...</p>
        </div>
    );

    return (
        <div className="admin-tab-content">
            <div className="admin-form-section">
                <h2>{editingId ? 'Edit Anime' : 'Add New Anime'}</h2>
                {error && <div className="alert alert-danger mt-2">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            name="title"
                            className="form-control"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Synopsis</label>
                        <textarea
                            name="synopsis"
                            className="form-control"
                            value={formData.synopsis}
                            onChange={handleInputChange}
                            rows="4"
                        />
                    </div>
                    <div className="form-group">
                        <label>Release Date</label>
                        <input
                            type="date"
                            name="release_date"
                            className="form-control"
                            value={formData.release_date}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group" ref={companyDropdownRef}>
                        <label>Production Company</label>
                        <div className="dropdown">
                            <div 
                                className="form-control company-dropdown-trigger"
                                onClick={() => {
                                    setIsCompanyDropdownOpen(!isCompanyDropdownOpen);
                                    setCompanySearch('');
                                }}
                            >
                                {companies.find(c => c.id == formData.company_id)?.name || 'Select a company'}
                            </div>
                            {isCompanyDropdownOpen && (
                                <div className="dropdown-menu show company-dropdown-menu">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm mb-2"
                                        placeholder="Search companies..."
                                        value={companySearch}
                                        onChange={(e) => setCompanySearch(e.target.value)}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="company-dropdown-list">
                                        {companies
                                            .filter(company => 
                                                !companySearch || 
                                                (company.name && company.name.toLowerCase().includes(companySearch.toLowerCase()))
                                            )
                                            .map(company => (
                                                <div
                                                    key={company.id}
                                                    className="dropdown-item"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            company_id: company.id
                                                        }));
                                                        setIsCompanyDropdownOpen(false);
                                                    }}
                                                >
                                                    {company.name}
                                                </div>
                                            ))}
                                        {companies.filter(company => 
                                            !companySearch || 
                                            (company.name && company.name.toLowerCase().includes(companySearch.toLowerCase()))
                                        ).length === 0 && (
                                            <div className="dropdown-item text-muted">No companies found</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Genre Selection */}
                    <div className="form-group" ref={genreDropdownRef}>
                        <label>Genres</label>
                        <div className="dropdown">
                            <div 
                                className="form-control genre-dropdown-container"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsGenreDropdownOpen(!isGenreDropdownOpen);
                                    setGenreSearch('');
                                }}
                            >
                                {selectedGenres.length === 0 ? (
                                    <span className="text-muted">Select genres</span>
                                ) : (
                                    selectedGenres.map(genre => (
                                        <span 
                                            key={genre.genre_id || genre.id}
                                            className="genre-tag"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeGenre(genre.genre_id || genre.id);
                                            }}
                                        >
                                            {genre.name}
                                            <button type="button" className="remove-btn">
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))
                                )}
                            </div>
                            {isGenreDropdownOpen && (
                                <div className="dropdown-menu show p-2">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm mb-2"
                                        placeholder="Search genres..."
                                        value={genreSearch}
                                        onChange={(e) => setGenreSearch(e.target.value)}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div 
                                        className="dropdown-menu-content"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="genre-selection-grid">
                                            {genres
                                                .filter(genre => 
                                                    !genreSearch || 
                                                    (genre.name && genre.name.toLowerCase().includes(genreSearch.toLowerCase()))
                                                )
                                                .map(genre => {
                                                    const isSelected = selectedGenres.some(
                                                        g => (g.genre_id || g.id) === (genre.genre_id || genre.id)
                                                    );
                                                    return (
                                                        <div 
                                                            key={genre.genre_id || genre.id}
                                                            className={`genre-selection-item ${isSelected ? 'selected' : ''}`}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                toggleGenre(genre);
                                                            }}
                                                            onMouseDown={(e) => e.preventDefault()}
                                                        >
                                                            <span className="genre-name">{genre.name}</span>
                                                            <input 
                                                                type="checkbox" 
                                                                className="form-check-input genre-checkbox"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleGenre(genre);
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    );
                                                })
                                            }
                                            {genres.filter(genre => 
                                                !genreSearch || 
                                                (genre.name && genre.name.toLowerCase().includes(genreSearch.toLowerCase()))
                                            ).length === 0 && (
                                                <div className="text-muted no-results">No genres found</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {editingId ? 'Update' : 'Add'} Anime
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
                <h2>Anime List</h2>
                {filteredAnime.length === 0 ? (
                    <p>No anime found.</p>
                ) : (
                    <div className="admin-table">
                        <div className="table-header">
                            <div className="col-title">Title</div>
                            <div className="col-release">Release Date</div>
                            <div className="col-company">Company</div>
                            <div className="col-actions">Actions</div>
                        </div>
                        {filteredAnime.map(anime => (
                            <div key={anime.anime_id} className="table-row">
                                <div className="col-title">{anime.title}</div>
                                <div className="col-release">
                                    {(() => {
                                        if (!anime.release_date) return 'N/A';
                                        try {
                                            const date = new Date(anime.release_date);
                                            return !isNaN(date.getTime()) 
                                                ? date.toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    timeZone: 'UTC'
                                                })
                                                : 'Invalid Date';
                                        } catch (e) {
                                            console.error('Error formatting date:', e);
                                            return 'Date Error';
                                        }
                                    })()}
                                </div>
                                <div className="col-company">
                                    {(() => {
                                        if (!anime.company_id) {
                                            console.log(`Anime ${anime.id} has no company_id`);
                                            return 'N/A';
                                        }
                                        
                                        // Log the company ID we're looking for
                                        console.log(`Looking for company with ID: ${anime.company_id} (Type: ${typeof anime.company_id})`);
                                        
                                        // Try to find the company by both id and company_id
                                        const company = companies.find(c => {
                                            const match = c.id === anime.company_id || c.company_id === anime.company_id;
                                            if (match) {
                                                console.log('Found matching company:', c);
                                            }
                                            return match;
                                        });
                                        
                                        if (!company) {
                                            console.log('No company found for ID:', anime.company_id);
                                            console.log('Available company IDs:', companies.map(c => c.id || c.company_id));
                                        }
                                        
                                        return company?.name || `Company ID: ${anime.company_id}`;
                                    })()}
                                </div>
                                <div className="col-actions">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(anime)}
                                        className="btn btn-edit btn-sm"
                                        disabled={loading}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(anime.anime_id)}
                                        className="btn btn-delete btn-sm"
                                        disabled={loading}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnimeTab;
