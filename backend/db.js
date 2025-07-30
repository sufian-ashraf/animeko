import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';

const {Pool} = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env only once
dotenv.config({path: path.resolve(__dirname, '.env')});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: parseInt(process.env.DB_MAX_CONNECTIONS) || 3, // Maximum number of clients in the pool
    min: parseInt(process.env.DB_MIN_CONNECTIONS) || 0, // Minimum number of clients in the pool
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000, // How long a client is allowed to remain idle
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000, // How long to wait for a connection
    maxUses: 1000, // Maximum number of times a connection can be used before being discarded
    ssl: {
        rejectUnauthorized: false
    },
    // Keep connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    // Statement timeout
    statement_timeout: 30000,
    // Query timeout
    query_timeout: 30000
});

// Enhanced error handling for the pool
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client:', err.message);
    // Don't exit the process, just log the error
});

pool.on('connect', (client) => {
    // Reduced logging - only log on first connection or after errors
    // Set session parameters for better connection management
    client.query(`
        SET statement_timeout = 30000;
        SET idle_in_transaction_session_timeout = 30000;
    `).catch(err => console.log('Error setting session parameters:', err.message));
});

pool.on('remove', (client) => {
    // Reduced logging for remove events
});

// Wrapper function for queries with retry logic
export const query = async (text, params, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await pool.query(text, params);
            return result;
        } catch (err) {
            console.error(`Query attempt ${i + 1} failed:`, err.message);
            
            // If it's a connection error and we have retries left, wait and try again
            if ((err.code === 'XX000' || err.message.includes('termination') || err.message.includes('shutdown')) && i < retries - 1) {
                console.log(`Retrying query in ${1000 * (i + 1)}ms...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                continue;
            }
            
            throw err;
        }
    }
};

// Enhanced connection test function
export const testConnection = async () => {
    try {
        const result = await query('SELECT NOW() as current_time');
        // Only log on initial connection, not on periodic checks
        return true;
    } catch (err) {
        console.error('Database connection test failed:', err.message);
        return false;
    }
};

export default pool;