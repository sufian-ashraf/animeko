import {Link, useParams} from 'react-router-dom';
import {useEffect, useState} from 'react';
import placeholder from '../images/image_not_available.jpg';
import '../styles/AnimePage.css';

export default function AnimePage() {
    const {animeId} = useParams();
    const [anime, setAnime] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`/api/anime/${animeId}`)
            .then(r => {
                if (!r.ok) throw new Error(`Status ${r.status}`);
                return r.json();
            })
            .then(data => setAnime(data))
            .catch(err => {
                console.error('Fetch anime error:', err);
                setError('Failed to load anime');
            });
    }, [animeId]);

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
                <h2 className="anime-name">{title}</h2>
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
                {cast.map(({characterId, characterName, vaId, vaName}) => (<div key={characterId} className="cast-card">
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
