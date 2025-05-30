import {Link, useParams} from 'react-router-dom';
import {useEffect, useState} from 'react';
import '../styles/AnimePage.css';

export default function AnimePage() {
    const {animeId} = useParams();
    const [anime, setAnime] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchAnime() {
            try {
                const response = await fetch(`/api/anime/${animeId}`);
                const text = await response.text();
                console.log("Raw response text:", text);
                const data = JSON.parse(text);
                setAnime(data);
            } catch (err) {
                console.error("Fetch error:", err);
                setError("Failed to load anime data");
            }
        }

        fetchAnime();
    }, [animeId]);

    if (error) return <div style={{color: 'red'}}>{error}</div>;
    if (!anime) return <div>Loading anime…</div>;

    return (<div className="anime-page">
            <h2 className="anime-title">{anime.title}</h2>
            <p className="anime-synopsis">{anime.synopsis}</p>

            <div className="anime-meta">
                {anime.company && (<p>
                        <strong>Company:</strong>{' '}
                        <Link to={`/company/${anime.company.companyId}`} className="anime-link">
                            {anime.company.name}
                        </Link>
                    </p>)}

                {anime.genres && anime.genres.length > 0 && (<div className="anime-genres">
                        <strong>Genres:</strong>{' '}
                        {anime.genres.map((g, i) => (<span key={g.genreId}>
                                <Link to={`/genre/${g.genreId}`} className="anime-link">{g.name}</Link>
                                {i < anime.genres.length - 1 && ', '}
                            </span>))}
                    </div>)}
            </div>

            {anime.cast && anime.cast.length > 0 && (<div className="anime-cast">
                    <h3>Cast</h3>
                    <ul>
                        {anime.cast.map(member => (<li key={member.characterId}>
                                <Link to={`/character/${member.characterId}`} className="anime-link">
                                    {member.characterName}
                                </Link>{' '}
                                voiced by{' '}
                                <Link to={`/va/${member.vaId}`} className="anime-link">
                                    {member.vaName}
                                </Link>
                            </li>))}
                    </ul>
                </div>)}
        </div>);
}
