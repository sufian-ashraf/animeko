import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Alert from './Alert';

const AlertHandler = () => {
    const { logoutMessage, setLogoutMessage } = useAuth();

    return (
        <Alert
            message={logoutMessage}
            type="info"
            onClose={() => setLogoutMessage(null)}
        />
    );
};

export default AlertHandler;
