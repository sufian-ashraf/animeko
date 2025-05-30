// src/pages/Profile.js
import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import '../styles/Profile.css';

// placeholder image
import placeholderImg from '../images/image_not_available.jpg';

export default function Profile() {
    const {user, token, updateProfile, logout} = useAuth();
    const navigate = useNavigate();

    // Profile edit state
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        display_name: user?.display_name || '', profile_bio: user?.profile_bio || ''
    });
    const [loadingEdit, setLoadingEdit] = useState(false);
    const [editError, setEditError] = useState('');
    const [editMessage, setEditMessage] = useState('');

    // Social & favorites state
    const [incoming, setIncoming] = useState([]);
    const [friends, setFriends] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [favorites, setFavorites] = useState([]);

    // Fetch social & favs on mount
    useEffect(() => {
        if (!token) return;
        const headers = {Authorization: `Bearer ${token}`};

        fetch('/api/friends/requests', {headers})
            .then(r => r.json()).then(setIncoming);

        fetch('/api/friends', {headers})
            .then(r => r.json()).then(setFriends);

        fetch('/api/favorites', {headers})
            .then(r => r.json()).then(setFavorites);
    }, [token]);

    // Search users
    useEffect(() => {
        if (searchQuery === '') {
            setSearchResults([]);
            return;
        }

        fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
            headers: {Authorization: `Bearer ${token}`}
        })
            .then(r => r.ok ? r.json() : Promise.reject(r))
            .then(setSearchResults)
            .catch(err => {
                console.error('Search error:', err);
                setSearchResults([]);  // fail-safe
            });
    }, [searchQuery, token]);


    // Profile handlers
    const handleChange = e => {
        const {name, value} = e.target;
        setFormData(f => ({...f, [name]: value}));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setEditError('');
        setEditMessage('');
        try {
            setLoadingEdit(true);
            await updateProfile(formData);
            setEditMessage('Profile updated successfully');
            setIsEditing(false);
        } catch (err) {
            setEditError(err.message || 'Failed to update profile');
        } finally {
            setLoadingEdit(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            display_name: user.display_name || '', profile_bio: user.profile_bio || ''
        });
        setEditError('');
        setEditMessage('');
        setIsEditing(false);
    };

    // Social handlers
    const respondRequest = (requesterId, action) => {
        fetch(`/api/friends/requests/${requesterId}/${action}`, {
            method: 'POST', headers: {Authorization: `Bearer ${token}`}
        }).then(() => {
            setIncoming(incoming.filter(r => r.user_id !== requesterId));
            if (action === 'accept') {
                fetch('/api/friends', {headers: {Authorization: `Bearer ${token}`}})
                    .then(r => r.json()).then(setFriends);
            }
        });
    };

    const sendFriendRequest = async (toUserId) => {
        try {
            const response = await fetch('/api/friends/requests', {
                method: 'POST', headers: {
                    'Content-Type': 'application/json', Authorization: `Bearer ${token}`
                }, body: JSON.stringify({addresseeId: toUserId})
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || 'Failed to send friend request');
                return;
            }

            // Clear search and refresh results
            setSearchQuery('');
            alert('Friend request sent!');

        } catch (err) {
            console.error('Error sending friend request:', err);
            alert('Failed to send friend request');
        }
    };

    // Remove a friend
    const removeFriend = async (friendId) => {
        try {
            const resp = await fetch(`/api/friends/${friendId}`, {
                method: 'DELETE', headers: {Authorization: `Bearer ${token}`}
            });

            if (!resp.ok) {
                // Try to parse JSON, fallback to text
                let message;
                const ct = resp.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    const body = await resp.json();
                    message = body.message;
                } else {
                    message = await resp.text();
                }
                throw new Error(message || `Server responded ${resp.status}`);
            }

            // Success—re-fetch the friends list:
            const friendsRes = await fetch('/api/friends', {
                headers: {Authorization: `Bearer ${token}`}
            });
            const friendsData = await friendsRes.json();
            setFriends(friendsData);
        } catch (err) {
            console.error('Unfriend failed:', err);
            alert(err.message);
        }
    };


    const getButtonForUser = (searchUser) => {
        switch (searchUser.friendship_status) {
            case 'friend':
                return <span className="status-badge friend">Friends</span>;
            case 'request_sent':
                return <span className="status-badge pending">Request Sent</span>;
            case 'request_received':
                return (<div>
                    <button
                        className="btn-small accept"
                        onClick={() => respondRequest(searchUser.user_id, 'accept')}
                    >
                        Accept
                    </button>
                    <button
                        className="btn-small reject"
                        onClick={() => respondRequest(searchUser.user_id, 'reject')}
                    >
                        Reject
                    </button>
                </div>);
            default:
                return (<button onClick={() => sendFriendRequest(searchUser.user_id)}>
                    Add Friend
                </button>);
        }
    };

    if (!user) {
        return <div className="loading">Please log in to view your profile...</div>;
    }

    return (<div className="profile-page">
        {/* Profile Card */}
        <div className="profile-card">
            <h2>My Profile</h2>
            <img
                src={user.profile_picture_url || placeholderImg}
                alt="Profile"
                className="user-profile-pic"
            />

            {editError && <div className="profile-error">{editError}</div>}
            {editMessage && <div className="profile-success">{editMessage}</div>}

            {isEditing ? (<form onSubmit={handleSubmit} className="profile-form">
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
                <div className="profile-buttons">
                    <button type="submit" disabled={loadingEdit}>
                        {loadingEdit ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={handleCancel} disabled={loadingEdit}>
                        Cancel
                    </button>
                </div>
            </form>) : (<div className="profile-info">
                <p>Username: {user.username}</p>
                <p>Email: {user.email}</p>
                <p>Display Name: {user.display_name || 'Not set'}</p>
                <p>Bio: {user.profile_bio || 'No bio provided'}</p>
                <p>Member Since: {new Date(user.created_at).toLocaleDateString()}</p>
                <div className="profile-buttons">
                    <button onClick={() => setIsEditing(true)}>Edit Profile</button>
                    <button onClick={logout}>Logout</button>
                </div>
            </div>)}
        </div>

        {/* Incoming Friend Requests */}
        <section>
            <h3>Incoming Friend Requests</h3>
            <div className="scroll-box">
                {incoming.length ? incoming.map(r => (<div key={r.user_id} className="row">
                    <span>{r.display_name} (@{r.username})</span>
                    <div>
                        <button onClick={() => respondRequest(r.user_id, 'accept')}>Accept</button>
                        <button onClick={() => respondRequest(r.user_id, 'reject')}>Reject</button>
                    </div>
                </div>)) : <p>No pending requests</p>}
            </div>
        </section>

        {/* Friends List */}
        <section>
            <h3>Your Friends</h3>
            <div className="scroll-box friends-list">
                {friends.length ? friends.map(f => (<div key={f.user_id} className="friend-row">
                    <img
                        src={f.profile_picture_url || placeholderImg}
                        alt={f.display_name}
                        className="friend-avatar"
                    />
                    <span
                        className="friend-name clickable"
                        onClick={() => navigate(`/profile/${f.user_id}`)}
                    >
                    {f.display_name} (@{f.username})
                </span>
                    <button
                        className="btn-small unfriend"
                        onClick={() => removeFriend(f.user_id)}
                    >
                        Unfriend
                    </button>
                </div>)) : <p>You have no friends yet</p>}
            </div>
        </section>


        {/* Search Users */}
        <section>
            <h3>Find & Add Friends</h3>
            <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
            <div className="scroll-box">
                {searchResults.length ? searchResults.map(u => (<div key={u.user_id} className="row">
                            <span>
                                {u.display_name} (@{u.username})
                                {u.friendship_status === 'friend' && (<span
                                    className="view-profile-link"
                                    onClick={() => navigate(`/profile/${u.user_id}`)}
                                    title="View Profile"
                                >
                                        {' '}👁️
                                    </span>)}
                            </span>
                    {getButtonForUser(u)}
                </div>)) : <p>Type at least 2 characters to search</p>}
            </div>
        </section>

        {/* Favorites Section */}
        <section className="favorites-section">
            <h3>Your Favorites</h3>
            {['anime', 'character', 'va'].map(type => (<div key={type} className="favorite-type-container">
                <h4>{type.charAt(0).toUpperCase() + type.slice(1)} Favorites</h4>
                <div className="scroll-box fav-grid">
                    {favorites.filter(f => f.entityType === type).length ? (favorites.filter(f => f.entityType === type).map(f => {
                        const path = `/${type}/${f.entityId}`;
                        return (<div key={`${type}-${f.entityId}`} className="fav-item">
                            <Link to={path} className="fav-card">
                                <img
                                    src={f.imageUrl || placeholderImg}
                                    alt={f.name}
                                    className="fav-image"
                                />
                                <span className="fav-name">{f.name}</span>
                            </Link>
                        </div>);
                    })) : (<p>No {type} favorites</p>)}
                </div>
            </div>))}
        </section>


    </div>);
}