// src/pages/AnimePage.js

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import placeholder from '../images/image_not_available.jpg';
import ListCard from '../components/ListCard';
import TrailerModal from '../components/TrailerModal';
import '../styles/AnimePage.css';

const roundToHalf = (num) => Math.round(num * 2) / 2;

// Valid library statuses
const validLibraryStatuses = ['Watching', 'Completed', 'Planned to Watch', 'Dropped', 'On Hold'];

export default function AnimePage() {
    const { animeId } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();

    // Anime data state
    const [anime, setAnime] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Favorite state
    const [isFavorite, setIsFavorite] = useState(false);
    const [favLoading, setFavLoading] = useState(false);

    // Anime Library state
    const [libraryStatus, setLibraryStatus] = useState(null);
    const [libraryLoading, setLibraryLoading] = useState(true);
    const [libraryError, setLibraryError] = useState(null);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    
    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [userReview, setUserReview] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 0, content: '' });
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState(null);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    
    // Rating and rank state
    const [averageRating, setAverageRating] = useState(null);
    const [rank, setRank] = useState(null);
    
    // Lists containing this anime
    const [containingLists, setContainingLists] = useState({
        data: [],
        loading: false,
        error: null,
        pagination: {
            currentPage: 0,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: 6
        }
    });

    // Episodes state
    const [episodesList, setEpisodesList] = useState([]);
    const [episodesLoading, setEpisodesLoading] = useState(false);
    const [episodesError, setEpisodesError] = useState(null);

    // Tab state
    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'episodes'
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);


    // Debug: Log auth status
    useEffect(() => {
        console.log('User auth status:', { user, hasToken: !!token });
    }, [user, token]);

    /**
     * Fetches lists containing the current anime
     * @param {number} page - Page number to fetch
     * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
     * @returns {Promise<{data: Array, pagination: Object}>} The lists data and pagination info
     */
    const fetchAnimeLists = async (page = 1, signal = null) => {
        if (!animeId) {
            console.error('No animeId provided');
            return { data: [], pagination: {} };
        }

        const apiPath = `/api/lists/anime/${animeId}?page=${page}&limit=6`;
        const url = apiPath;

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers,
                credentials: 'include',
                mode: 'cors',
                signal
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({
                    message: `HTTP ${response.status} ${response.statusText}`
                }));
                throw new Error(error.message || 'Failed to fetch lists');
            }

            const result = await response.json();
            
            // Normalize response format
            if (Array.isArray(result)) {
                return {
                    data: result,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: result.length,
                        itemsPerPage: result.length
                    }
                };
            }
            
            if (result?.data && Array.isArray(result.data)) {
                return {
                    data: result.data,
                    pagination: result.pagination || {
                        currentPage: page,
                        totalPages: 1,
                        totalItems: result.data.length,
                        itemsPerPage: 6
                    }
                };
            }


            throw new Error('Unexpected API response format');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error fetching anime lists:', error);
                throw error;
            }
            return { data: [], pagination: {} };
        }
    };

    // Fetch lists containing this anime
    const fetchContainingLists = async (page = 1) => {
        if (!animeId) return;
        
        try {
            setContainingLists(prev => ({
                ...prev,
                loading: true,
                error: null
            }));

            const { data, pagination } = await fetchAnimeLists(page);
            console.log('fetchContainingLists - Data received from fetchAnimeLists:', data);
            console.log('fetchContainingLists - Pagination received from fetchAnimeLists:', pagination);
            
            setContainingLists(prev => {
                const newState = {
                    ...prev,
                    data: page === 1 ? data : [...prev.data, ...data],
                    loading: false,
                    pagination: {
                        ...prev.pagination,
                        ...pagination
                    }
                };
                console.log('fetchContainingLists - New containingLists state:', newState);
                return newState;
            });
        } catch (error) {
            console.error('Failed to load anime lists:', error);
            setContainingLists(prev => ({
                ...prev,
                loading: false,
                error: 'Failed to load lists containing this anime',
                data: page === 1 ? [] : prev.data // Clear data only on first page error
            }));
        }
    };

    // Initial fetch when animeId changes
    useEffect(() => {
        const controller = new AbortController();
        
        const loadLists = async () => {
            if (!animeId) {
                console.error('No animeId available');
                return;
            }
            
            console.log('useEffect - Calling fetchContainingLists for anime ID:', animeId);
            await fetchContainingLists(1);
        };
        
        loadLists();
        
        return () => {
            controller.abort();
        };
    }, [animeId]);

    // Handle load more
    const handleLoadMore = () => {
        const nextPage = containingLists.pagination.currentPage + 1;
        fetchContainingLists(nextPage);
    };

    // ───────────────────────────────────────────────────
    // 1) Fetch anime details
    // ───────────────────────────────────────────────────
    useEffect(() => {
        fetch(`/api/anime/${animeId}`)
            .then((r) => {
                if (!r.ok) throw new Error(`Status ${r.status}`);
                return r.json();
            })
            .then(setAnime)
            .catch((err) => {
                console.error('Fetch anime error:', err);
                setError('Failed to load anime');
            });
    }, [animeId]);

    // ───────────────────────────────────────────────────
    // 2) Fetch average rating & rank
    // ───────────────────────────────────────────────────
    useEffect(() => {
        fetch(`/api/anime/${animeId}/rating`)
            .then((r) => {
                if (!r.ok) {
                    if (r.status !== 404) console.error('Rating fetch error', r.status);
                    return {averageRating: null, rank: null};
                }
                return r.json();
            })
            .then((data) => {
                setAverageRating(data.averageRating);
                setRank(data.rank);
            })
            .catch((err) => {
                console.error('Fetch rating error:', err);
                setAverageRating(null);
                setRank(null);
            });
    }, [animeId]);

    // ───────────────────────────────────────────────────
    // 3) Fetch favorites (to show/unshow the star)
    // ───────────────────────────────────────────────────
    useEffect(() => {
        if (!token) return;
        fetch('/api/favorites', {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then((r) => r.json())
            .then((favs) => {
                const exists = favs.some((f) => f.entityType === 'anime' && +f.entityId === +animeId);
                setIsFavorite(exists);
            })
            .catch(console.error);
    }, [animeId, token]);

    // ───────────────────────────────────────────────────
    // 4) Fetch anime library status
    // ───────────────────────────────────────────────────
    useEffect(() => {
        if (!token) {
            setLibraryStatus(null);
            setLibraryLoading(false);
            return;
        }

        let isMounted = true;
        setLibraryLoading(true);
        
        fetch(`/api/anime-library/${animeId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => {
                if (!r.ok) {
                    if (r.status === 404) return { status: null }; // Not in library
                    throw new Error(`Status ${r.status}`);
                }
                return r.json();
            })
            .then((data) => {
                if (isMounted) {
                    setLibraryStatus(data.status);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    console.error('Fetch library status error:', err);
                    setLibraryError('Failed to load library status.');
                    setLibraryStatus(null);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLibraryLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [animeId, token]);

    // Toggle favorite
    const handleToggleFavorite = () => {
        if (!token) return;
        setFavLoading(true);
        fetch('/api/favorites', {
            method: 'POST', headers: {
                'Content-Type': 'application/json', Authorization: `Bearer ${token}`,
            }, body: JSON.stringify({entityType: 'anime', entityId: +animeId}),
        })
            .then((r) => r.json())
            .then((data) => {
                setIsFavorite(data.favorite);
            })
            .catch(console.error)
            .finally(() => setFavLoading(false));
    };

    // Handle adding anime to library
    const handleAddToLibrary = async (status) => {
        if (!token || libraryLoading) return;
        setLibraryLoading(true);
        try {
            const res = await fetch('/api/anime-library', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ animeId: +animeId, status }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to add anime to library');
            }
            setLibraryStatus(status);
            setShowStatusDropdown(false);
            setLibraryError(null);
        } catch (err) {
            console.error('Error adding to library:', err);
            setLibraryError(err.message || 'Network error. Please try again.');
        } finally {
            setLibraryLoading(false);
        }
    };

    // Handle updating anime status in library
    const handleUpdateLibraryStatus = async (newStatus) => {
        if (!token || libraryLoading) return;
        setLibraryLoading(true);
        try {
            const res = await fetch(`/api/anime-library/${animeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update library status');
            }
            setLibraryStatus(newStatus);
            setShowStatusDropdown(false);
            setLibraryError(null);
        } catch (err) {
            console.error('Error updating library status:', err);
            setLibraryError(err.message || 'Network error. Please try again.');
        } finally {
            setLibraryLoading(false);
        }
    };

    // Handle removing anime from library
    const handleRemoveFromLibrary = async () => {
        if (!token || libraryLoading) return;
        setLibraryLoading(true);
        try {
            const res = await fetch(`/api/anime-library/${animeId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to remove anime from library');
            }
            setLibraryStatus(null);
            setShowStatusDropdown(false);
            setLibraryError(null);
        } catch (err) {
            console.error('Error removing from library:', err);
            setLibraryError(err.message || 'Network error. Please try again.');
        } finally {
            setLibraryLoading(false);
        }
    };

    // ───────────────────────────────────────────────────
    // 4) Fetch reviews
    // ───────────────────────────────────────────────────
    useEffect(() => {
        fetch(`/api/anime/${animeId}/reviews`)
            .then((r) => {
                if (!r.ok) throw new Error(`Status ${r.status}`);
                return r.json();
            })
            .then((allReviews) => {
                const arr = Array.isArray(allReviews) ? allReviews : [];
                setReviews(arr);

                if (user && arr.length > 0) {
                    const mine = arr.find((r) => r.user_id === user.user_id) || null;
                    setUserReview(mine);
                    if (mine) {
                        setReviewForm({rating: mine.rating, content: mine.content});
                    }
                }
            })
            .catch((err) => {
                console.error('Fetch reviews error:', err);
                setReviews([]);
            });
    }, [animeId, user]);

    // ───────────────────────────────────────────────────
    // 5) Fetch episodes (only when episodes tab is active)
    // ───────────────────────────────────────────────────
    useEffect(() => {
        // Only fetch episodes when the episodes tab is active
        if (activeTab !== 'episodes') return;
        
        setEpisodesLoading(true);
        setEpisodesError(null);
        
        fetch(`/api/episodes/anime/${animeId}`)
            .then((r) => {
                if (!r.ok) throw new Error(`Status ${r.status}`);
                return r.json();
            })
            .then((episodesData) => {
                const arr = Array.isArray(episodesData) ? episodesData : [];
                setEpisodesList(arr);
            })
            .catch((err) => {
                console.error('Fetch episodes error:', err);
                setEpisodesError('Failed to load episodes');
                setEpisodesList([]);
            })
            .finally(() => {
                setEpisodesLoading(false);
            });
    }, [animeId, activeTab]);

    // Handle star‐click & comment change
    const handleStarClick = (starIndex) => {
        setReviewForm((form) => ({...form, rating: starIndex}));
    };

    const handleReviewChange = (e) => {
        const {name, value} = e.target;
        setReviewForm((form) => ({
            ...form, [name]: name === 'rating' ? Number(value) : value,
        }));
    };

    // Submit or update review
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!token) {
            setReviewError('You must be logged in to post a review.');
            return;
        }
        const {rating, content} = reviewForm;
        if (rating < 1 || rating > 5) {
            setReviewError('Rating must be between 1 and 5 stars.');
            return;
        }

        setReviewError('');
        setReviewLoading(true);

        try {
            const res = await fetch(`/api/anime/${animeId}/review`, {
                method: 'POST', headers: {
                    'Content-Type': 'application/json', Authorization: `Bearer ${token}`,
                }, body: JSON.stringify({rating, content: content.trim()}),
            });
            if (!res.ok) {
                const payload = await res.json();
                throw new Error(payload.message || 'Failed to save review');
            }
            const saved = await res.json();
            setUserReview(saved);

            // Re‐fetch rating & rank
            const ratingRes = await fetch(`/api/anime/${animeId}/rating`);
            const ratingData = await ratingRes.json();
            setAverageRating(ratingData.averageRating);
            setRank(ratingData.rank);

            // Re‐fetch all reviews
            const allRes = await fetch(`/api/anime/${animeId}/reviews`);
            const allData = await allRes.json();
            setReviews(Array.isArray(allData) ? allData : []);
        } catch (err) {
            console.error('Submit review error:', err);
            setReviewError(err.message || 'Failed to save review');
        } finally {
            setReviewLoading(false);
        }
    };

    // Handle delete review
    const handleDeleteReview = async () => {
        if (!token || !userReview) {
            setReviewError('You must be logged in and have a review to delete.');
            return;
        }

        setReviewError('');
        setReviewLoading(true);

        try {
            const res = await fetch(`/api/anime/${animeId}/review`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                const payload = await res.json();
                throw new Error(payload.message || 'Failed to delete review');
            }

            setUserReview(null); // Clear user's review
            setReviewForm({ rating: 0, content: '' }); // Reset form

            // Re-fetch rating & rank
            const ratingRes = await fetch(`/api/anime/${animeId}/rating`);
            const ratingData = await ratingRes.json();
            setAverageRating(ratingData.averageRating);
            setRank(ratingData.rank);

            // Re-fetch all reviews
            const allRes = await fetch(`/api/anime/${animeId}/reviews`);
            const allData = await allRes.json();
            setReviews(Array.isArray(allData) ? allData : []);
        } catch (err) {
            console.error('Delete review error:', err);
            setReviewError(err.message || 'Failed to delete review');
        } finally {
            setReviewLoading(false);
        }
    };

    if (error) return <div className="anime-error">{error}</div>;
    if (!anime) return <div className="spinner-container">
                        <div className="spinner"></div>
                        <p>Loading anime...</p>
                    </div>;

    const {title, alternative_title, synopsis, company, genres = [], cast = [], episodes, season, release_date, trailer_url_yt_id} = anime;

    // Format release date
    const formatReleaseDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    // Format episode duration from seconds to minutes:seconds
    const formatDuration = (seconds) => {
        if (!seconds) return 'N/A';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Format air date for episodes
    const formatAirDate = (dateString) => {
        if (!dateString) return 'TBA';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (<div className="anime-page">
        {/* ───── Header Card ──────────────── */}
        <div className="anime-header-card">
            <img
                src={anime.imageUrl || placeholder}
                alt={`${title} cover`}
                className="anime-photo"
            />
            <div className="anime-meta">
                <div className="anime-meta-header">
                    <h2 className="anime-name">{title}</h2>
                    {user && (
                        <button
                            className={`favorite-btn ${isFavorite ? 'favorited' : ''}`}
                            onClick={handleToggleFavorite}
                            disabled={favLoading}
                        >
                                                        <div className="favorite-icon">{isFavorite ? '❤️' : '🤍'}</div>
                            <div className="favorite-text">{favLoading ? '…' : isFavorite ? 'Remove from Favorite' : 'Add to Favorites'}</div>
                        </button>
                    )}

                    {user && (
                        <div className="anime-library-controls">
                            {libraryLoading ? (
                                <span className="loading-text">Loading library status...</span>
                            ) : libraryError ? (
                                <span className="error-text">{libraryError}</span>
                            ) : (
                                <div className="library-controls-container">
                                    {!libraryStatus ? (
                                        <button
                                            className="add-to-library-btn"
                                            onClick={() => handleAddToLibrary("Planned to Watch")}
                                        >
                                            Add to Library
                                        </button>
                                    ) : (
                                        <>
                                            <div className="status-controls">
                                                <select
                                                    value={libraryStatus}
                                                    onChange={(e) => handleUpdateLibraryStatus(e.target.value)}
                                                    className="status-select"
                                                >
                                                    {validLibraryStatuses.map((status) => (
                                                        <option key={status} value={status}>
                                                            {status}
                                                        </option>
                                                    ))}
                                                </select>
                                                {libraryStatus && (
                                                    <button
                                                        className="remove-from-library-btn"
                                                        onClick={handleRemoveFromLibrary}
                                                    >
                                                        Remove from Library
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ───── Average Rating & Rank ──────────── */}
                <div className="anime-average-rating">
                    {averageRating === null ? (<span className="no-rating">No ratings yet.</span>) : (
                        <div className="stars-and-rank">
                            {(() => {
                                const rounded = roundToHalf(averageRating);
                                const fullStars = Math.floor(rounded);
                                const halfStar = rounded - fullStars === 0.5;

                                return (<span className="star-row">
                      {[1, 2, 3, 4, 5].map((i) => {
                          if (i <= fullStars) return <span key={i}>★</span>;
                          if (i === fullStars + 1 && halfStar) return <span key={i}>☆</span>;
                          return <span key={i}>☆</span>;
                      })}
                                    <span className="avg-number">({rounded.toFixed(1)})</span>
                    </span>);
                            })()}
                            {rank !== null && <span className="anime-rank"># {rank}</span>}
                        </div>)}
                </div>
                {/* ─────────────────────────────────────────── */}

                {/* Alternative Title */}
                {alternative_title && (
                    <p className="anime-alt-title">
                        <strong>Alternative Title:</strong> {alternative_title}
                    </p>
                )}

                {/* Anime Details Row */}
                <div className="anime-details-row">
                    {episodes && (
                        <div className="anime-detail-item">
                            <strong>Episodes:</strong> {episodes}
                        </div>
                    )}
                    {season && (
                        <div className="anime-detail-item">
                            <strong>Season:</strong> {season}
                        </div>
                    )}
                    {release_date && (
                        <div className="anime-detail-item">
                            <strong>Release Date:</strong> {formatReleaseDate(release_date)}
                        </div>
                    )}
                </div>

                {synopsis && <p className="anime-desc">{synopsis}</p>}

                {trailer_url_yt_id ? (
                    <button onClick={() => setIsTrailerOpen(true)} className="watch-trailer-btn">
                        Watch Trailer
                    </button>
                ) : (
                    <p className="no-trailer">Trailer not available</p>
                )}

                {company && (<p className="anime-company">
                    <strong>Company:</strong>{' '}
                    <Link to={`/company/${company.companyId}`} className="link">
                        {company.name}
                    </Link>
                </p>)}

                {genres.length > 0 && (<p className="anime-genres">
                    <strong>Genres:</strong>{' '}
                    {genres.map((g, i) => (<span key={g.genreId}>
                  <Link to={`/genre/${g.genreId}`} className="link">
                    {g.name}
                  </Link>
                        {i < genres.length - 1 && ', '}
                </span>))}
                </p>)}
            </div>
        </div>

        {/* ──────── Tab Navigation ──────── */}
        <div className="anime-tabs">
            <div className="tab-nav">
                <button 
                    className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                >
                    Details
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'episodes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('episodes')}
                >
                    Episodes
                </button>
            </div>
        </div>

        {/* ──────── Tab Content ──────── */}
        <div className="tab-content">
            {activeTab === 'details' && (
                <div className="details-tab">
                    {/* ───────── Cast Grid ─────────── */}
                    <h3 className="cast-heading">Cast &amp; Voice Actors</h3>
                    {cast.length > 0 ? (<div className="cast-grid">
                        {cast.map(({characterId, characterName, vaId, vaName, characterImageUrl, vaImageUrl}) => (
                            <div key={characterId} className="cast-card">
                                <div style={{ textAlign: 'center' }}>
                                    <img
                                        src={characterImageUrl || placeholder}
                                        alt={characterName}
                                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = placeholder;
                                        }}
                                    />
                                </div>
                                <div className="cast-info">
                                    <Link to={`/character/${characterId}`} className="link">
                                        <strong>{characterName}</strong>
                                    </Link>
                                    {vaName && (
                                        <div className="va-info">
                                            <span>voiced by</span>
                                            <Link to={`/va/${vaId}`} className="va-link">
                                                <div className="va-thumb-container">
                                                    <img
                                                        src={vaImageUrl || placeholder}
                                                        alt={vaName}
                                                        className="va-thumb"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = placeholder;
                                                        }}
                                                    />
                                                </div>
                                                <span>{vaName}</span>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>))}
                    </div>) : (<p className="no-cast">No cast information available.</p>)}

                    {/* ──────── Lists Section ──────── */}
                    <div className="anime-section">
                        <h3>Appears in {containingLists?.pagination?.totalItems || 0} List{containingLists?.pagination?.totalItems !== 1 ? 's' : ''}</h3>
                        {!containingLists ? (
                            <div className="loading">Loading lists...</div>
                        ) : containingLists.loading && containingLists.pagination?.currentPage === 1 ? (
                            <div className="loading">Loading lists...</div>
                        ) : containingLists.error ? (
                            <div className="error">{containingLists.error}</div>
                        ) : containingLists.data?.length > 0 ? (
                            <>
                                <div className="lists-grid">
                                    {containingLists.data.map((list) => (
                                        <ListCard key={list.id} list={list} />
                                    ))}
                                </div>
                                {containingLists.pagination.currentPage < containingLists.pagination.totalPages && (
                                    <button 
                                        className="load-more-btn"
                                        onClick={handleLoadMore}
                                        disabled={containingLists.loading}
                                    >
                                        {containingLists.loading ? 'Loading...' : 'Load More'}
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="no-lists">This anime doesn't appear in any lists yet.</div>
                        )}
                    </div>

                    {/* ───────────── Reviews Section ───────────────── */}
                    <section className="reviews-section">
                        <h3>Reviews</h3>

                        {/* Your Review Form */}
                        <div className="your-review-form">
                            <h4>Your Review</h4>
                            {user ? (
                                <form onSubmit={handleSubmitReview}>
                                    <div className="star-selection">
                                        {[1, 2, 3, 4, 5].map((i) => (<span
                                            key={i}
                                            className={i <= reviewForm.rating ? 'star selected' : 'star'}
                                            onClick={() => handleStarClick(i)}
                                        >
                                            ★
                                        </span>))}
                                    </div>
                                    <label>
                                        Comment:
                                        <textarea
                                            name="content"
                                            rows="4"
                                            value={reviewForm.content}
                                            onChange={handleReviewChange}
                                            disabled={reviewLoading}
                                        />
                                    </label>
                                    {reviewError && <div className="review-error">{reviewError}</div>}
                                    <button type="submit" disabled={reviewLoading}>
                                        {userReview ? 'Update Review' : 'Submit Review'}
                                    </button>
                                    {userReview && (
                                        <button
                                            type="button"
                                            className="delete-review-btn"
                                            onClick={handleDeleteReview}
                                            disabled={reviewLoading}
                                        >
                                            Delete Review
                                        </button>
                                    )}
                                </form>
                            ) : (
                                <div className="login-prompt">
                                    <Link to="/login">Log in</Link> to submit reviews and ratings.
                                </div>
                            )}
                        </div>

                        {/* All Reviews List */}
                        <div className="all-reviews-list">
                            <h4>All Reviews</h4>
                            {reviews.length === 0 ? (
                                <p className="no-reviews">No reviews yet. Be the first!</p>) : (reviews.map((r) => (
                                <div key={r.review_id} className="review-card">
                                    <div className="reviewer-info">
                                        <img
                                            src={r.avatarUrl || placeholder}
                                            alt={`${r.username} avatar`}
                                            className="reviewer-avatar"
                                        />
                                        <span className="reviewer-name">{r.username}</span>
                                        <span className="review-timestamp">
                                {new Date(r.created_at).toLocaleString()}
                              </span>
                                    </div>
                                    <div className="review-body">
                              <span className="review-rating">
                                {Array.from({length: r.rating}, (_, idx) => (<span key={idx}>★</span>))}
                                  {Array.from({length: 5 - r.rating}, (_, idx) => (<span key={idx}>☆</span>))}
                              </span>
                                        <p className="review-content">{r.content}</p>
                                    </div>
                                </div>)))}
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'episodes' && (
                <div className="episodes-tab">
                    {/* ──────── Episodes Section ──────── */}
                    <h3 className="episodes-heading">Episodes ({episodesList.length})</h3>
                    {episodesLoading ? (
                        <div className="loading">Loading episodes...</div>
                    ) : episodesError ? (
                        <div className="error">{episodesError}</div>
                    ) : episodesList.length > 0 ? (
                        <div className="episodes-grid">
                            {episodesList.map((episode) => (
                                <div key={episode.episode_id} className="episode-card">
                                    <div className="episode-header">
                                        <span className="episode-number">Episode {episode.episode_number}</span>
                                        {episode.premium_only && user && user.subscription_status && (
                                            <span className="premium-indicator">PRO</span>
                                        )}
                                    </div>
                                    {episode.title && (
                                        <h4 className="episode-title">{episode.title}</h4>
                                    )}
                                    <div className="episode-details">
                                        <div className="episode-detail">
                                            <span className="detail-label">Duration:</span>
                                            <span className="detail-value">{formatDuration(episode.duration_seconds)}</span>
                                        </div>
                                        <div className="episode-detail">
                                            <span className="detail-label">Air Date:</span>
                                            <span className="detail-value">{formatAirDate(episode.air_date)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-episodes">
                            <p>No episodes available for this anime yet.</p>
                            <p>Check back later for updates!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
        {isTrailerOpen && (
            <TrailerModal videoId={trailer_url_yt_id} onClose={() => setIsTrailerOpen(false)} />
        )}
    </div>
  );
}
