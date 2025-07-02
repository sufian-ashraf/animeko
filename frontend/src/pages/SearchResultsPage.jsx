import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import '../styles/Home.css'; // Reusing Home.css for now, can create a specific one later

function SearchResultsPage() {
    const [animeList, setAnimeList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const fetchSearchResults = async () => {
            setLoading(true);
            setError(null);
            const queryParams = new URLSearchParams(location.search);
            const title = queryParams.get('title') || '';
            const genre = queryParams.get('genre') || '';
            const year = queryParams.get('year') || '';

            const filteredCriteria = {};
            if (title) filteredCriteria.title = title;
            if (genre) filteredCriteria.genre = genre;
            if (year) filteredCriteria.year = year;

            const queryString = new URLSearchParams(filteredCriteria).toString();

            try {
                const response = await fetch(`/api/animes?${queryString}`);
                if (!response.ok) throw new Error(`Status ${response.status}`);
                const data = await response.json();
                setAnimeList(data);
            } catch (err) {
                setError(`Failed to fetch search results: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [location.search]);

    return (
        <div className="home-page"> {/* Reusing home-page class for styling */}
            <section className="results-section">
                <h3>Search Results</h3>
                {loading && <p className="loading-message">Loading...</p>}
                {error && <p className="error-message">{error}</p>}
                {!loading && !error && animeList.length === 0 && (
                    <p className="no-results">No anime found for your search criteria.</p>
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

export default SearchResultsPage;
