import React, {useEffect, useState} from 'react';
import {useAuth} from '../../contexts/AuthContext';

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

    useEffect(() => {
        fetchAnime();
        fetchCompanies();
    }, []);

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

        // Check for duplicate title
        const existingAnime = animeList.find(anime => anime.title.toLowerCase() === formData.title.trim().toLowerCase());
        if (existingAnime && existingAnime.anime_id !== editingId) {
            showError('Anime with this title already exists');
            setLoading(false);
            return;
        }

        const url = editingId
            ? `http://localhost:5000/api/animes/${editingId}`
            : 'http://localhost:5000/api/animes';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: formData.title.trim(),
                    synopsis: formData.synopsis || null,
                    release_date: formData.release_date || null,
                    company_id: formData.company_id ? Number(formData.company_id) : null
                })
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

        setFormData({
            title: anime.title || '',
            synopsis: anime.synopsis || '',
            release_date: anime.release_date ? anime.release_date.split('T')[0] : '',
            company_id: anime.company_id ? String(anime.company_id) : ''
        });
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

    if (loading) return <div className="loading">Loading...</div>;

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
                    <div className="form-group">
                        <label>Production Company</label>
                        <select
                            name="company_id"
                            className="form-control"
                            value={formData.company_id}
                            onChange={handleInputChange}
                        >
                            <option value="">Select a company</option>
                            {companies.map(company => (
                                <option key={company.id} value={company.id}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
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
