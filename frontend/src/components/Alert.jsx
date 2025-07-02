import React, { useEffect, useState } from 'react';
import '../styles/Alert.css'; // We will create this CSS file

const Alert = ({ message, type, duration = 5000, onClose }) => {
    const [visible, setVisible] = useState(!!message);

    useEffect(() => {
        setVisible(!!message);
        if (message) {
            const timer = setTimeout(() => {
                setVisible(false);
                if (onClose) {
                    onClose();
                }
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    if (!visible || !message) return null;

    const alertClass = `alert alert-${type || 'info'}`;

    return (
        <div className={alertClass} role="alert">
            {message}
            <button type="button" className="close" onClick={() => setVisible(false)} aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    );
};

export default Alert;
