import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LogoutHandler = () => {
    const { logoutMessage, setLogoutMessage } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (logoutMessage) {
            navigate('/');
            // The alert will be handled by App.jsx
            const timer = setTimeout(() => {
                setLogoutMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [logoutMessage, setLogoutMessage, navigate]);

    return null; // This component doesn't render anything itself
};

export default LogoutHandler;
