// frontend/src/components/AlertHandler.js
import React, { useEffect, useRef } from 'react';
import { useAlert } from '../contexts/AlertContext';
import Alert from './Alert';
import { useLocation } from 'react-router-dom';

const AlertHandler = () => {
    const { alerts, removeAlert, showAlert } = useAlert();
    const location = useLocation();
    const processedLocationKey = useRef(null);

    useEffect(() => {
        // Only process if location.key has changed and there's an alert in state
        if (location.key !== processedLocationKey.current && location.state && location.state.alert) {
            const { type, message, duration } = location.state.alert;
            showAlert(type, message, duration);
            processedLocationKey.current = location.key;

            // Clear the state to prevent the alert from reappearing on refresh or re-renders
            window.history.replaceState({}, document.title, location.pathname);
        }
    }, [location.key, showAlert]);

    return (
        <div className="alert-container">
            {alerts.map((alert, index) => (
                <Alert
                    key={alert.id}
                    id={alert.id}
                    message={alert.message}
                    type={alert.type}
                    duration={alert.duration}
                    onClose={removeAlert}
                    index={index} // Pass index for stacking
                />
            ))}
        </div>
    );
};

export default AlertHandler;
