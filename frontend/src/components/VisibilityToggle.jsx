import React from 'react';
import '../styles/VisibilityToggle.css';

const VisibilityToggle = ({ value, onChange, disabled = false, size = 'medium' }) => {
    const visibilityOptions = [
        { value: 'public', label: 'Public', icon: '🌍' },
        { value: 'friends_only', label: 'Friends Only', icon: '👥' },
        { value: 'private', label: 'Private', icon: '🔒' }
    ];

    const currentOption = visibilityOptions.find(option => option.value === value) || visibilityOptions[0];

    return (
        <div className={`visibility-toggle ${size} ${disabled ? 'disabled' : ''}`}>
            <label className="visibility-label">
                <span className="visibility-icon">{currentOption.icon}</span>
                <select 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="visibility-select"
                >
                    {visibilityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
};

export default VisibilityToggle;
