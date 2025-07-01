// frontend/src/pages/Register.js
import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import '../styles/Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', confirmPassword: '', display_name: '', adminCode: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const {register, login} = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const validateForm = () => {
        if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
            setError('Username, email and password are required');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        try {
            setIsLoading(true);

            // Register the user
            await register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                display_name: formData.display_name || formData.username,
                adminCode: formData.adminCode
            });

            // Automatically log them in
            await login(formData.username, formData.password);

            // Redirect to home page
            navigate('/');

        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (<div className="auth-container">
        <div className="auth-card">
            <h2>Create an Account</h2>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="username">Username*</label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email*</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="display_name">Display Name</label>
                    <input
                        id="display_name"
                        name="display_name"
                        type="text"
                        value={formData.display_name}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="Optional"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password*</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password*</label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                    />
                </div>

                {/* Optional “Admin Code” field */}
                <div className="form-group">
                    <label htmlFor="adminCode">Admin Code (optional)</label>
                    <input
                        id="adminCode"
                        name="adminCode"
                        type="password"
                        value={formData.adminCode}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="Leave blank for normal user"
                    />
                </div>

                <button
                    type="submit"
                    className="auth-button"
                    disabled={isLoading}
                >
                    {isLoading ? 'Creating Account...' : 'Register'}
                </button>
            </form>

            <p className="auth-link">
                Already have an account? <Link to="/login">Login</Link>
            </p>
        </div>
    </div>);
};

export default Register;
