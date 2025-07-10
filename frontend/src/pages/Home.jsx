// src/pages/Home.js
import React, {useEffect, useState} from 'react';
import AnimeCard from '../components/AnimeCard'; // Import the new component

// import the extracted styles
import '../styles/Home.css';

function Home() {
    const [animeList, setAnimeList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sortField, setSortField] = useState('name'); // Actual sort field, triggers fetch
    const [sortOrder, setSortOrder] = useState('asc'); // Actual sort order, triggers fetch
    const [pendingSortField, setPendingSortField] = useState('name'); // For dropdown selection
    const [pendingSortOrder, setPendingSortOrder] = useState('asc'); // For dropdown selection

    useEffect(() => {
        const fetchAllAnime = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/animes?sortField=${sortField}&sortOrder=${sortOrder}`); // Fetch all anime with sorting
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
    }, [sortField, sortOrder]);

    const handleApplySort = () => {
        setSortField(pendingSortField);
        setSortOrder(pendingSortOrder);
    };

    return (
        <div className="home-page">
            <div className="welcome-section">
                <h2>Welcome to AnimeKo</h2>
                <p>Discover and explore your favorite anime series and movies!</p>
            </div>

            <section className="results-section">
                <h3>All Anime</h3>
                <div className="sort-controls-container">
                    <div className="sort-controls">
                        <label htmlFor="sortField">Sort by:</label>
                        <select id="sortField" value={pendingSortField} onChange={(e) => setPendingSortField(e.target.value)}>
                            <option value="name">Name</option>
                            <option value="rating">Rating</option>
                            <option value="release_date">Release Date</option>
                            <option value="rank">Rank</option>
                        </select>

                        <label htmlFor="sortOrder">Order:</label>
                        <select id="sortOrder" value={pendingSortOrder} onChange={(e) => setPendingSortOrder(e.target.value)}>
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>
                    </div>
                    <button onClick={handleApplySort}>Apply</button>
                </div>
                {loading && (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                        <p>Loading anime...</p>
                    </div>
                )}
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
