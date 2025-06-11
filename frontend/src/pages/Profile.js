// src/pages/Profile.js
import React, {useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import placeholderImg from '../images/image_not_available.jpg';
import MyLists from './MyLists'; // ← import your MyLists component
import '../styles/Profile.css';

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
        display_name: '', profile_bio: '',
    });
    const [loadingEdit, setLoadingEdit] = useState(false);
    const [editError, setEditError] = useState('');
    const [editMessage, setEditMessage] = useState('');

    // Social & favorites (only own profile)
    const [incoming, setIncoming] = useState([]);
    const [friends, setFriends] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [sendMessage, setSendMessage] = useState('');
    const [favorites, setFavorites] = useState([]);

    // Initialize form data when profileUser changes
    useEffect(() => {
        if (profileUser && isOwnProfile) {
            setFormData({
                display_name: profileUser.display_name || '', profile_bio: profileUser.profile_bio || '',
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
                } else {
                    const response = await fetch(`/api/users/profile/${userId}`, {
                        headers: {Authorization: `Bearer ${token}`},
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
                    setFriends(data.friends || []);
                    setFavorites(data.favorites || []);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [token, userId, currentUser, isOwnProfile]);

    // Fetch incoming & friends & favorites (own profile)
    useEffect(() => {
        if (!token || !isOwnProfile) return;

        const headers = {Authorization: `Bearer ${token}`};

        fetch('/api/friends/requests', {headers})
            .then((r) => r.json())
            .then(setIncoming)
            .catch(console.error);

        fetch('/api/friends', {headers})
            .then((r) => r.json())
            .then(setFriends)
            .catch(console.error);

        fetch('/api/favorites', {headers})
            .then((r) => r.json())
            .then(setFavorites)
            .catch(console.error);
    }, [token, isOwnProfile]);

    // Search users (own profile only)
    useEffect(() => {
        if (!isOwnProfile || searchQuery === '') {
            setSearchResults([]);
            return;
        }

        fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then((r) => (r.ok ? r.json() : Promise.reject(r)))
            .then(setSearchResults)
            .catch(() => setSearchResults([]));
    }, [searchQuery, token, isOwnProfile]);

    // Profile edit handlers
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((f) => ({...f, [name]: value}));
    };

    const handleSubmit = async (e) => {
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
            display_name: profileUser.display_name || '', profile_bio: profileUser.profile_bio || '',
        });
        setEditError('');
        setEditMessage('');
        setIsEditing(false);
    };

    // Social handlers (own profile)
    const respondRequest = (requesterId, action) => {
        fetch(`/api/friends/requests/${requesterId}/${action}`, {
            method: 'POST', headers: {Authorization: `Bearer ${token}`},
        }).then(() => {
            setIncoming((inc) => inc.filter((r) => r.user_id !== requesterId));
            if (action === 'accept') {
                fetch('/api/friends', {headers: {Authorization: `Bearer ${token}`}})
                    .then((r) => r.json())
                    .then(setFriends);
            }
        });
    };

    const sendFriendRequest = async (toUserId) => {
        try {
            const response = await fetch('/api/friends/requests', {
                method: 'POST', headers: {
                    'Content-Type': 'application/json', Authorization: `Bearer ${token}`,
                }, body: JSON.stringify({addresseeId: toUserId}),
            });

            if (!response.ok) {
                const data = await response.json();
                console.error('Failed to send friend request:', data.message || response.status);
                return;
            }

            setSearchQuery('');
            setSendMessage('Friend request sent!');
            setTimeout(() => setSendMessage(''), 1000);
        } catch (err) {
            console.error('Error sending friend request:', err);
        }
    };

    const removeFriend = async (friendId) => {
        try {
            const resp = await fetch(`/api/friends/${friendId}`, {
                method: 'DELETE', headers: {Authorization: `Bearer ${token}`},
            });

            if (!resp.ok) {
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

            const friendsRes = await fetch('/api/friends', {
                headers: {Authorization: `Bearer ${token}`},
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

    // Loading/Error states
    if (loading) return <div className="loading">Loading profile…</div>;
    if (error) return (<div className="profile-page">
        <div className="profile-card">
            <div className="profile-error">{error}</div>
            <button onClick={() => navigate('/profile')}>
                {isOwnProfile ? 'Please log in' : 'Back to My Profile'}
            </button>
        </div>
    </div>);
    if (!profileUser) return (<div className="loading">
        {isOwnProfile ? 'Please log in to view your profile…' : 'No profile data found'}
    </div>);

    const profileTitle = isOwnProfile ? 'My Profile' : `${profileUser.display_name || profileUser.username}'s Profile`;
    const friendsTitle = isOwnProfile ? 'Your Friends' : 'Their Friends';
    const noFriendsText = isOwnProfile ? 'You have no friends yet' : 'They have no friends yet';
    const favoritesPrefix = isOwnProfile ? 'Favorite' : 'Their Favorite';

    return (<div className="profile-page">
        {/* Back button if viewing someone else’s profile */}
        {!isOwnProfile && (<div className="profile-nav">
            <button onClick={() => navigate('/profile')} className="back-btn">
                ← Back to My Profile
            </button>
        </div>)}

        {/* Profile Card */}
        <div className="profile-card">
            <h2>{profileTitle}</h2>
            <img
                src={profileUser.profile_picture_url || placeholderImg}
                alt="Profile"
                className="user-profile-pic"
            />

            {editError && <div className="profile-error">{editError}</div>}
            {editMessage && <div className="profile-success">{editMessage}</div>}

            {isOwnProfile && isEditing ? (<form onSubmit={handleSubmit} className="profile-form">
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
                <p>Username: {profileUser.username}</p>
                {!isOwnProfile || <p>Email: {profileUser.email}</p>}
                <p>
                    Display Name: {profileUser.display_name || 'Not set'}
                </p>
                <p>Bio: {profileUser.profile_bio || 'No bio provided'}</p>
                <p>
                    Member Since:{' '}
                    {new Date(profileUser.created_at).toLocaleDateString()}
                </p>
                <div className="profile-buttons">
                    {isOwnProfile ? (<>
                        <button onClick={() => setIsEditing(true)}>
                            Edit Profile
                        </button>
                        <button onClick={logout}>Logout</button>
                    </>) : (<button onClick={() => navigate('/profile')}>
                        Back to My Profile
                    </button>)}
                </div>
            </div>)}
        </div>

        {/* Incoming Friend Requests (own profile) */}
        {isOwnProfile && (<section>
            <h3>Incoming Friend Requests</h3>
            <div className="scroll-box">
                {incoming.length ? (incoming.map((r) => (<div key={r.user_id} className="row">
                  <span>
                    {r.display_name} (@{r.username})
                  </span>
                    <div>
                        <button onClick={() => respondRequest(r.user_id, 'accept')}>
                            Accept
                        </button>
                        <button
                            onClick={() => respondRequest(r.user_id, 'reject')}
                        >
                            Reject
                        </button>
                    </div>
                </div>))) : (<p>No pending requests</p>)}
            </div>
        </section>)}

        {/* Friends List */}
        <section>
            <h3>{friendsTitle}</h3>
            <div className="scroll-box friends-list">
                {friends.length ? (friends.map((f) => (<div key={f.user_id} className="friend-row">
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
                    {isOwnProfile && (<button
                        className="btn-small unfriend"
                        onClick={() => removeFriend(f.user_id)}
                    >
                        Unfriend
                    </button>)}
                </div>))) : (<p>{noFriendsText}</p>)}
            </div>
        </section>

        {/* Search Users (own profile) */}
        {isOwnProfile && (<section>
            <h3>Find & Add Friends</h3>
            <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            {sendMessage && <div className="inline-message">{sendMessage}</div>}

            {searchResults.length > 0 && (<div className="scroll-box">
                {searchResults.map((u) => (<div key={u.user_id} className="row">
                  <span>
                    {u.display_name} (@{u.username})
                      {u.friendship_status === 'friend' && (<span
                          className="view-profile-link"
                          onClick={() => navigate(`/profile/${u.user_id}`)}
                          title="View Profile"
                      >
                        {' '}
                          👁️
                      </span>)}
                  </span>
                    {getButtonForUser(u)}
                </div>))}
            </div>)}
        </section>)}

        {/* Favorites Section */}
        <section className="favorites-section">
            {['anime', 'character', 'va'].map((type) => (<div key={type} className="favorite-type-container">
                <h4>
                    {favoritesPrefix}{' '}
                    {type.charAt(0).toUpperCase() + type.slice(1)}s
                </h4>
                <div className="scroll-box fav-grid">
                    {favorites.filter((f) => f.entityType === type).length ? (favorites
                        .filter((f) => f.entityType === type)
                        .map((f) => {
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
                        })) : (<p>No favorite {type}</p>)}
                </div>
            </div>))}
        </section>

        {/* ───────────── Integrate “My Anime Lists” Here ───────────── */}
        {isOwnProfile && (<section className="my-lists-section">
            <MyLists/>
        </section>)}
    </div>);
}
