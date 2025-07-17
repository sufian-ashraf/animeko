// frontend/src/components/ProtectedRoute.js
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children }) => {
    const { user, loading, token } = useAuth();
    const location = useLocation();

    // Check if user is admin - handle different possible true values
    const isAdmin = user && (
        user.is_admin === true ||
        user.is_admin === 't' ||
        user.is_admin === 1 ||
        user.is_admin === 'true' ||
        user.is_admin === '1'
    );

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="spinner-container">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    // Redirect to login if no token
    if (!token) {
        return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
    }

    // If user is admin, redirect to admin dashboard
    if (isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    // Render protected component for regular users
    return children;
};
