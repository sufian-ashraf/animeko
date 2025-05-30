// src/pages/AnimePage.js
import {Link, useParams} from 'react-router-dom';
import {useEffect, useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import placeholder from '../images/image_not_available.jpg';
import '../styles/AnimePage.css';

export default function AnimePage() {
    const {animeId} = useParams();
    const {token} = useAuth();
    const [anime, setAnime] = useState(null);
    const [error, setError] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favLoading, setFavLoading] = useState(false);

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

    // Fetch current favorites and check if this anime is already favorited
    useEffect(() => {
        if (!token) return;
        fetch('/api/favorites', {
            headers: {Authorization: `Bearer ${token}`}
        })
            .then(r => r.json())
            .then(favs => {
                const exists = favs.some(f => f.entityType === 'anime' && +f.entityId === +animeId);
                setIsFavorite(exists);
            })
            .catch(console.error);
    }, [animeId, token]);

    // Toggle favorite status
    const handleToggleFavorite = () => {
        if (!token) return;
        setFavLoading(true);
        fetch('/api/favorites', {
            method: 'POST', headers: {
                'Content-Type': 'application/json', Authorization: `Bearer ${token}`
            }, body: JSON.stringify({
                entityType: 'anime', entityId: +animeId
            })
        })
            .then(r => r.json())
            .then(data => {
                // data.favorite === true if now favorited, false if unfavorited
                setIsFavorite(data.favorite);
            })
            .catch(err => {
                console.error('Favorite toggle error:', err);
            })
            .finally(() => setFavLoading(false));
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

        {/* Cast Grid */}
        <h3 className="cast-heading">Cast & Voice Actors</h3>
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
    </div>);
}
