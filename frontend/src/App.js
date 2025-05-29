import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
// import Friends from './pages/Friends';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// Import CSS
import './styles/App.css';
import './styles/Auth.css';
import './styles/Profile.css';
import './styles/styles.css';
import './styles/Home.css';
import './styles/NotFound.css';

// Navigation Component
function Navigation() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const handleLogout = () => {
        logout();
    };

    return (
        <nav className="main-nav">
            {user ? (
                // Authenticated user navigation
                <div className="nav-links">
                    <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                        <span className="nav-icon">👤</span>
                        Profile
                    </Link>
                    <button onClick={handleLogout} className="nav-link logout-btn">
                        <span className="nav-icon">🚪</span>
                        Logout
                    </button>
                </div>
            ) : (
                // Non-authenticated user navigation
                <div className="nav-links">
                    <Link to="/login" className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}>
                        <span className="nav-icon">🔑</span>
                        Login
                    </Link>
                    <Link to="/register" className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}>
                        <span className="nav-icon">📝</span>
                        Register
                    </Link>
                </div>
            )}
        </nav>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <header className="App-header">
                        <div className="header-content">
                            <Link to="/" className="logo-link">
                                <h1>AnimeKo</h1>
                            </Link>
                            <Navigation />
                        </div>
                    </header>
                    <main>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

                            {/* Protected Routes */}
                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Uncomment when Friends page is ready */}
                            {/*
              <Route
                path="/friends"
                element={
                  <ProtectedRoute>
                    <Friends />
                  </ProtectedRoute>
                }
              />
              */}

                            {/* 404 Route - Must be last */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;