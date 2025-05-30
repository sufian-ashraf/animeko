// frontend/src/pages/Profile.js
import React, {useEffect, useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import '../styles/Profile.css';

const Profile = () => {
    console.log('Profile component rendering...'); // Debug log

    const {user, updateProfile, logout, token} = useAuth();
    console.log('Auth context values:', {user, token: token ? 'exists' : 'missing'}); // Debug log

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        display_name: user?.display_name || '', profile_bio: user?.profile_bio || ''
    });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Add this useEffect to see if component is mounting
    useEffect(() => {
        console.log('Profile component mounted!');
        console.log('Token from useAuth:', token);
        console.log('User from useAuth:', user);

        // Force a profile fetch request
        if (token) {
            console.log('Token exists, making profile request...');

            fetch('http://localhost:5000/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(response => {
                    console.log('Profile response received:', response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('Profile data:', data);
                })
                .catch(error => {
                    console.error('Profile fetch error:', error);
                });
        } else {
            console.log('No token found, cannot fetch profile');
        }
    }, []); // Empty dependency array - runs once on mount

    // Also add this to track when token changes
    useEffect(() => {
        console.log('Token changed in Profile component:', token);
    }, [token]);

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

    console.log('About to render Profile JSX'); // Debug log

    if (!user && !token) {
        console.log('No user and no token - showing loading'); // Debug log
        return <div className="loading">Please log in to view profile...</div>;
    }

    return (<div className="profile-container">
            <div className="profile-card">
                <h2>My Profile</h2>

                {/*/!* Add debug info *!/*/}
                {/*<div style={{background: '#f0f0f0', padding: '10px', margin: '10px 0', fontSize: '12px'}}>*/}
                {/*    <strong>Debug Info:</strong><br/>*/}
                {/*    Token: {token ? 'Present' : 'Missing'}<br/>*/}
                {/*    User: {user ? 'Loaded' : 'Not loaded'}<br/>*/}
                {/*    Component mounted: Yes*/}
                {/*</div>*/}

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
                            <span>{user?.username || 'Loading...'}</span>
                        </div>

                        <div className="info-row">
                            <strong>Email:</strong>
                            <span>{user?.email || 'Loading...'}</span>
                        </div>

                        <div className="info-row">
                            <strong>Display Name:</strong>
                            <span>{user?.display_name || 'Not set'}</span>
                        </div>

                        <div className="info-row">
                            <strong>Bio:</strong>
                            <p>{user?.profile_bio || 'No bio provided'}</p>
                        </div>

                        <div className="info-row">
                            <strong>Member Since:</strong>
                            <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Loading...'}</span>
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