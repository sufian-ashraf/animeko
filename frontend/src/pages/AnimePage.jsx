// src/pages/AnimePage.js

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import placeholder from '../images/image_not_available.jpg';
import '../styles/AnimePage.css';

const roundToHalf = (num) => Math.round(num * 2) / 2;

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
    
    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [userReview, setUserReview] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
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
        if (!content.trim()) {
            setReviewError('Review content cannot be empty.');
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

    if (error) return <div className="anime-error">{error}</div>;
    if (!anime) return <div className="anime-loading">Loading anime…</div>;

    const {title, synopsis, company, genres = [], cast = []} = anime;

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
                    <button
                        className={`favorite-btn ${isFavorite ? 'favorited' : ''}`}
                        onClick={handleToggleFavorite}
                        disabled={favLoading}
                    >
                        {favLoading ? '…' : isFavorite ? '★ Unfavorite' : '☆ Favorite'}
                    </button>
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

                {synopsis && <p className="anime-desc">{synopsis}</p>}

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

        {/* ───────── Cast Grid ─────────── (unchanged) */}
        <h3 className="cast-heading">Cast &amp; Voice Actors</h3>
        {cast.length > 0 ? (<div className="cast-grid">
            {cast.map(({characterId, characterName, vaId, vaName}) => (
                <div key={characterId} className="cast-card">
                    <img
                        src={placeholder}
                        alt={`${characterName} placeholder`}
                        className="character-thumb"
                    />
                    <div className="cast-info">
                        <Link to={`/character/${characterId}`} className="link">
                            <strong>{characterName}</strong>
                        </Link>
                        <p>
                            voiced by{' '}
                            <Link to={`/va/${vaId}`} className="link">
                                {vaName}
                            </Link>
                        </p>
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
                            <Link to={`/my-lists/${list.id}`} key={list.id} className="list-card">
                                <div className="list-card-header">
                                    <h4 className="list-card-title">{list.title}</h4>
                                    <span className="list-item-count">{list.item_count} items</span>
                                </div>
                                <div className="list-card-footer">
                                    <span className="list-owner">By {list.owner_username}</span>
                                    <span className="list-date">
                                        {new Date(list.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </Link>
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
                </form>
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
  );
}
