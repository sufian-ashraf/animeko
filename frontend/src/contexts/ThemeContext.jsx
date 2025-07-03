import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        // Default to light mode if no preference is saved
        return savedMode ? JSON.parse(savedMode) : false;
    });

    useEffect(() => {
        // Apply or remove the 'dark-mode' class on the body element
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        // Save the preference to localStorage
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode(prevMode => !prevMode);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === null) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
