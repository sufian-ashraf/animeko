// frontend/src/components/AlertHandler.js
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Alert from './Alert';

const AlertHandler = () => {
    const { logoutMessage, setLogoutMessage } = useAuth();

    useEffect(() => {
        if (logoutMessage) {
            const timer = setTimeout(() => {
                setLogoutMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [logoutMessage, setLogoutMessage]);

    if (logoutMessage) {
        return <Alert message={logoutMessage} type="success" onClose={() => setLogoutMessage(null)} />;
    }

    return null;
};

export default AlertHandler;
