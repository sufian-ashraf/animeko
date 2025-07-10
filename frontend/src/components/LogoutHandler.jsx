import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';

const LogoutHandler = () => {
    const { logoutTrigger, resetLogoutTrigger } = useAuth();
    const { showAlert } = useAlert();
    const navigate = useNavigate();

    useEffect(() => {
        if (logoutTrigger) {
            showAlert('success', 'User logged out');
            navigate('/');
            resetLogoutTrigger(); // Reset the trigger immediately after handling
        }
    }, [logoutTrigger, navigate, showAlert, resetLogoutTrigger]);

    return null;
};

export default LogoutHandler;