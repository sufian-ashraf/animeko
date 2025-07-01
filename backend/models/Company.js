import pool from '../db.js';

class Company {
    static async getAll() {
        const result = await pool.query(`
            SELECT company_id as id,
                   name,
                   country,
                   founded
            FROM company
            ORDER BY name
        `);
        return result.rows;
    }

    static async getById(companyId) {
        const client = await pool.connect();
        try {
            const companyRes = await client.query(
                `SELECT company_id as id,
                        name,
                        country,
                        founded
                 FROM company
                 WHERE company_id = $1`,
                [companyId]
            );
            if (companyRes.rows.length === 0) {
                return null;
            }
            const company = companyRes.rows[0];
            const animeListRes = await client.query(
                `SELECT a.anime_id as "animeId",
                        a.title,
                        m.url as "imageUrl"
                 FROM anime a
                 LEFT JOIN media m ON a.anime_id = m.entity_id AND m.media_type = 'image' AND entity_type = 'anime'
                 WHERE a.company_id = $1
                 ORDER BY a.title`,
                [companyId]
            );
            company.animeList = animeListRes.rows;
            return company;
        } finally {
            client.release();
        }
    }

    static async create({ name, country, founded }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const existingCompany = await client.query(
                'SELECT 1 FROM company WHERE LOWER(name) = LOWER($1)',
                [name.trim()]
            );
            if (existingCompany.rows.length > 0) {
                throw new Error('A company with this name already exists');
            }
            const result = await client.query(
                `INSERT INTO company (name, country, founded)
                 VALUES ($1, $2, $3) RETURNING 
                    company_id AS id, 
                    name,
                    country,
                    founded`,
                [
                    name.trim(),
                    country ? country.trim() : null,
                    founded || null
                ]
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

    static async update(companyId, { name, country, founded }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const companyExists = await client.query(
                'SELECT 1 FROM company WHERE company_id = $1',
                [companyId]
            );
            if (companyExists.rows.length === 0) {
                throw new Error('Company not found');
            }
            const nameExists = await client.query(
                'SELECT 1 FROM company WHERE LOWER(name) = LOWER($1) AND company_id != $2',
                [name.trim(), companyId]
            );
            if (nameExists.rows.length > 0) {
                throw new Error('A company with this name already exists');
            }
            const result = await client.query(
                `UPDATE company
                 SET name    = $1,
                     country = $2,
                     founded = $3
                 WHERE company_id = $4 RETURNING 
                    company_id AS id, 
                    name,
                    country,
                    founded`,
                [
                    name.trim(),
                    country ? country.trim() : null,
                    founded || null,
                    companyId
                ]
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

    static async delete(companyId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const checkResult = await client.query(
                'SELECT 1 FROM company WHERE company_id = $1',
                [companyId]
            );
            if (checkResult.rows.length === 0) {
                throw new Error('Company not found');
            }
            const animeCheck = await client.query(
                'SELECT 1 FROM anime WHERE company_id = $1 LIMIT 1',
                [companyId]
            );
            if (animeCheck.rows.length > 0) {
                throw new Error('Cannot delete company with associated anime. Please update or delete the anime first.');
            }
            const result = await client.query(
                'DELETE FROM company WHERE company_id = $1 RETURNING company_id',
                [companyId]
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

export default Company;
