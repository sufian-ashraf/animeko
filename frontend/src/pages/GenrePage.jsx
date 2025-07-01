import { Link, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import placeholder from '../images/image_not_available.jpg';
import '../styles/GenrePage.css';

export default function GenrePage() {
    const { genreId } = useParams();
    const navigate = useNavigate();
    const [genre, setGenre] = useState(null);
    const [animeList, setAnimeList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // 1. Fetch genre details
                const genreRes = await fetch(`/api/genre/${genreId}`);
                if (!genreRes.ok) throw new Error(`Status ${genreRes.status}`);
                const genreData = await genreRes.json();
                
                // 2. Fetch anime by genre
                const animeRes = await fetch(`/api/animes?genre=${encodeURIComponent(genreData.name)}`);
                if (!animeRes.ok) throw new Error(`Status ${animeRes.status}`);
                const animeData = await animeRes.json();
                
                setGenre(genreData);
                setAnimeList(Array.isArray(animeData) ? animeData : []);
                setLoading(false);
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Failed to load genre data');
                setLoading(false);
            }
        };

        fetchData();
    }, [genreId, navigate]);

    if (loading) return <div className="genre-loading">Loading genre…</div>;
    if (error) return <div className="genre-error">{error}</div>;
    if (!genre) return <div className="genre-error">Genre not found</div>;

    const { name, description } = genre;

    return (<div className="genre-page">
        {/* Header Card */}
        <div className="genre-header-card">
            <div className="genre-meta">
                <h2 className="genre-name">{name}</h2>
                {description && <p className="genre-desc">{description}</p>}
            </div>
        </div>

        {/* Anime Grid */}
        {animeList.length > 0 ? (
            <div className="genre-anime-grid">
                {animeList.map((anime) => (
                    <Link
                        to={`/anime/${anime.id || anime.anime_id}`}
                        key={anime.id || anime.anime_id}
                        className="genre-anime-card"
                    >
                        <div className="anime-card-content">
                            <img
                                src={placeholder}
                                alt={`${anime.title} placeholder`}
                                className="anime-thumb"
                            />
                            <div className="anime-details">
                                <h4 className="anime-title">{anime.title}</h4>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        ) : (
            <p className="no-anime">No anime found for this genre.</p>
        )}
    </div>);
}
