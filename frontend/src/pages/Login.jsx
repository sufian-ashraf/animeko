// frontend/src/pages/Login.js
import React, {useEffect, useState} from 'react';
import {Link, useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';

import '../styles/Auth.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(''); // New state for login errors
    
    const [isLoading, setIsLoading] = useState(false);

    const {login, isAuthenticated} = useAuth();
    
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Get the redirect URL from query parameters or location state
    const redirectUrl = searchParams.get('redirect') || location.state?.from?.pathname || '/';

    // Redirect if already authenticated
    useEffect(() => {
        setLoginError(''); // Clear error on mount/navigation
        if (isAuthenticated) {
            navigate(redirectUrl, {replace: true});
        }
    }, [isAuthenticated, navigate, redirectUrl]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim() || !password.trim()) {
            setLoginError('Please enter both username and password');
            return;
        }

        try {
            setIsLoading(true);
            setLoginError(''); // Clear previous errors on new attempt
            await login(username, password);
            console.log('Login successful, redirecting to:', redirectUrl);
            navigate(redirectUrl, {replace: true, state: { alert: { type: 'success', message: 'Login successful', duration: 3000 } } });
        } catch (err) {
            console.error('Login error caught in Login.jsx:', err);
            console.log('Setting login error:', err.message || 'Login failed. Please check your credentials.');
            setLoginError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (<div className="auth-container">
        <div className="auth-card">
            <h2>Login to Animeko</h2>

            {loginError && <p className="error-message">{loginError}</p>}

            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="auth-button"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="spinner-container-small">
                            <div className="spinner-small"></div>
                        </div>
                    ) : (
                        'Login'
                    )}
                </button>
            </form>

            <p className="auth-link">
                Don't have an account? <Link to="/register">Sign up</Link>
            </p>
        </div>
    </div>);
};

export default Login;