// frontend/src/components/AlertHandler.js
import React from 'react';
import { useAlert } from '../contexts/AlertContext';
import Alert from './Alert';

const AlertHandler = () => {
    const { alerts, removeAlert } = useAlert();

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
