import React from 'react';
import {Link, useLocation} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';

function Navigation() {
    const {user, logout, loading} = useAuth();
    const location = useLocation();

    // ✅ Hide navbar until auth loading finishes
    if (loading) return null;

    const handleLogout = () => {
        logout();
    };

    return (<nav className="top-nav">
        <Link to="/" className="nav-link">Home</Link>
        {user ? (<>
            <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                Profile
            </Link>
            <button onClick={handleLogout} className="nav-link">Logout</button>
        </>) : (<>
            <Link to="/login" className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}>
                Login
            </Link>
            <Link to="/register" className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}>
                Register
            </Link>
        </>)}
        <Link to="/my-lists">My Lists</Link>
    </nav>);
}

export default Navigation;
