// frontend/src/components/AdminRoute.js
import React, {useEffect, useState} from 'react';
import {Navigate, useLocation} from 'react-router-dom';
import {useAuth} from '../../contexts/AuthContext';

const AdminRoute = ({children}) => {
    const {user, token, fetchUserProfile} = useAuth();
    const [isReady, setIsReady] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsReady(true);

            // If we have user data but they're not admin, show access denied
            if (user && !user.is_admin) {
                setAccessDenied(true);
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [user]);

    // Show loading state while checking auth
    if (!isReady) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    // If no token or user, redirect to login with return URL
    if (!token || !user) {
        console.log('AdminRoute - Not authenticated, redirecting to login');
        return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace/>;
    }


    // Check if user is admin - handle different possible true values
    const isAdmin = Boolean(
        user.is_admin === true ||
        user.is_admin === 't' ||
        user.is_admin === 1 ||
        user.is_admin === 'true' ||
        user.is_admin === '1'
    );

    // console.log('AdminRoute - Checking admin status:', {
    //     userId: user.id || user.user_id,
    //     username: user.username,
    //     is_admin: user.is_admin,
    //     isAdmin_calculated: isAdmin,
    //     userObject: user,  // Log full user object for debugging
    //     timestamp: new Date().toISOString()
    // });

    if (!isAdmin) {
        if (!accessDenied) {
            // Set a small delay before showing access denied to prevent flash
            const timer = setTimeout(() => setAccessDenied(true), 100);
            return () => clearTimeout(timer);
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
                    <div className="text-red-500 mb-4">
                        <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">You don't have permission to access the admin dashboard.</p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Go Back
                    </button>
                    <div className="mt-6 text-sm text-gray-500">
                        <p>If you believe this is an error, please contact support.</p>
                        <p className="mt-1">User: {user?.username || 'Unknown'} |
                            Admin: {String(user?.is_admin || false)}</p>
                    </div>
                </div>
            </div>
        );
    }

    // If we get here, user is authenticated and is an admin
    // console.log('AdminRoute - Admin access granted for user:', {
    //     userId: user.id || user.user_id,
    //     username: user.username,
    //     is_admin: user.is_admin
    // });

    return children;
};

export default AdminRoute;
