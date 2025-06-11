import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const GenreTab = ({ searchQuery }) => {
    const { token } = useAuth();
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchGenres();
    }, []);

    const fetchGenres = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/genre');
            if (!response.ok) {
                throw new Error('Failed to fetch genres');
            }
            const data = await response.json();
            // Ensure consistent ID field names
            const formattedData = Array.isArray(data) 
                ? data.map(genre => ({
                    ...genre,
                    genre_id: genre.genre_id || genre.id, // Use genre_id if available, fallback to id
                    id: genre.genre_id || genre.id         // Ensure id is always present
                }))
                : [];
            setGenres(formattedData);
        } catch (err) {
            setError(err.message);
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const url = editingId 
            ? `http://localhost:5000/api/genre/${editingId}`
            : 'http://localhost:5000/api/genre';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || (editingId ? 'Failed to update genre' : 'Failed to add genre'));
            }

            await fetchGenres();
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (genre) => {
        if (!genre) return;
        
        // Use either genre_id or id, whichever is available
        const genreId = genre.genre_id || genre.id;
        if (!genreId) {
            setError('Invalid genre data: missing ID');
            return;
        }
        
        setFormData({
            name: genre.name || '',
            description: genre.description || ''
        });
        setEditingId(genreId);
    };

    const handleDelete = async (id) => {
        if (!id) {
            setError('Invalid genre ID');
            return;
        }
        
        if (!window.confirm('Are you sure you want to delete this genre? This action cannot be undone.')) return;
        
        try {
            // Convert to number in case it's a string
            const genreId = Number(id);
            if (isNaN(genreId)) {
                throw new Error('Invalid genre ID format');
            }
            
            const response = await fetch(`http://localhost:5000/api/genre/${genreId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete genre');
            }

            // Refresh the list after successful deletion
            await fetchGenres();
            
            // Clear any previous errors
            setError('');
        } catch (err) {
            console.error('Delete error:', err);
            setError(err.message || 'Failed to delete genre');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: ''
        });
        setEditingId(null);
    };

    const filteredGenres = genres.filter(genre =>
        genre.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="admin-tab-content">
            <div className="admin-form-section">
                <h2>{editingId ? 'Edit Genre' : 'Add New Genre'}</h2>
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
                            value={formData.description}
                            onChange={handleInputChange}
                            rows="3"
                        ></textarea>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                            {editingId ? 'Update' : 'Add'} Genre
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
                <h2>Genre List</h2>
                {filteredGenres.length === 0 ? (
                    <p>No genres found.</p>
                ) : (
                    <div className="admin-table">
                        <div className="table-header">
                            <div className="col-name">Name</div>
                            <div className="col-desc">Description</div>
                            <div className="col-actions">Actions</div>
                        </div>
                        {filteredGenres.map(genre => (
                            <div key={genre.genre_id} className="table-row">
                                <div className="col-name">{genre.name}</div>
                                <div className="col-desc">
                                    {genre.description || 'No description'}
                                </div>
                                <div className="col-actions">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(genre)}
                                        className="btn btn-edit btn-sm"
                                        disabled={loading}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(genre.genre_id)}
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

export default GenreTab;
