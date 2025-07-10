import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LogoutHandler = () => {
    const { logoutMessage, setLogoutMessage } = useAuth();
    const navigate = useNavigate();
    const hasNavigated = useRef(false);

    useEffect(() => {
        if (logoutMessage && !hasNavigated.current) {
            navigate('/');
            hasNavigated.current = true;

            const timer = setTimeout(() => {
                setLogoutMessage(null);
                hasNavigated.current = false; // Reset for next logout
            }, 5000);
            return () => clearTimeout(timer);
        } else if (!logoutMessage) {
            hasNavigated.current = false; // Reset if message is cleared externally
        }
    }, [logoutMessage, setLogoutMessage, navigate]);

    return null; // This component doesn't render anything itself
};

export default LogoutHandler;