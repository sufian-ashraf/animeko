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
            setLoading(true);
            const response = await fetch('/api/voice-actors', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch voice actors');
            }
            
            const data = await response.json();
            console.log('Fetched voice actors:', data); // Debug log
            
            // Handle both array and paginated response formats
            const actors = Array.isArray(data) ? data : (data.results || data.voiceActors || []);
            setVoiceActors(actors);
            setError('');
        } catch (err) {
            console.error('Error fetching voice actors:', err);
            setError(err.message || 'Failed to load voice actors');
            setVoiceActors([]);
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
                    birthDate: formData.birth_date || null,
                    nationality: formData.nationality.trim() || null
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || (editingId ? 'Failed to update voice actor' : 'Failed to add voice actor'));
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
        if (!va) {
            showError('No voice actor data provided');
            return;
        }
        
        // Handle both 'id' and 'voice_actor_id' for backward compatibility
        const vaId = va.id || va.voice_actor_id;
        if (!vaId) {
            console.error('Voice actor data missing ID:', va);
            showError('Invalid voice actor data: missing ID');
            return;
        }
        
        try {
            // Format the date for the date input (YYYY-MM-DD)
            let formattedDate = '';
            const birthDate = va.birth_date || va.birthDate; // Handle both formats
            if (birthDate) {
                const date = new Date(birthDate);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toISOString().split('T')[0];
                }
            }
            
            setFormData({
                name: va.name || '',
                birth_date: formattedDate,
                nationality: va.nationality || ''
            });
            setEditingId(vaId);
        } catch (err) {
            console.error('Error formatting voice actor data:', err);
            showError('Error loading voice actor data');
        }
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

            setLoading(true);
            const response = await fetch(`/api/voice-actors/${vaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete voice actor');
            }

            await fetchVoiceActors();
            setError('');
            // Show success message
            setError('Voice actor deleted successfully');
            setTimeout(() => setError(''), 3000);
        } catch (err) {
            console.error('Delete error:', err);
            showError(err.message || 'Failed to delete voice actor');
        } finally {
            setLoading(false);
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

    const filteredVAs = (voiceActors || []).filter(va => {
        if (!va) return false;
        const name = va.name || '';
        return name.toLowerCase().includes((searchQuery || '').toLowerCase());
    });

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
                        {filteredVAs.length === 0 ? (
                            <div className="table-row">
                                <div className="col-span-4" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1rem' }}>
                                    {loading ? 'Loading voice actors...' : 'No voice actors found'}
                                </div>
                            </div>
                        ) : (
                            filteredVAs.map(va => {
                                if (!va) return null;
                                // Handle both 'id' and 'voice_actor_id' for backward compatibility
                                const vaId = va.id || va.voice_actor_id;
                                if (!vaId) {
                                    console.error('Voice actor missing ID:', va);
                                    return null;
                                }
                                
                                return (
                                    <div key={`va-${vaId}`} className="table-row">
                                        <div className="col-name">{va.name || 'N/A'}</div>
                                        <div className="col-birth-date">
                                            {va.birth_date || va.birthDate 
                                                ? new Date(va.birth_date || va.birthDate).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    timeZone: 'UTC' // Prevent timezone-related date shifting
                                                  })
                                                : 'N/A'}
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
                                                aria-label={`Edit ${va.name || 'voice actor'}`}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(vaId)}
                                                className="btn btn-delete btn-sm"
                                                disabled={loading}
                                                aria-label={`Delete ${va.name || 'voice actor'}`}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VATab;