// frontend/src/components/ProtectedRoute.js
// frontend/src/pages/Login.js
import React from 'react';
import {Navigate, Outlet} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import '../styles/Auth.css';

export const ProtectedRoute = () => {
    const {token, loading} = useAuth();

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return token ? <Outlet/> : <Navigate to="/login" replace/>;
};
