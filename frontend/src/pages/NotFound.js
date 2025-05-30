import React from 'react';
import {Link} from 'react-router-dom';

function NotFound() {
    return (<div className="not-found-page">
        <div className="not-found-container">
            <div className="error-code">
                <h1>404</h1>
            </div>
            <div className="error-message">
                <h2>Page Not Found</h2>
                <p>Sorry, the page you're looking for doesn't exist.</p>
                <p>It might have been moved, deleted, or you entered the wrong URL.</p>
            </div>
            <div className="error-actions">
                <Link to="/" className="home-button">
                    Go Back Home
                </Link>
                <button
                    onClick={() => window.history.back()}
                    className="back-button"
                >
                    Go Back
                </button>
            </div>
            <div className="anime-themed-message">
                <p>🎌 Even the best anime detectives can't find this page! 🕵️‍♂️</p>
            </div>
        </div>
    </div>);
}

export default NotFound;