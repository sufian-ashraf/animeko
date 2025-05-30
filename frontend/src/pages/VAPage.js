// src/pages/VAPage.js
import {Link, useParams} from 'react-router-dom';
import {useEffect, useState} from 'react';
import '../styles/VAPage.css';

export default function VAPage() {
    const {vaId} = useParams();
    const [va, setVa] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`/api/va/${vaId}`)
            .then((r) => {
                if (!r.ok) throw new Error(`Status ${r.status}`);
                return r.json();
            })
            .then(setVa)
            .catch((err) => {
                console.error('Fetch VA error:', err);
                setError('Failed to load voice actor');
            });
    }, [vaId]);

    if (error) return <div style={{color: 'red'}}>{error}</div>;
    if (!va) return <div>Loading voice actor…</div>;

    // roles might be an empty array, but never undefined
    const {name, bio, roles = []} = va;

    return (<div>
            <h2>{name}</h2>
            {bio && <p>{bio}</p>}

            <h3>Roles</h3>
            {roles.length > 0 ? (<ul>
                    {roles.map(({animeId, animeTitle, characterId, characterName}) => (
                        <li key={`${animeId}-${characterId}`}>
                            In <Link to={`/anime/${animeId}`}>{animeTitle}</Link>, voiced{' '}
                            <Link to={`/character/${characterId}`}>{characterName}</Link>
                        </li>))}
                </ul>) : (<p>No roles found for this actor.</p>)}
        </div>);
}
