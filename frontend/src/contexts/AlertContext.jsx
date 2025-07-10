// frontend/src/contexts/AlertContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import Alert from '../components/Alert';

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
    const [alert, setAlert] = useState(null);

    const showAlert = useCallback((type, message) => {
        setAlert({ type, message });
    }, []);

    const closeAlert = () => {
        setAlert(null);
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {alert && (
                <Alert
                    message={alert.message}
                    type={alert.type}
                    onClose={closeAlert}
                />
            )}
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
