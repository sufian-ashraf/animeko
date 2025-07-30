#!/usr/bin/env node

/**
 * Startup script for the Animeko backend server
 * Handles database connection issues gracefully
 */

import { testConnection } from './db.js';

console.log('🚀 Starting Animeko Backend Server...');
console.log('📊 Checking database connection...');

async function startServer() {
    try {
        // Test database connection before starting the server
        const isConnected = await testConnection();
        
        if (!isConnected) {
            console.warn('⚠️  Database connection test failed, but continuing with server startup...');
            console.warn('🔄 Server will attempt to reconnect to database automatically');
        } else {
            console.log('✅ Database connection successful');
        }
        
        // Import and start the server
        console.log('🌐 Starting Express server...');
        await import('./server.js');
        
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        
        if (error.message.includes('database') || error.message.includes('connection')) {
            console.log('🔄 Database connection issues detected. Server will start anyway and retry connections...');
            // Still try to start the server
            try {
                await import('./server.js');
            } catch (serverError) {
                console.error('💥 Critical error starting server:', serverError.message);
                process.exit(1);
            }
        } else {
            console.error('💥 Critical startup error');
            process.exit(1);
        }
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error.message);
    // Don't exit immediately for database-related errors
    if (!error.message.includes('database') && !error.message.includes('termination')) {
        process.exit(1);
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit immediately for database-related errors
    if (reason && typeof reason === 'object' && reason.message) {
        if (!reason.message.includes('database') && !reason.message.includes('termination')) {
            process.exit(1);
        }
    }
});

startServer();
