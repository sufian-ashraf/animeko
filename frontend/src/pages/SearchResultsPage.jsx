import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import '../styles/Home.css'; // Reusing Home.css for now, can create a specific one later

function SearchResultsPage() {
    const [animeList, setAnimeList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const location = useLocation();
    const [sortField, setSortField] = useState('name'); // Actual sort field, triggers fetch
    const [sortOrder, setSortOrder] = useState('asc'); // Actual sort order, triggers fetch
    const [pendingSortField, setPendingSortField] = useState('name'); // For dropdown selection
    const [pendingSortOrder, setPendingSortOrder] = useState('asc'); // For dropdown selection

    const handleApplySort = () => {
        setSortField(pendingSortField);
        setSortOrder(pendingSortOrder);
    };

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
                const response = await fetch(`/api/animes?${queryString}&sortField=${sortField}&sortOrder=${sortOrder}`);
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
    }, [location.search, sortField, sortOrder]);

    return (
        <div className="home-page"> {/* Reusing home-page class for styling */}
            <section className="results-section">
                <h3>Search Results</h3>
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
                    <button onClick={handleApplySort}>Apply Sort</button>
                </div>
                {loading && (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                        <p>Loading search results...</p>
                    </div>
                )}
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
