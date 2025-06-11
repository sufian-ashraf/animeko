import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const VATab = ({ searchQuery }) => {
    const { token } = useAuth();
    const [voiceActors, setVoiceActors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        original_name: '',
        gender: '',
        birth_date: '',
        country: '',
        description: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchVoiceActors();
    }, []);

    const fetchVoiceActors = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/voice-actors', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch voice actors');
            }
            const data = await response.json();
            setVoiceActors(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
            console.error(err);
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
            ? `http://localhost:5000/api/voice-actors/${editingId}`
            : 'http://localhost:5000/api/voice-actors';
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
                throw new Error(errorData.message || (editingId ? 'Failed to update voice actor' : 'Failed to add voice actor'));
            }

            await fetchVoiceActors();
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (va) => {
        setFormData({
            name: va.name,
            original_name: va.original_name || '',
            gender: va.gender || '',
            birth_date: va.birth_date ? va.birth_date.split('T')[0] : '',
            country: va.country || '',
            description: va.description || ''
        });
        setEditingId(va.va_id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this voice actor? This will remove all their associated roles.')) return;
        
        try {
            const response = await fetch(`http://localhost:5000/api/voice-actors/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete voice actor');
            }

            await fetchVoiceActors();
        } catch (err) {
            setError(err.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            original_name: '',
            gender: '',
            birth_date: '',
            country: '',
            description: ''
        });
        setEditingId(null);
    };

    const filteredVAs = voiceActors.filter(va =>
        va.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (va.original_name && va.original_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="admin-tab-content">
            <div className="admin-form-section">
                <h2>{editingId ? 'Edit Voice Actor' : 'Add New Voice Actor'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name (English) *</label>
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
                        <label>Original Name</label>
                        <input
                            type="text"
                            name="original_name"
                            className="form-control"
                            value={formData.original_name}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Gender</label>
                        <select
                            name="gender"
                            className="form-control"
                            value={formData.gender}
                            onChange={handleInputChange}
                        >
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Birth Date</label>
                        <input
                            type="date"
                            name="birth_date"
                            className="form-control"
                            value={formData.birth_date}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Country</label>
                        <input
                            type="text"
                            name="country"
                            className="form-control"
                            value={formData.country}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Biography</label>
                        <textarea
                            name="biography"
                            className="form-control"
                            value={formData.biography}
                            onChange={handleInputChange}
                            rows="3"
                        />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                            {editingId ? 'Update' : 'Add'} Voice Actor
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
                <h2>Voice Actor List</h2>
                {filteredVAs.length === 0 ? (
                    <p>No voice actors found.</p>
                ) : (
                    <div className="admin-table">
                        <div className="table-header">
                            <div className="col-name">Name</div>
                            <div className="col-original">Original Name</div>
                            <div className="col-gender">Gender</div>
                            <div className="col-country">Country</div>
                            <div className="col-actions">Actions</div>
                        </div>
                        {filteredVAs.map(va => (
                            <div key={va.va_id} className="table-row">
                                <div className="col-name">{va.name}</div>
                                <div className="col-original">
                                    {va.original_name || 'N/A'}
                                </div>
                                <div className="col-gender">
                                    {va.gender || 'N/A'}
                                </div>
                                <div className="col-country">
                                    {va.country || 'N/A'}
                                </div>
                                <div className="col-actions">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(va)}
                                        className="btn btn-edit btn-sm"
                                        disabled={loading}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(va.va_id)}
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

export default VATab;
