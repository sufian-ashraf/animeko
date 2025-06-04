// src/pages/ListSearch.js
import React, {useContext, useState} from 'react';
import {Link} from 'react-router-dom';
import {AuthContext} from '../contexts/AuthContext';
import '../styles/ListSearch.css';

export default function ListSearch() {
    const {token} = useContext(AuthContext);
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!q.trim() || !token) return;
        setSearching(true);
        try {
            const res = await fetch(`/lists/search?q=${encodeURIComponent(q)}`, {
                headers: {Authorization: `Bearer ${token}`},
            });
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const data = await res.json(); // [ {id, title, user_id}, … ]
            setResults(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('ListSearch error:', err);
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    return (<div className="list-search-container">
            <h2>Search Custom Lists</h2>
            <form onSubmit={handleSearch} className="list-search-form">
                <input
                    type="text"
                    placeholder="Search list titles..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="list-search-input"
                />
                <button type="submit" disabled={searching}>
                    {searching ? 'Searching…' : 'Search'}
                </button>
            </form>

            {results.length > 0 ? (<ul className="search-results-ul">
                    {results.map((lst) => (<li key={lst.id}>
                            <Link to={`/my-lists/${lst.id}`}>{lst.title}</Link>
                            <span className="owner-text"> by user #{lst.user_id}</span>
                        </li>))}
                </ul>) : q.trim() && !searching ? (<p>No lists found matching “{q}.”</p>) : null}
        </div>);
}
