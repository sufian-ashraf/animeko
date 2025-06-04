import React, {useContext, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {AuthContext} from '../contexts/AuthContext';
import placeholderImg from '../images/image_not_available.jpg';

function ListDetail() {
    const {id} = useParams();
    const {token} = useContext(AuthContext);
    const [list, setList] = useState({title: '', items: []});
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [enterPressed, setEnterPressed] = useState(false);

    useEffect(() => {
        if (!token) return;
        fetch(`/lists/${id}`, {
            headers: {'Authorization': `Bearer ${token}`}
        })
            .then(res => res.json())
            .then(data => setList(data))
            .catch(err => console.error('[ListDetail] Error fetching list:', err));
    }, [id, token]);

    useEffect(() => {
        if (!searchTerm) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const timeout = setTimeout(() => {
            fetch(`/api/animes?title=${encodeURIComponent(searchTerm)}`)
                .then(res => res.json())
                .then(data => {
                    setSearchResults(data);
                    setIsSearching(false);
                })
                .catch(err => {
                    console.error('[Anime Search] Error:', err);
                    setIsSearching(false);
                });
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchTerm]);

    const getImage = (anime) => anime.image_url || placeholderImg;

    const handleAddAnime = async (animeId) => {
        const existingIds = new Set(list.items.map(i => i.anime_id || i.id));
        if (existingIds.has(animeId)) return;

        const updatedIds = [...existingIds, animeId];

        await fetch(`/lists/${id}`, {
            method: 'PUT', headers: {
                'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`
            }, body: JSON.stringify({animeIds: Array.from(updatedIds)})
        });

        const res = await fetch(`/lists/${id}`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        const updatedList = await res.json();
        setList(updatedList);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setEnterPressed(true);
        }
    };

    return (<div className="list-detail-container">
            <h2>{list.title}</h2>

            <div className="anime-items">
                {Array.isArray(list.items) && list.items.length > 0 ? (list.items.map((item) => (
                        <div key={item.anime_id || item.id} className="anime-card">
                            <img src={getImage(item)} alt={item.title}/>
                            <p>{item.title}</p>
                        </div>))) : (<p>This list is empty.</p>)}
            </div>

            <div className="search-add-section">
                <input
                    type="text"
                    placeholder="Search anime by title..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setEnterPressed(false); // Reset preview when typing
                    }}
                    onKeyDown={handleKeyDown}
                    list="anime-suggestions"
                />
                <datalist id="anime-suggestions">
                    {searchResults.map(anime => (<option key={anime.id} value={anime.title}/>))}
                </datalist>

                {isSearching && <p>Searching...</p>}

                {enterPressed && (<div className="search-results">
                        {searchResults.map(anime => (<div key={anime.id} className="anime-card search-card">
                                <p>{anime.title}</p>
                                <button onClick={() => handleAddAnime(anime.id)}>Add to List</button>
                            </div>))}
                    </div>)}
            </div>
        </div>);
}

export default ListDetail;
