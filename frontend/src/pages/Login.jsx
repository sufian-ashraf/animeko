// frontend/src/pages/Login.js
import React, {useEffect, useState} from 'react';
import {Link, useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {useAlert} from '../components/AlertHandler';
import '../styles/Auth.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);

    const {login, isAuthenticated} = useAuth();
    const {showAlert} = useAlert();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Get the redirect URL from query parameters or location state
    const redirectUrl = searchParams.get('redirect') || location.state?.from?.pathname || '/';

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            console.log('User is already authenticated, redirecting to:', redirectUrl);
            navigate(redirectUrl, {replace: true});
        }
    }, [isAuthenticated, navigate, redirectUrl]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim() || !password.trim()) {
            showAlert('error', 'Please enter both username and password');
            return;
        }

        try {
            setIsLoading(true);
            await login(username, password);
            console.log('Login successful, redirecting to:', redirectUrl);
            navigate(redirectUrl, {replace: true});
        } catch (err) {
            console.error('Login error caught in Login.jsx:', err);
            showAlert('error', err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (<div className="auth-container">
        <div className="auth-card">
            <h2>Login to Animeko</h2>

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