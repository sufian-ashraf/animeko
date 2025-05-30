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
});

export default pool;