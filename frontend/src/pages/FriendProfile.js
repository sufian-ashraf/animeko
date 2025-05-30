// src/pages/FriendProfile.js
import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import '../styles/Profile.css';

export default function FriendProfile() {
    const {userId} = useParams();
    const navigate = useNavigate();
    const {token} = useAuth();

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token || !userId) return;

        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/users/profile/${userId}`, {
                    headers: {Authorization: `Bearer ${token}`}
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
                setProfileData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token, userId]);

    if (loading) {
        return <div className="loading">Loading profile...</div>;
    }

    if (error) {
        return (<div className="profile-page">
            <div className="profile-card">
                <div className="profile-error">{error}</div>
                <button onClick={() => navigate('/profile')}>Back to My Profile</button>
            </div>
        </div>);
    }

    if (!profileData) {
        return <div className="loading">No profile data found</div>;
    }

    const {user, friends, favorites} = profileData;

    return (<div className="profile-page">
        {/* Navigation */}
        <div className="profile-nav">
            <button onClick={() => navigate('/profile')} className="back-btn">
                ← Back to My Profile
            </button>
        </div>

        {/* Friend's Profile Card */}
        <div className="profile-card">
            <h2>{user.display_name || user.username}'s Profile</h2>
            <div className="profile-info">
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Display Name:</strong> {user.display_name || 'Not set'}</p>
                <p><strong>Bio:</strong> {user.profile_bio || 'No bio provided'}</p>
                <p><strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
        </div>

        {/* Friend's Friends List */}
        <section>
            <h3>Their Friends ({friends.length})</h3>
            <div className="scroll-box">
                {friends.length ? friends.map(f => (<div key={f.user_id} className="row">
                            <span
                                className="friend-name clickable"
                                onClick={() => navigate(`/profile/${f.user_id}`)}
                                title="Click to view profile"
                            >
                                {f.display_name} (@{f.username})
                            </span>
                </div>)) : <p>No friends to display</p>}
            </div>
        </section>

        {/* Friend's Favorites */}
        <section>
            <h3>Their Favorites ({favorites.length})</h3>
            <div className="fav-grid">
                {favorites.length ? favorites.map(f => (
                    <div key={`${f.entityType}-${f.entityId}`} className="fav-card readonly">
                        <span>{f.entityType.toUpperCase()} #{f.entityId}</span>
                    </div>)) : <p>No favorites to display</p>}
            </div>
        </section>
    </div>);
}