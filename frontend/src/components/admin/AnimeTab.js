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
            const response = await fetch('http://localhost:5000/api/animes');
            if (!response.ok) {
                throw new Error('Failed to fetch anime list');
            }
            const data = await response.json();
            // Ensure consistent ID field names
            const formattedData = Array.isArray(data)
                ? data.map(anime => ({
                    ...anime,
                    anime_id: anime.anime_id || anime.id, // Use anime_id if available, fallback to id
                    id: anime.anime_id || anime.id          // Ensure id is always present
                }))
                : [];
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
            const response = await fetch('http://localhost:5000/api/company');
            const data = await response.json();
            setCompanies(Array.isArray(data) ? data : []);
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
                                    {anime.release_date ? new Date(anime.release_date).toLocaleDateString() : 'N/A'}
                                </div>
                                <div className="col-company">
                                    {companies.find(c => c.id === anime.company_id)?.name || 'N/A'}
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
