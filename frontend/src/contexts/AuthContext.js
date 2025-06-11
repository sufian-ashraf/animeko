// frontend/src/contexts/AuthContext.js
import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    const fetchUserProfile = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            setError(null);
            // console.log('Fetching user profile with token:', token);
            
            const response = await fetch('http://localhost:5000/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            // console.log('Profile response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Profile fetch error:', errorData);
                
                if (response.status === 401 || response.status === 403) {
                    logout();
                    throw new Error(errorData.message || 'Session expired. Please login again.');
                }
                throw new Error(errorData.message || 'Failed to fetch user profile');
            }

            const userData = await response.json();
            // console.log('Fetched user profile:', userData);
            
            // If is_admin is missing, try to fetch it directly from the database
            if (userData.is_admin === undefined) {
                console.warn('is_admin is missing from user profile, checking database...');
                try {
                    const adminCheck = await fetch('http://localhost:5000/api/auth/check-admin', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    const adminData = await adminCheck.json();
                    if (adminData.is_admin !== undefined) {
                        userData.is_admin = adminData.is_admin;
                        // console.log('Updated is_admin from direct check:', userData.is_admin);
                    }
                } catch (err) {
                    console.error('Error checking admin status:', err);
                }
            }
            
            // Ensure we have all required user fields with proper types
            const isAdmin = userData.is_admin === true || 
                          userData.is_admin === 't' || 
                          userData.is_admin === 1 ||
                          userData.is_admin === 'true' ||
                          userData.is_admin === '1';
            
            const userWithAdmin = {
                id: userData.user_id || userData.id,
                user_id: userData.user_id || userData.id,
                username: userData.username,
                email: userData.email || '',
                display_name: userData.display_name || userData.username,
                is_admin: isAdmin
            };
            
            // console.log('Setting user with admin status:', {
            //     ...userWithAdmin,
            //     is_admin_raw: userData.is_admin,
            //     is_admin_type: typeof userData.is_admin
            // });
            
            setUser(userWithAdmin);
            return userWithAdmin;
        } catch (error) {
            console.error('Error in fetchUserProfile:', error);
            setError(error.message);
            setUser(null);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [token, logout]);

    useEffect(() => {
        if (token) {
            fetchUserProfile();
        } else {
            setLoading(false);
        }
    }, [token, fetchUserProfile]); // ✅ No more warning

    // Store token in localStorage when it changes
    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }, [token]);

    const login = async (username, password) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST', headers: {
                    'Content-Type': 'application/json'
                }, body: JSON.stringify({username, password})
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            setToken(data.token);
            
            // Ensure we have all required user fields with proper types
            const userWithAdmin = {
                id: data.user.user_id,  // Make sure we're using the correct field name
                user_id: data.user.user_id,  // Keep both for compatibility
                username: data.user.username,
                email: data.user.email || '',
                display_name: data.user.display_name || data.user.username,
                is_admin: Boolean(data.user.is_admin)
            };
            
            console.log('Login successful, user set:', userWithAdmin);
            setUser(userWithAdmin);
            return userWithAdmin;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST', headers: {
                    'Content-Type': 'application/json'
                }, body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            return data;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (profileData) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT', headers: {
                    'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`
                }, body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Profile update failed');
            }

            setUser(prev => ({...prev, ...data.user}));
            return data;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Check if user is authenticated (has a token and user data)
    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            error,
            isAuthenticated,
            login,
            logout,
            register,
            updateProfile,
            isAdmin: user?.is_admin || false
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;