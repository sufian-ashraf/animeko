// src/pages/AnimePage.js

import {Link, useParams} from 'react-router-dom';
import {useEffect, useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import placeholder from '../images/image_not_available.jpg';
import '../styles/AnimePage.css';

const roundToHalf = num => Math.round(num * 2) / 2;

export default function AnimePage() {
    const {animeId} = useParams();
    const {token, user} = useAuth();
    const [anime, setAnime] = useState(null);
    const [error, setError] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favLoading, setFavLoading] = useState(false);
    // ───── NEW: state for average & rank ─────
    const [averageRating, setAverageRating] = useState(null);
    const [rank, setRank] = useState(null);
    // ─────────────────────────────────────────
    // Review state
    const [reviews, setReviews] = useState([]);
    const [userReview, setUserReview] = useState(null);
    const [reviewForm, setReviewForm] = useState({rating: 5, content: ''});
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState('');

    // Fetch anime details
    useEffect(() => {
        fetch(`/api/anime/${animeId}`)
            .then(r => {
                if (!r.ok) throw new Error(`Status ${r.status}`);
                return r.json();
            })
            .then(setAnime)
            .catch(err => {
                console.error('Fetch anime error:', err);
                setError('Failed to load anime');
            });
    }, [animeId]);

    // Fetch average rating & rank
    useEffect(() => {
        fetch(`/api/anime/${animeId}/rating`)
            .then(r => {
                if (!r.ok) {
                    // If 404, no anime; else just swallow errors silently
                    if (r.status !== 404) console.error('Rating fetch error', r.status);
                    return {averageRating: null, rank: null};
                }
                return r.json();
            })
            .then(data => {
                // data = { averageRating: FLOAT|null, rank: INT|null }
                setAverageRating(data.averageRating);
                setRank(data.rank);
            })
            .catch(err => {
                console.error('Fetch rating error:', err);
                setAverageRating(null);
                setRank(null);
            });
    }, [animeId]);

    // Fetch favorites
    useEffect(() => {
        if (!token) return;
        fetch('/api/favorites', {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then(r => r.json())
            .then(favs => {
                const exists = favs.some(f => f.entityType === 'anime' && +f.entityId === +animeId);
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
            .then(r => r.json())
            .then(data => {
                setIsFavorite(data.favorite);
            })
            .catch(console.error)
            .finally(() => setFavLoading(false));
    };

    // Fetch reviews
    useEffect(() => {
        fetch(`/api/anime/${animeId}/reviews`)
            .then(r => {
                if (!r.ok) throw new Error(`Status ${r.status}`);
                return r.json();
            })
            .then(allReviews => {
                // If the response was not an array, coerce to empty
                const arr = Array.isArray(allReviews) ? allReviews : [];
                setReviews(arr);

                // If logged in, check if this user has a review already
                if (user && arr.length > 0) {
                    const mine = arr.find(r => r.user_id === user.user_id) || null;
                    setUserReview(mine);
                    if (mine) {
                        setReviewForm({rating: mine.rating, content: mine.content});
                    }
                }
            })
            .catch(err => {
                console.error('Fetch reviews error:', err);
                setReviews([]); // ensure it's always an array
            });
    }, [animeId, user]);

    // Handle star‐click & comment change
    const handleStarClick = starIndex => {
        // starIndex is 1..5
        setReviewForm(form => ({...form, rating: starIndex}));
    };

    // Handle form change
    const handleReviewChange = e => {
        const {name, value} = e.target;
        setReviewForm(form => ({
            ...form, [name]: name === 'rating' ? Number(value) : value,
        }));
    };

    // Submit or update review
    const handleSubmitReview = async e => {
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
        {/* Header Card */}
        <div className="anime-header-card">
            <img
                src={placeholder}
                alt={`${title} placeholder`}
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

                {/* ───── NEW: Display Average Rating & Rank ───── */}
                <div className="anime-average-rating">
                    {averageRating === null ? (<span className="no-rating">No ratings yet.</span>) : (
                        <div className="stars-and-rank">
                            {/* Round to nearest half for display */}
                            {(() => {
                                const rounded = roundToHalf(averageRating);
                                const fullStars = Math.floor(rounded);
                                const halfStar = rounded - fullStars === 0.5;
                                return (<span className="star‐row">
                      {[1, 2, 3, 4, 5].map(i => {
                          if (i <= fullStars) {
                              return <span key={i}>★</span>;
                          } else if (i === fullStars + 1 && halfStar) {
                              return <span key={i}>☆</span>;
                              /* There’s no true “half‐star” in plain Unicode; you can
                                 swap in an SVG or a half-star character if you wish.
                                 For simplicity, we show an empty star here. */
                          } else {
                              return <span key={i}>☆</span>;
                          }
                      })}
                                    <span className="avg-number">
                        ({rounded.toFixed(1)})
                      </span>
                    </span>);
                            })()}
                            {rank !== null && (<span className="anime-rank"># {rank}</span>)}
                        </div>)}
                </div>
                {/* ───────────────────────────────────────────── */}

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

        {/* Cast Grid (unchanged) */}
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

        {/* ─────────────────────────────────────
          Reviews Section with Star Widget
         ───────────────────────────────────── */}
        <section className="reviews-section">
            <h3>Reviews</h3>

            {/* 1) Your Review Form, with 5 clickable stars */}
            <div className="your-review-form">
                <h4>Your Review</h4>
                <form onSubmit={handleSubmitReview}>
                    <div className="star-selection">
                        {[1, 2, 3, 4, 5].map(i => (<span
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
                    {reviewError && (<div className="review-error">{reviewError}</div>)}
                    <button type="submit" disabled={reviewLoading}>
                        {userReview ? 'Update Review' : 'Submit Review'}
                    </button>
                </form>
            </div>

            {/* 2) List All Reviews (unchanged except avatar logic) */}
            <div className="all-reviews-list">
                <h4>All Reviews</h4>
                {reviews.length === 0 ? (
                    <p className="no-reviews">No reviews yet. Be the first!</p>) : (reviews.map(r => (
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
    </div>);
}
