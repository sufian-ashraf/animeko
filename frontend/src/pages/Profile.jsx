// src/pages/Profile.jsx
import React, {useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import placeholderImg from '../images/image_not_available.jpg';
import defaultAvatar from '../images/default_avatar.svg';
import '../styles/Profile.css';
import '../styles/AnimeImageInput.css';

export default function Profile() {
    const {userId} = useParams(); // If present, viewing someone else's profile
    const {user: currentUser, token, updateProfile, logout} = useAuth();
    const navigate = useNavigate();

    const isOwnProfile = !userId || userId === currentUser?.user_id?.toString();
    const viewingUserId = isOwnProfile ? currentUser?.user_id : userId;

    const [profileUser, setProfileUser] = useState(isOwnProfile ? currentUser : null);
    const [loading, setLoading] = useState(!isOwnProfile);
    const [error, setError] = useState('');

    // Profile‐edit state (own profile only)
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        display_name: '', profile_bio: '', profile_picture_url: ''
    });
    const [loadingEdit, setLoadingEdit] = useState(false);
    const [editError, setEditError] = useState('');
    const [editMessage, setEditMessage] = useState('');

    // Favorites state
    const [favorites, setFavorites] = useState([]);

    // Initialize form data when profileUser changes
    useEffect(() => {
        if (profileUser && isOwnProfile) {
            setFormData({
                display_name: profileUser.display_name || '', profile_bio: profileUser.profile_bio || '', profile_picture_url: profileUser.profile_picture_url || ''
            });
        }
    }, [profileUser, isOwnProfile]);

    // Fetch profile data (own or someone else’s)
    useEffect(() => {
        if (!token) return;

        const fetchProfileData = async () => {
            try {
                setLoading(true);
                setError('');

                if (isOwnProfile) {
                    setProfileUser(currentUser);
                    // For own profile, we already have the user data
                    // Just ensure we have the latest favorites
                    const favsRes = await fetch('/api/favorites', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (favsRes.ok) {
                        const favsData = await favsRes.json();
                        setFavorites(Array.isArray(favsData) ? favsData : []);
                    }
                } else {
                    // For other users' profiles, fetch their public data
                    const response = await fetch(`/api/users/profile/${userId}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });

                    if (!response.ok) {
                        if (response.status === 403) {
                            throw new Error('You can only view profiles of friends');
                        } else if (response.status === 404) {
                            throw new Error('User not found');
                        } else {
                            throw new Error('Failed to load profile');
                        }
                    }


                    const data = await response.json();
                    setProfileUser(data.user);
                    setFavorites(data.favorites || []);
                }
            } catch (err) {
                console.error('Error fetching profile data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [token, userId, currentUser, isOwnProfile]);

    // Profile edit handlers
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((f) => ({...f, [name]: value}));
    };
    
    // Fetch favorites for the profile
    useEffect(() => {
        if (!token) return;
        
        const fetchFavorites = async () => {
            try {
                const response = await fetch('/api/favorites', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setFavorites(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error('Error fetching favorites:', error);
            }
        };
        
        fetchFavorites();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEditError('');
        setEditMessage('');

        try {
            setLoadingEdit(true);
            await updateProfile(formData);

            setEditMessage('Profile updated successfully');
            setIsEditing(false);
            // Re-fetch profile data to ensure the latest profile picture URL is displayed
            fetchProfileData();
        } catch (err) {
            setEditError(err.message || 'Failed to update profile');
        } finally {
            setLoadingEdit(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            display_name: profileUser.display_name || '', 
            profile_bio: profileUser.profile_bio || '',
            profile_picture_url: profileUser.profile_picture_url || ''
        });
        setEditError('');
        setEditMessage('');
        setIsEditing(false);
    };

    // Loading/Error states
    if (loading) {
        return (
            <div className="spinner-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-page">
                <div className="profile-card">
                    <div className="profile-error">{error}</div>
                    {isOwnProfile ? (
                        <button onClick={() => navigate('/profile')}>
                            Please log in
                        </button>
                    ) : (
                        <p>Please try again later.</p>
                    )}
                </div>
            </div>
        );
    }

    if (!profileUser) {
        return (
            <div className="loading">
                {isOwnProfile ? 'Please log in to view your profile…' : 'No profile data found'}
            </div>
        );
    }

    const profileTitle = isOwnProfile ? 'My Profile' : `${profileUser.display_name || profileUser.username}'s Profile`;
    const favoritesPrefix = isOwnProfile ? 'Favorite' : 'Their Favorite';

    return (
        <div className="profile-page">
            {/* Back button if viewing someone else's profile */}
            {!isOwnProfile && (
                <div className="profile-nav">
                    <button onClick={() => navigate('/profile')} className="back-btn">
                        ← Back to My Profile
                    </button>
                </div>
            )}

            {/* Profile Card */}
            <div className="profile-card">
                <h2>{profileTitle}</h2>
                <img
                    src={profileUser.profile_picture_url || defaultAvatar}
                    alt="Profile"
                    className="user-profile-pic"
                />

                {editError && <div className="profile-error">{editError}</div>}
                {editMessage && <div className="profile-success">{editMessage}</div>}

                {isOwnProfile && isEditing ? (
                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-group">
                            <label>Display Name</label>
                            <input
                                name="display_name"
                                value={formData.display_name}
                                onChange={handleChange}
                                disabled={loadingEdit}
                            />
                        </div>
                        <div className="form-group">
                            <label>Bio</label>
                            <textarea
                                name="profile_bio"
                                value={formData.profile_bio}
                                onChange={handleChange}
                                rows="3"
                                disabled={loadingEdit}
                            />
                        </div>
                        <div className="form-group">
                            <label>Profile Picture URL</label>
                            <input
                                name="profile_picture_url"
                                value={formData.profile_picture_url}
                                onChange={handleChange}
                                disabled={loadingEdit}
                            />
                            <div className="anime-url-hint">
                                Paste a direct link to a profile image (JPG, PNG, WEBP)
                            </div>
                        </div>
                        <div className="profile-buttons">
                            <button type="submit" disabled={loadingEdit}>
                                {loadingEdit ? 'Saving…' : 'Save Changes'}
                            </button>
                            <button type="button" onClick={handleCancel} disabled={loadingEdit}>
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="profile-info">
                        <p>
                            <span className="profile-field-label">Username:</span>
                            <span className="profile-field-value">{profileUser.username}</span>
                        </p>
                        {!isOwnProfile || (
                            <p>
                                <span className="profile-field-label">Email:</span>
                                <span className="profile-field-value">{profileUser.email}</span>
                            </p>
                        )}
                        <p>
                            <span className="profile-field-label">Display Name:</span>
                            <span className="profile-field-value">{profileUser.display_name || 'Not set'}</span>
                        </p>
                        <p>
                            <span className="profile-field-label">Bio:</span>
                            <span className="profile-field-value">{profileUser.profile_bio || 'No bio provided'}</span>
                        </p>
                        <p>
                            <span className="profile-field-label">Member Since:</span>
                            <span className="profile-field-value">{new Date(profileUser.created_at).toLocaleDateString()}</span>
                        </p>
                        <div className="profile-buttons">
                            {isOwnProfile && (
                                <button onClick={() => setIsEditing(true)}>
                                    Edit Profile
                                </button>
                            )}
                            <button onClick={() => navigate('/anime-library')}>
                                Anime Library
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Favorites Section */}
            <section className="favorites-section">
                <h3>Favorites</h3>
                {['anime', 'character', 'voice_actor'].map((type) => (
                    <div key={type} className="favorite-type-container">
                        <h4>
                            {favoritesPrefix} {type.charAt(0).toUpperCase() + type.slice(1)}s
                        </h4>
                        <div className="scroll-box fav-grid">
                            {favorites.filter((f) => f.entityType === type).length > 0 ? (
                                favorites
                                    .filter((f) => f.entityType === type)
                                    .map((f) => {
                                        const path = `/${type === 'voice_actor' ? 'va' : type}/${f.entityId}`;
                                        return (
                                            <div key={`${type}-${f.entityId}`} className="fav-item">
                                                <Link to={path} className="fav-card">
                                                    <img
                                                        src={f.imageUrl || placeholderImg}
                                                        alt={f.name}
                                                        className="fav-image"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = placeholderImg;
                                                        }}
                                                    />
                                                    <span className="fav-name">{f.name}</span>
                                                </Link>
                                            </div>
                                        );
                                    })
                            ) : (
                                <p>No favorite {type}s yet</p>
                            )}
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}
