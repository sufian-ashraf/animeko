import React from 'react';
import { Link } from 'react-router-dom';
import placeholder from '../images/image_not_available.jpg';
import '../styles/AnimeCard.css'; // Assuming you'll create this CSS file

function AnimeCard({ anime }) {
    return (
        <Link to={`/anime/${anime.id}`} className="anime-card-link">
            <div className="anime-card">
                <img
                    src={placeholder}
                    alt="No cover available"
                    className="anime-card-image"
                />
                <h3 className="anime-card-title">{anime.title}</h3>
                <p className="anime-card-genre">
                    <strong>Genre:</strong> {anime.genre || 'Not specified'}
                </p>
                <p className="anime-card-year">
                    <strong>Year:</strong> {anime.year || 'Not specified'}
                </p>
                {anime.description && (
                    <p className="anime-card-description">
                        <strong>Description:</strong> {anime.description}
                    </p>
                )}
            </div>
        </Link>
    );
}

export default AnimeCard;
