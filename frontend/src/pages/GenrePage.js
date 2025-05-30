// src/pages/GenrePage.js
import {Link, useParams} from 'react-router-dom';
import {useEffect, useState} from 'react';
import '../styles/GenrePage.css';

export default function GenrePage() {
    const {genreId} = useParams();
    const [genre, setGenre] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`/api/genre/${genreId}`)
            .then(res => {
                if (!res.ok) throw new Error(`Status ${res.status}`);
                return res.json();
            })
            .then(setGenre)
            .catch(err => {
                console.error('Fetch genre error:', err);
                setError('Failed to load genre');
            });
    }, [genreId]);

    if (error) return <div style={{color: 'red'}}>{error}</div>;
    if (!genre) return <div>Loading genre…</div>;

    const {name, description, animeList = []} = genre;

    return (<div>
            <h2>Genre: {name}</h2>
            {description && <p>{description}</p>}

            <h3>Anime in this genre</h3>
            {animeList.length > 0 ? (<ul>
                    {animeList.map(a => (<li key={a.animeId}>
                            <Link to={`/anime/${a.animeId}`}>{a.title}</Link>
                        </li>))}
                </ul>) : (<p>No anime found for this genre.</p>)}
        </div>);
}
