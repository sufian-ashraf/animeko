// src/pages/ListSearch.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ListSearch.css';

export default function ListSearch() {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLists = useCallback(async (keyword) => {
        setLoading(true);
        setError(null);
        const endpoint = keyword
            ? `/api/lists/search/${encodeURIComponent(keyword)}`
            : '/api/lists/recent'; // Use the new 'recent' endpoint

        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setLists(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
            setLists([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch recent lists on initial load
    useEffect(() => {
        fetchLists('');
    }, [fetchLists]);

    // Handle search form submission
    const handleSearch = (e) => {
        e.preventDefault();
        fetchLists(searchTerm.trim());
    };

    return (
        <div className="list-search-container">
            <h2>Find Anime Lists</h2>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    placeholder="Search by keyword..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <button type="submit" className="search-button">Search</button>
            </form>

            {/* Loading and Error States */}
            {loading && (
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>
            )}
            {error && <p className="error-message">Error: {error}</p>}

            {/* List Results */}
            {!loading && !error && (
                <div className="lists-grid">
                    {lists.length > 0 ? (
                        lists.map(list => (
                            <div key={list.id} className="list-card">
                                <Link to={`/lists/${list.id}`} className="list-link">
                                    <h3 className="list-title">{list.title}</h3>
                                    <p className="list-owner">by {list.owner_username}</p>
                                    <p className="list-item-count">{list.item_count} items</p>
                                    <p className="list-created-date">
                                        Created: {new Date(list.created_at).toLocaleDateString()}
                                    </p>
                                </Link>
                            </div>
                        ))
                    ) : (
                        <p>No lists found.</p>
                    )}
                </div>
            )}
        </div>
    );
}