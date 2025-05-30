import {Link, useParams} from 'react-router-dom';
import {useEffect, useState} from 'react';
import placeholder from '../images/image_not_available.jpg';
import '../styles/GenrePage.css';

export default function GenrePage() {
    const {genreId} = useParams();
    const [genre, setGenre] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`/api/genre/${genreId}`)
            .then(res => {
                if (!res.ok) throw new Error(`Status ${res.status}`);
                return res.json();
            })
            .then(data => {
                setGenre(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch genre error:', err);
                setError('Failed to load genre');
                setLoading(false);
            });
    }, [genreId]);

    if (loading) return <div className="genre-loading">Loading genre…</div>;
    if (error) return <div className="genre-error">{error}</div>;
    if (!genre) return <div className="genre-error">Genre not found</div>;

    const {name, description, animeList = []} = genre;

    return (<div className="genre-page">
        {/* Header Card */}
        <div className="genre-header-card">
            <div className="genre-meta">
                <h2 className="genre-name">{name}</h2>
                {description && <p className="genre-desc">{description}</p>}
            </div>
        </div>

        {/* Anime Grid */}
        <h3 className="genre-anime-heading">Anime in “{name}”</h3>
        {animeList.length > 0 ? (<div className="genre-anime-grid">
            {animeList.map(({animeId, title}) => (<Link
                to={`/anime/${animeId}`}
                key={animeId}
                className="genre-anime-card"
            >
                <img
                    src={placeholder}
                    alt={`${title} placeholder`}
                    className="anime-thumb"
                />
                <p className="anime-title">{title}</p>
            </Link>))}
        </div>) : (<p className="no-anime">No anime found for this genre.</p>)}
    </div>);
}
