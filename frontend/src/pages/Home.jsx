// src/pages/Home.js
import React, {useEffect, useState} from 'react';
import AnimeCard from '../components/AnimeCard'; // Import the new component

// import the extracted styles
import '../styles/Home.css';

function Home() {
    const [animeList, setAnimeList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllAnime = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/animes`); // Fetch all anime for the home page
                if (!response.ok) throw new Error(`Status ${response.status}`);
                const data = await response.json();
                setAnimeList(data);
            } catch (err) {
                setError(`Failed to fetch anime: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchAllAnime();
    }, []);

    return (
        <div className="home-page">
            <div className="welcome-section">
                <h2>Welcome to AnimeKo</h2>
                <p>Discover and explore your favorite anime series and movies!</p>
            </div>

            <section className="results-section">
                <h3>All Anime</h3>
                {loading && <p className="loading-message">Loading...</p>}
                {error && <p className="error-message">{error}</p>}
                {!loading && !error && animeList.length === 0 && (
                    <p className="no-results">No anime available.</p>
                )}

                <div className="anime-grid">
                    {animeList.map(anime => (
                        <AnimeCard key={anime.id} anime={anime} />
                    ))}
                </div>
            </section>
        </div>
    );
}

export default Home;
