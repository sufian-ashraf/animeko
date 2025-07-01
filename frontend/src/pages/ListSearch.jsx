// src/pages/ListSearch.js
import React, {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import '../styles/ListSearch.css';

export default function ListSearch() {
    const {token} = useAuth();
    const [lists, setLists] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchLists = async (keyword = '') => {
        setLoading(true);
        setError('');
        try {
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const endpoint = keyword && keyword.trim() !== ''
                ? `/api/lists/search/${encodeURIComponent(keyword.trim())}`
                : '/api/lists/all';

            const response = await fetch(`${baseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    error: `HTTP error! status: ${response.status}`
                }));
                throw new Error(errorData.error || `Error: ${response.status}`);
            }

            const data = await response.json();
            setLists(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching lists:', err);
            setError(err.message || 'Failed to fetch lists. Please try again.');
            setLists([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLists();
    }, []);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        fetchLists(value);
    };

    const handleListClick = (listId) => {
        navigate(`/my-lists/${listId}`);
    };

    return (
        <div className="list-search-container">
            <h2>Search Custom Lists</h2>
            <div className="search-input-container">
                <input
                    type="text"
                    placeholder="Search lists by title..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-input"
                />
            </div>
            {loading && <p className="loading">Loading...</p>}
            {error && <p className="error">{error}</p>}
            {!loading && !error && (
                <div className="list-results">
                    {lists.length === 0 ? (
                        <div className="no-results">No lists found.</div>
                    ) : (
                        <div className="list-cards-grid">
                            {lists.map(list => (
                                <div
                                    key={list.id}
                                    onClick={() => handleListClick(list.id)}
                                    className="list-card"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleListClick(list.id);
                                        }
                                    }}
                                >
                                    <h3 className="list-title">
                                        <Link to={`/my-lists/${list.id}`}>{list.title}</Link>
                                    </h3>
                                    <div className="list-meta">
                                        <span className="owner-text">by user #{list.user_id}</span>
                                        {list.created_at && (
                                            <span className="date-text">
                                                {new Date(list.created_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}