// src/pages/CharacterPage.js
import {Link, useParams} from 'react-router-dom';
import {useEffect, useState} from 'react';
import '../styles/CharacterPage.css';

export default function CharacterPage() {
    const {charId} = useParams();
    const [char, setChar] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`/api/character/${charId}`)
            .then(res => {
                if (!res.ok) throw new Error(`Status ${res.status}`);
                return res.json();
            })
            .then(setChar)
            .catch(err => {
                console.error('Fetch character error:', err);
                setError('Failed to load character');
            });
    }, [charId]);

    if (error) return <div style={{color: 'red'}}>{error}</div>;
    if (!char) return <div>Loading character…</div>;

    // Destructure with defaults
    const {
        name, description, vaId, vaName = 'Unknown', animeList = [],
    } = char;

    return (<div>
            <h2>{name}</h2>
            {description && <p>{description}</p>}

            <div>
                <strong>Voiced by:</strong>{' '}
                {vaId ? (<Link to={`/va/${vaId}`}>{vaName}</Link>) : (<span>—</span>)}
            </div>

            <h3>Appears in:</h3>
            {animeList.length > 0 ? (<ul>
                    {animeList.map((a) => (<li key={a.animeId}>
                            <Link to={`/anime/${a.animeId}`}>{a.animeTitle}</Link>
                        </li>))}
                </ul>) : (<p>This character does not appear in any anime records.</p>)}
        </div>);
}
