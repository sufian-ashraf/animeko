import React, {useState} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import '../styles/Navigation.css';

function Navigation() {
    const {user, logout, loading, isAdmin} = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [searchTitle, setSearchTitle] = useState('');

    // ✅ Hide navbar until auth loading finishes
    if (loading) return null;

    const handleLogout = () => {
        logout();
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTitle.trim()) {
            navigate(`/search-results?title=${encodeURIComponent(searchTitle.trim())}`);
            setSearchTitle(''); // Clear search input after navigating
        }
    };

    return (<nav className="top-nav">
        <Link to="/" className="nav-link">Home</Link>

        <form onSubmit={handleSearch} className="search-bar">
            <input
                type="text"
                placeholder="Search anime..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                aria-label="Search anime by title"
            />
            <button type="submit">Search</button>
        </form>

        {user ? (<>
            <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                Profile
            </Link>

            {/* Admin-only link */}
            {isAdmin && (
                <Link to="/admin" className="nav-link admin-link">
                    Admin Dashboard
                </Link>
            )}

            <Link to="/search-lists" className="nav-link">Search Lists</Link>
            <button onClick={handleLogout} className="nav-link">Logout</button>
        </>) : (<>
            <Link to="/login" className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}>
                Login
            </Link>
            <Link to="/register" className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}>
                Register
            </Link>
        </>)}
    </nav>);
}

export default Navigation;