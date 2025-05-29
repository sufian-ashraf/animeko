import React, {useEffect, useState} from 'react';

function Home() {
    const [animeList, setAnimeList] = useState([]);
    const [searchCriteria, setSearchCriteria] = useState({
        title: '', genre: '', year: ''
    });
    const [formValues, setFormValues] = useState({
        title: '', genre: '', year: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormValues({
            ...formValues, [name]: value
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const filteredCriteria = Object.fromEntries(Object.entries(searchCriteria).filter(([_, value]) => value !== ''));

                const queryParams = new URLSearchParams(filteredCriteria).toString();
                console.log('Sending request to:', `http://localhost:5000/api/anime?${queryParams}`);

                const response = await fetch(`http://localhost:5000/api/anime?${queryParams}`);

                console.log('Response status:', response.status);

                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }

                const data = await response.json();
                console.log(`Received ${data.length} anime entries`);
                setAnimeList(data);
            } catch (err) {
                console.error("API Error:", err);
                setError(`Failed to fetch anime data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [searchCriteria]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (formValues.year && (isNaN(formValues.year) || formValues.year < 1900 || formValues.year > 2100)) {
            setError("Please enter a valid year between 1900 and 2100");
            return;
        }
        setSearchCriteria({...formValues});
    };

    const handleClear = () => {
        setFormValues({
            title: '', genre: '', year: ''
        });
        setSearchCriteria({
            title: '', genre: '', year: ''
        });
        setError(null);
    };

    return (<div className="home-page">
            <div className="welcome-section">
                <h2>Welcome to AnimeKo</h2>
                <p>Discover and explore your favorite anime series and movies!</p>
            </div>

            <section className="search-section">
                <h3>Search Anime</h3>
                <form onSubmit={handleSearch}>
                    <div className="form-group">
                        <input
                            type="text"
                            name="title"
                            placeholder="Anime Title"
                            value={formValues.title}
                            onChange={handleInputChange}
                            aria-label="Anime Title"
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="text"
                            name="genre"
                            placeholder="Genre"
                            value={formValues.genre}
                            onChange={handleInputChange}
                            aria-label="Genre"
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="number"
                            name="year"
                            placeholder="Year"
                            value={formValues.year}
                            onChange={handleInputChange}
                            min="1900"
                            max="2100"
                            aria-label="Year"
                        />
                    </div>
                    <div className="button-group">
                        <button type="submit">Search</button>
                        <button type="button" onClick={handleClear}>Clear</button>
                    </div>
                </form>
            </section>

            <section className="results-section">
                {loading && <p className="loading-message">Loading...</p>}
                {error && <p className="error-message">{error}</p>}
                {!loading && !error && searchCriteria.title === '' && searchCriteria.genre === '' && searchCriteria.year === '' && (
                    <div className="initial-state">
                        <p>Use the search form above to find anime by title, genre, or year.</p>
                    </div>)}
                {!loading && !error && animeList.length === 0 && (searchCriteria.title !== '' || searchCriteria.genre !== '' || searchCriteria.year !== '') && (
                    <p className="no-results">No anime found. Try different search criteria.</p>)}
                <div className="anime-grid">
                    {animeList.map(anime => (<div key={anime.id} className="anime-card">
                            <h3>{anime.title}</h3>
                            <p><strong>Genre:</strong> {anime.genre || 'Not specified'}</p>
                            <p><strong>Year:</strong> {anime.year || 'Not specified'}</p>
                            {anime.description && (<p><strong>Description:</strong> {anime.description}</p>)}
                        </div>))}
                </div>
            </section>
        </div>);
}

export default Home;