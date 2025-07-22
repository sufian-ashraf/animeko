// src/pages/AdminDashboard.js

import React, {useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import '../styles/AdminDashboard.css';

// Tab components
import AnimeTab from '../components/admin/AnimeTab';
import GenreTab from '../components/admin/GenreTab';
import CompanyTab from '../components/admin/CompanyTab';
import VATab from '../components/admin/VATab';
import CharactersTab from '../components/admin/CharactersTab';
import EpisodesTab from '../components/admin/EpisodesTab';

export default function AdminDashboard() {
    const {user} = useAuth();
    const {isDarkMode} = useTheme();
    const [activeTab, setActiveTab] = useState('anime');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Debug logging
    // console.log('AdminDashboard - Current user:', user);
    // console.log('AdminDashboard - User is admin:', user?.is_admin);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'anime':
                return <AnimeTab searchQuery={searchQuery}/>;
            case 'genre':
                return <GenreTab searchQuery={searchQuery}/>;
            case 'company':
                return <CompanyTab searchQuery={searchQuery}/>;
            case 'va':
                return <VATab searchQuery={searchQuery}/>;
            case 'characters':
                return <CharactersTab searchQuery={searchQuery}/>;
            case 'episodes':
                return <EpisodesTab searchQuery={searchQuery}/>;
            default:
                return <div>Select a tab to begin</div>;
        }
    };

    return (
        <div className={`admin-container ${isDarkMode ? 'dark-mode' : ''}`}>
            <h1>Admin Dashboard</h1>

            {/* Navigation Tabs */}
            <div className="admin-tabs">
                <button
                    className={`tab-btn ${activeTab === 'anime' ? 'active' : ''}`}
                    onClick={() => setActiveTab('anime')}
                >
                    Anime
                </button>
                <button
                    className={`tab-btn ${activeTab === 'genre' ? 'active' : ''}`}
                    onClick={() => setActiveTab('genre')}
                >
                    Genres
                </button>
                <button
                    className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`}
                    onClick={() => setActiveTab('company')}
                >
                    Companies
                </button>
                <button
                    className={`tab-btn ${activeTab === 'va' ? 'active' : ''}`}
                    onClick={() => setActiveTab('va')}
                >
                    Voice Actors
                </button>
                <button
                    className={`tab-btn ${activeTab === 'characters' ? 'active' : ''}`}
                    onClick={() => setActiveTab('characters')}
                >
                    Characters
                </button>
                <button
                    className={`tab-btn ${activeTab === 'episodes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('episodes')}
                >
                    Episodes
                </button>
            </div>

            {/* Search Bar */}
            <div className="admin-search">
                <input
                    type="text"
                    className="form-control"
                    placeholder={
                        activeTab === 'episodes'
                            ? 'Search episodes by anime or title...'
                            : `Search ${activeTab}...`
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Messages */}
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Tab Content */}
            <div className="admin-content">
                {loading ? (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    renderTabContent()
                )}
            </div>
        </div>
    );
}