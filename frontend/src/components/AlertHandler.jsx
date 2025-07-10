import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';

const AlertHandler = () => {
    const { logoutMessage, setLogoutMessage } = useAuth();
    const { showAlert } = useAlert();

    React.useEffect(() => {
        if (logoutMessage) {
            showAlert('info', logoutMessage);
            setLogoutMessage(null);
        }
    }, [logoutMessage, setLogoutMessage, showAlert]);

    return null; // This component no longer renders anything itself
};

export default AlertHandler;