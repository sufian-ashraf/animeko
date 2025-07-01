import pool from '../db.js';

class Genre {
    static async getAll() {
        const result = await pool.query(`
            SELECT genre_id as id,
                   name,
                   description
            FROM genre
            ORDER BY name
        `);
        return result.rows;
    }

    static async getById(genreId) {
        const client = await pool.connect();
        try {
            const genreRes = await client.query(
                `SELECT genre_id as id,
                        name,
                        description
                 FROM genre
                 WHERE genre_id = $1`,
                [genreId]
            );
            if (genreRes.rows.length === 0) {
                return null;
            }
            return genreRes.rows[0];
        } finally {
            client.release();
        }
    }

    static async create({ name, description }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const existingGenre = await client.query(
                'SELECT 1 FROM genre WHERE LOWER(name) = LOWER($1)',
                [name.trim()]
            );
            if (existingGenre.rows.length > 0) {
                throw new Error('A genre with this name already exists');
            }
            const result = await client.query(
                `INSERT INTO genre (name, description)
                 VALUES ($1, $2) RETURNING 
                    genre_id AS id, 
                    name,
                    description`,
                [name.trim(), description ? description.trim() : null]
            );
            await client.query('COMMIT');
            return result.rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async update(genreId, { name, description }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const genreExists = await client.query(
                'SELECT 1 FROM genre WHERE genre_id = $1',
                [genreId]
            );
            if (genreExists.rows.length === 0) {
                throw new Error('Genre not found');
            }
            const nameExists = await client.query(
                'SELECT 1 FROM genre WHERE LOWER(name) = LOWER($1) AND genre_id != $2',
                [name.trim(), genreId]
            );
            if (nameExists.rows.length > 0) {
                throw new Error('A genre with this name already exists');
            }
            const result = await client.query(
                `UPDATE genre
                 SET name = $1,
                     description = $3
                 WHERE genre_id = $2 RETURNING 
                    genre_id AS id, 
                    name,
                    description`,
                [name.trim(), genreId, description ? description.trim() : null]
            );
            await client.query('COMMIT');
            return result.rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async delete(genreId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const checkResult = await client.query(
                'SELECT 1 FROM genre WHERE genre_id = $1',
                [genreId]
            );
            if (checkResult.rows.length === 0) {
                throw new Error('Genre not found');
            }
            const animeCheck = await client.query(
                'SELECT 1 FROM anime_genre WHERE genre_id = $1 LIMIT 1',
                [genreId]
            );
            if (animeCheck.rows.length > 0) {
                throw new Error('Cannot delete genre with associated anime. Please update or delete the anime first.');
            }
            const result = await client.query(
                'DELETE FROM genre WHERE genre_id = $1 RETURNING genre_id',
                [genreId]
            );
            await client.query('COMMIT');
            return result.rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}

export default Genre;
