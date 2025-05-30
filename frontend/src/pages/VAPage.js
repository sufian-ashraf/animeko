import {Link, useParams} from 'react-router-dom';
import {useEffect, useState} from 'react';
import placeholder from '../images/image_not_available.jpg';
import '../styles/VAPage.css';

export default function VAPage() {
    const {vaId} = useParams();
    const [va, setVa] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`/api/va/${vaId}`)
            .then(r => {
                if (!r.ok) throw new Error(`Status ${r.status}`);
                return r.json();
            })
            .then(setVa)
            .catch(err => {
                console.error('Fetch VA error:', err);
                setError('Failed to load voice actor');
            });
    }, [vaId]);

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
                    <h2 className="va-name">{name}</h2>
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
                                voiced <Link to={`/character/${characterId}`}
                                             className="role-char-link">{characterName}</Link>
                            </p>
                        </div>))}
                </div>) : (<p className="no-roles">No roles found for this actor.</p>)}
        </div>);
}
