// src/pages/VAPage.js
import {Link, useParams} from 'react-router-dom';
import {useEffect, useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import placeholder from '../images/image_not_available.jpg';
import '../styles/VAPage.css';

export default function VAPage() {
    const {vaId} = useParams();
    const {token} = useAuth();
    const [va, setVa] = useState(null);
    const [error, setError] = useState(null);

    // favorite state
    const [isFavorite, setIsFavorite] = useState(false);
    const [favLoading, setFavLoading] = useState(false);

    // fetch VA details
    useEffect(() => {
        fetch(`/api/voice-actors/${vaId}`)
            .then(r => {
                if (!r.ok) throw new Error(r.status);
                return r.json();
            })
            .then(setVa)
            .catch(err => {
                console.error('Fetch VA error:', err);
                setError('Failed to load voice actor');
            });
    }, [vaId]);

    // fetch favorites
    useEffect(() => {
        if (!token) return;
        fetch('/api/favorites', {
            headers: {Authorization: `Bearer ${token}`}
        })
            .then(r => r.json())
            .then(favs => {
                setIsFavorite(favs.some(f => f.entityType === 'va' && +f.entityId === +vaId));
            })
            .catch(console.error);
    }, [vaId, token]);

    // toggle favorite
    const toggleFavorite = () => {
        if (!token) return;
        setFavLoading(true);
        fetch('/api/favorites', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}`
            }, 
            body: JSON.stringify({ 
                entityType: 'va',
                entityId: +vaId 
            })
        })
            .then(r => r.json())
            .then(data => setIsFavorite(data.favorite))
            .catch(console.error)
            .finally(() => setFavLoading(false));
    };

    if (error) return <div className="va-error">{error}</div>;
    if (!va) return <div className="va-loading">Loading voice actor…</div>;

    const {name, bio, roles = []} = va;

    return (<div className="va-page">
        <div className="va-header-card">
            <img
                src={placeholder}
                alt={`${name} placeholder`}
                className="va-photo"
            />
            <div className="va-info">
                <div className="va-info-header">
                    <h2 className="va-name">{name}</h2>
                    <button
                        className={`favorite-btn ${isFavorite ? 'favorited' : ''}`}
                        onClick={toggleFavorite}
                        disabled={favLoading}
                    >
                        {favLoading ? '…' : isFavorite ? '★ Unfavorite' : '☆ Favorite'}
                    </button>
                </div>
                {bio && <p className="va-bio">{bio}</p>}
            </div>
        </div>

        <h3 className="va-roles-heading">Roles</h3>
        {roles.length > 0 ? (<div className="va-roles-grid">
            {roles.map(({animeId, animeTitle, characterId, characterName}) => (
                <div key={`${animeId}-${characterId}`} className="va-role-card">
                    <Link to={`/anime/${animeId}`} className="role-anime-link">
                        <strong>{animeTitle}</strong>
                    </Link>
                    <p>
                        voiced{' '}
                        <Link to={`/character/${characterId}`} className="role-char-link">
                            {characterName}
                        </Link>
                    </p>
                </div>))}
        </div>) : (<p className="no-roles">No roles found for this actor.</p>)}
    </div>);
}
