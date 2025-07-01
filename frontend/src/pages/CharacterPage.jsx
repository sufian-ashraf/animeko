// src/pages/CharacterPage.js
import {Link, useParams} from 'react-router-dom';
import {useEffect, useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import placeholder from '../images/image_not_available.jpg';
import '../styles/CharacterPage.css';

export default function CharacterPage() {
    const {charId} = useParams();
    const {token} = useAuth();
    const [char, setChar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // favorite state
    const [isFavorite, setIsFavorite] = useState(false);
    const [favLoading, setFavLoading] = useState(false);

    // fetch character details
    useEffect(() => {
        fetch(`/api/character/${charId}`)
            .then(res => {
                if (!res.ok) throw new Error(res.status);
                return res.json();
            })
            .then(data => {
                setChar(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch character error:', err);
                setError('Failed to load character');
                setLoading(false);
            });
    }, [charId]);

    // fetch favorites
    useEffect(() => {
        if (!token) return;
        fetch('/api/favorites', {
            headers: {Authorization: `Bearer ${token}`}
        })
            .then(r => r.json())
            .then(favs => {
                setIsFavorite(favs.some(f => f.entityType === 'character' && +f.entityId === +charId));
            })
            .catch(console.error);
    }, [charId, token]);

    // toggle favorite
    const toggleFavorite = () => {
        if (!token) return;
        setFavLoading(true);
        fetch('/api/favorites', {
            method: 'POST', headers: {
                'Content-Type': 'application/json', Authorization: `Bearer ${token}`
            }, body: JSON.stringify({entityType: 'character', entityId: +charId})
        })
            .then(r => r.json())
            .then(data => setIsFavorite(data.favorite))
            .catch(console.error)
            .finally(() => setFavLoading(false));
    };

    if (loading) return <div className="char-loading">Loading character…</div>;
    if (error) return <div className="char-error">{error}</div>;
    if (!char) return <div className="char-error">Character not found</div>;

    const {name, description, vaId, vaName = 'Unknown', animeList = []} = char;

    return (<div className="character-page">
        {/* Header Card */}
        <div className="character-header-card">
            <img
                src={placeholder}
                alt={`${name} placeholder`}
                className="character-photo"
            />
            <div className="character-meta">
                <div className="character-meta-header">
                    <h2 className="character-name">{name}</h2>
                    <button
                        className={`favorite-btn ${isFavorite ? 'favorited' : ''}`}
                        onClick={toggleFavorite}
                        disabled={favLoading}
                    >
                        {favLoading ? '…' : isFavorite ? '★ Unfavorite' : '☆ Favorite'}
                    </button>
                </div>
                {description && <p className="character-desc">{description}</p>}
                <p className="character-va">
                    <strong>Voice Actor:</strong>{' '}
                    {vaId ? <Link to={`/va/${vaId}`} className="va-link">{vaName}</Link> :
                        <span className="va-unknown">Unknown</span>}
                </p>
            </div>
        </div>

        {/* Anime Appearances */}
        <h3 className="appearances-heading">Appears In</h3>
        {animeList.length > 0 ? (<div className="appearances-grid">
            {animeList.map(({animeId, animeTitle}) => (<Link
                to={`/anime/${animeId}`}
                key={animeId}
                className="appearance-card"
            >
                <img
                    src={placeholder}
                    alt={`${animeTitle} cover`}
                    className="appearance-thumb"
                />
                <p className="appearance-title">{animeTitle}</p>
            </Link>))}
        </div>) : (<p className="no-appearances">No anime appearances found.</p>)}
    </div>);
}
