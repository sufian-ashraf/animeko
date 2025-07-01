import React from 'react';
import {Link, useLocation} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';

function Navigation() {
    const {user, logout, loading, isAdmin} = useAuth();
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