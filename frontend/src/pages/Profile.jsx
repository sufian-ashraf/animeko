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
                    // For own profile, we already have the user data
                    // Just ensure we have the latest favorites and friends
                    const [favsRes, friendsRes] = await Promise.all([
                        fetch('/api/favorites', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }),
                        fetch('/api/friends', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                    ]);

                    if (favsRes.ok) {
                        const favsData = await favsRes.json();
                        setFavorites(Array.isArray(favsData) ? favsData : []);
                    }

                    
                    if (friendsRes.ok) {
                        const friendsData = await friendsRes.json();
                        setFriends(Array.isArray(friendsData) ? friendsData : []);
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
                    setFriends(data.friends || []);
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
        let isMounted = true;
        
        const searchUsers = async () => {
            if (!isOwnProfile) {
                console.log('Not own profile, skipping search');
                return;
            }
            
            const query = searchQuery.trim();
            if (!query) {
                console.log('Empty search query, clearing results');
                setSearchResults([]);
                return;
            }

            console.log('Searching for users with query:', query);
            setError('');
            
            try {
                console.log('Sending search request with token:', token ? 'Token exists' : 'No token');
                
                const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'include',
                    mode: 'cors',
                    redirect: 'follow'
                });
                
                console.log('Search response status:', response.status);
                console.log('Search response headers:', Object.fromEntries([...response.headers.entries()]));
                
                if (response.redirected) {
                    console.warn('Request was redirected to:', response.url);
                }
                
                if (!isMounted) return;
                
                if (!response.ok) {
                    let errorMessage = 'Failed to search users';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                        console.error('Search API error:', errorData);
                    } catch (e) {
                        console.error('Failed to parse error response:', e);
                    }
                    
                    setError(errorMessage);
                    setSearchResults([]);
                    return;
                }


                const data = await response.json();
                console.log('Search results received:', data);
                
                if (!isMounted) return;
                
                if (!Array.isArray(data)) {
                    console.error('Invalid search results format:', data);
                    setError('Invalid response format from server');
                    setSearchResults([]);
                    return;
                }
                
                if (data.length === 0) {
                    console.log('No users found for query:', query);
                }
                
                setSearchResults(data);
            } catch (error) {
                if (!isMounted) return;
                console.error('Search error:', error);
                setError('Failed to connect to server');
                setSearchResults([]);
            }
        };

        // Add debounce to prevent too many requests
        const debounceTimer = setTimeout(() => {
            searchUsers();
        }, 300);

        // Cleanup function
        return () => {
            isMounted = false;
            clearTimeout(debounceTimer);
        };
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
    const respondRequest = async (requesterId, action) => {
        try {
            console.log(`Responding to friend request from ${requesterId} with action: ${action}`);
            const response = await fetch(`/api/friends/requests/${requesterId}/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            const responseData = await response.json().catch(() => ({}));
            console.log('Response data:', responseData);
            
            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to respond to friend request');
            }

            // Update UI to remove the request
            setIncoming(prev => {
                const updated = prev.filter((r) => r.user_id !== requesterId);
                console.log('Updated incoming requests:', updated);
                return updated;
            });

            // If request was accepted, update friends list
            if (action === 'accept') {
                try {
                    const friendsResponse = await fetch('/api/friends', {
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include'
                    });
                    
                    if (friendsResponse.ok) {
                        const friendsData = await friendsResponse.json();
                        console.log('Updated friends list:', friendsData);
                        setFriends(friendsData);
                    } else {
                        console.error('Failed to fetch updated friends list:', friendsResponse.status);
                    }
                } catch (err) {
                    console.error('Error updating friends list:', err);
                }
            }
        } catch (error) {
            console.error('Error responding to friend request:', error);
            setError(error.message || 'Failed to respond to friend request');
        }
    };

    const sendFriendRequest = async (toUserId) => {
        try {
            console.log('Sending friend request to user ID:', toUserId);
            const response = await fetch('/api/friends/requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
                body: JSON.stringify({
                    addresseeId: toUserId
                }),
            });

            const responseData = await response.json().catch(() => ({}));
            console.log('Send friend request response:', responseData);

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to send friend request');
            }

            // Update UI to show request sent
            setSearchResults(prev => {
                const updated = prev.map(user => 
                    user.user_id === toUserId 
                        ? { ...user, friendship_status: 'request_sent' } 
                        : user
                );
                console.log('Updated search results:', updated);
                return updated;
            });

            setSearchQuery('');
            setSendMessage('Friend request sent!');
            setTimeout(() => setSendMessage(''), 3000);
        } catch (error) {
            console.error('Error sending friend request:', error);
            setError(error.message || 'Failed to send friend request');
        }
    };

    const removeFriend = async (friendId) => {
        if (!window.confirm('Are you sure you want to remove this friend?')) {
            return;
        }

        try {
            console.log('Removing friend with ID:', friendId);
            const response = await fetch(`/api/friends/${friendId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            const responseData = await response.json().catch(() => ({}));
            console.log('Remove friend response:', responseData);

            if (!response.ok) {
                throw new Error(responseData.message || `Server responded with ${response.status}`);
            }

            // Update friends list
            try {
                const friendsResponse = await fetch('/api/friends', {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                if (friendsResponse.ok) {
                    const friendsData = await friendsResponse.json();
                    console.log('Updated friends list after removal:', friendsData);
                    setFriends(friendsData);
                    setSendMessage('Friend removed successfully');
                    setTimeout(() => setSendMessage(''), 3000);
                } else {
                    throw new Error('Failed to fetch updated friends list');
                }
            } catch (err) {
                console.error('Error updating friends list after removal:', err);
                setError('Friend removed, but failed to update list');
            }
        } catch (error) {
            console.error('Remove friend failed:', error);
            setError(error.message || 'Failed to remove friend');
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
    if (loading) return <div className="spinner-container">
                        <div className="spinner"></div>
                    </div>;
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
                    {profileUser.created_at}
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
        {isOwnProfile && (
            <section className="my-lists-section">
                <h3>My Anime Lists</h3>
                <MyLists userId={profileUser.user_id} token={token} />
            </section>
        )}
    </div>);
}
