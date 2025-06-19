import React, {useEffect, useState} from 'react';
import {useAuth} from '../../contexts/AuthContext';

const VATab = ({searchQuery}) => {
    const {token} = useAuth();
    const [voiceActors, setVoiceActors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        birth_date: '',
        nationality: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchVoiceActors();
    }, []);

    const fetchVoiceActors = async () => {
        try {
            const response = await fetch('/api/voice-actors', {
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

        if (!formData.name.trim()) {
            showError('Voice actor name is required');
            setLoading(false);
            return;
        }

        const existingVA = voiceActors.find(va =>
            va.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
            va.voice_actor_id !== editingId
        );
        if (existingVA) {
            showError('Voice actor with this name already exists');
            setLoading(false);
            return;
        }

        const url = editingId
            ? `/api/voice-actors/${editingId}`
            : '/api/voice-actors';
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
                    birthDate: formData.birth_date || null,  // Match backend's camelCase
                    nationality: formData.nationality.trim() || null
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                showError(errorData.message || (editingId ? 'Failed to update voice actor' : 'Failed to add voice actor'));
                setLoading(false);
                return;
            }

            await fetchVoiceActors();
            resetForm();
        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (va) => {
        if (!va) return;
        const vaId = va.voice_actor_id;
        if (!vaId) {
            showError('Invalid voice actor data: missing ID');
            return;
        }
        setFormData({
            name: va.name || '',
            birth_date: va.birth_date ? va.birth_date.split('T')[0] : '',
            nationality: va.nationality || ''
        });
        setEditingId(vaId);
    };

    const handleDelete = async (id) => {
        if (!id) {
            showError('Invalid voice actor ID');
            return;
        }
        if (!window.confirm('Are you sure you want to delete this voice actor? This will remove all their associated roles.')) return;

        try {
            const vaId = Number(id);
            if (isNaN(vaId)) {
                showError('Invalid voice actor ID format');
                return;
            }

            const response = await fetch(`http://localhost:5000/api/voice-actors/${vaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                showError(errorData.message || 'Failed to delete voice actor');
                return;
            }

            await fetchVoiceActors();
            setError('');
        } catch (err) {
            showError(err.message || 'Failed to delete voice actor');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            birth_date: '',
            nationality: ''
        });
        setEditingId(null);
        setError('');
    };

    const filteredVAs = voiceActors.filter(va =>
        va.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="admin-tab-content">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="admin-form-section">
                <h2>{editingId ? 'Edit Voice Actor' : 'Add New Voice Actor'}</h2>
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
                        <label>Nationality</label>
                        <input
                            type="text"
                            name="nationality"
                            className="form-control"
                            value={formData.nationality}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
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
                            <div className="col-birth-date">Birth Date</div>
                            <div className="col-nationality">Nationality</div>
                            <div className="col-actions">Actions</div>
                        </div>
                        {filteredVAs.map(va => (
                            <div key={va.voice_actor_id} className="table-row">
                                <div className="col-name">{va.name}</div>
                                <div className="col-birth-date">
                                    {va.birth_date ? new Date(va.birth_date).toLocaleDateString() : 'N/A'}
                                </div>
                                <div className="col-nationality">
                                    {va.nationality || 'N/A'}
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
                                        onClick={() => handleDelete(va.voice_actor_id)}
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