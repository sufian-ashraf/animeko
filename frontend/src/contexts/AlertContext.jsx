// frontend/src/contexts/AlertContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);

    const showAlert = useCallback((type, message, duration = 5000) => {
        const newId = Date.now() + Math.random(); // More robust unique ID
        const newAlert = { id: newId, type, message, duration };
        setAlerts(prevAlerts => [...prevAlerts, newAlert]);
    }, []);

    const removeAlert = useCallback((id) => {
        setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, removeAlert, alerts }}>
            {children}
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
