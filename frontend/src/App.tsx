import React, { useState, useEffect } from 'react';
import './styles.css';
import { Anime, NewAnime } from './types';

function App() {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [newAnime, setNewAnime] = useState<NewAnime>({ 
    title: '', 
    episodes: 0, 
    rating: 0 
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/anime')
      .then(res => res.json())
      .then((data: Anime[]) => setAnimeList(data))
      .catch(err => console.error("Fetch error:", err));
  }, []);

  const handleAddAnime = () => {
    fetch('http://localhost:5000/api/anime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAnime)
    })
      .then(res => res.json())
      .then((data: Anime) => setAnimeList([...animeList, data]))
      .catch(err => console.error("POST error:", err));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAnime({
      ...newAnime,
      [name]: name === 'title' ? value : Number(value)
    });
  };

  return (
    <div className="app">
      <h1>Anime Database</h1>
      <div className="anime-form">
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={newAnime.title}
          onChange={handleInputChange}
        />
        <input
          type="number"
          name="episodes"
          placeholder="Episodes"
          value={newAnime.episodes || ''}
          onChange={handleInputChange}
        />
        <input
          type="number"
          name="rating"
          placeholder="Rating"
          step="0.1"
          value={newAnime.rating || ''}
          onChange={handleInputChange}
        />
        <button onClick={handleAddAnime}>Add Anime</button>
      </div>
      <ul className="anime-list">
        {animeList.map(anime => (
          <li key={anime.id}>
            <h3>{anime.title}</h3>
            <p>Episodes: {anime.episodes}</p>
            <p>Rating: {anime.rating}/10</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;