// frontend/src/components/ProtectedRoute.js
import React from 'react';
import {Navigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';

export const ProtectedRoute = ({children}) => {
    const {user, loading, token} = useAuth();

    console.log('ProtectedRoute - Loading:', loading); // Debug log
    console.log('ProtectedRoute - User:', user ? 'exists' : 'null'); // Debug log
    console.log('ProtectedRoute - Token:', token ? 'exists' : 'null'); // Debug log

    // Show loading while checking authentication
    if (loading) {
        console.log('ProtectedRoute - Still loading, showing loading screen');
        return <div>Loading...</div>;
    }

    // Redirect to login if no token
    if (!token) {
        console.log('ProtectedRoute - No token, redirecting to login');
        return <Navigate to="/login" replace/>;
    }

    // Render protected component
    console.log('ProtectedRoute - Authentication valid, rendering children');
    return children;
};
