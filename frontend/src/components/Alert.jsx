import React, { useEffect, useState } from 'react';
import '../styles/Alert.css';

const Alert = ({ id, message, type, duration = 5000, onClose, index }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setVisible(false);
                onClose(id); // Call onClose with the alert's ID
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose, id]);

    if (!visible) return null;

    const alertClass = `alert alert-${type || 'info'}`;
    const topPosition = 20 + (index * 70); // Adjust 70px based on alert height + margin

    return (
        <div className={alertClass} role="alert" style={{ top: `${topPosition}px` }}>
            {message}
            <button type="button" className="close" onClick={() => {
                setVisible(false);
                onClose(id);
            }} aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    );
};

export default Alert;
