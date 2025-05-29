// frontend/src/pages/Profile.js
import React, {useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import '../styles/Profile.css';

const Profile = () => {
    const {user, updateProfile, logout} = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        display_name: user?.display_name || '', profile_bio: user?.profile_bio || ''
    });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            setIsLoading(true);
            const result = await updateProfile(formData);
            setMessage('Profile updated successfully');
            setIsEditing(false);
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            display_name: user?.display_name || '', profile_bio: user?.profile_bio || ''
        });
        setIsEditing(false);
        setError('');
        setMessage('');
    };

    if (!user) {
        return <div className="loading">Loading profile...</div>;
    }

    return (<div className="profile-container">
            <div className="profile-card">
                <h2>My Profile</h2>

                {error && <div className="profile-error">{error}</div>}
                {message && <div className="profile-success">{message}</div>}

                {isEditing ? (<form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-group">
                            <label htmlFor="display_name">Display Name</label>
                            <input
                                id="display_name"
                                name="display_name"
                                type="text"
                                value={formData.display_name}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="profile_bio">Bio</label>
                            <textarea
                                id="profile_bio"
                                name="profile_bio"
                                value={formData.profile_bio}
                                onChange={handleChange}
                                disabled={isLoading}
                                rows="4"
                            />
                        </div>

                        <div className="profile-buttons">
                            <button
                                type="submit"
                                className="primary-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={handleCancel}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>) : (<div className="profile-info">
                        <div className="info-row">
                            <strong>Username:</strong>
                            <span>{user.username}</span>
                        </div>

                        <div className="info-row">
                            <strong>Email:</strong>
                            <span>{user.email}</span>
                        </div>

                        <div className="info-row">
                            <strong>Display Name:</strong>
                            <span>{user.display_name || 'Not set'}</span>
                        </div>

                        <div className="info-row">
                            <strong>Bio:</strong>
                            <p>{user.profile_bio || 'No bio provided'}</p>
                        </div>

                        <div className="info-row">
                            <strong>Member Since:</strong>
                            <span>{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="profile-buttons">
                            <button
                                className="primary-button"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Profile
                            </button>
                            <button
                                className="secondary-button"
                                onClick={logout}
                            >
                                Logout
                            </button>
                        </div>
                    </div>)}
            </div>
        </div>);
};

export default Profile;
