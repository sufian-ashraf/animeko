import express from 'express';
import pool from '../db.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';

const router = express.Router();

// GET /api/company - List all companies
router.get('/company', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                company_id as id,
                name,
                country,
                founded
            FROM company
            ORDER BY name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching companies:', err);
        res.status(500).json({ 
            message: 'Failed to fetch companies',
            error: err.message 
        });
    }
});

// GET /api/company/:companyId
router.get('/company/:companyId', async (req, res) => {
    const { companyId } = req.params;
    
    // Validate companyId is a valid number
    const id = parseInt(companyId, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid company ID format' });
    }
    
    const client = await pool.connect();
    
    try {
        // 1) Fetch company info
        const companyRes = await client.query(
            `SELECT 
                company_id as id,
                name,
                country,
                founded
             FROM company
             WHERE company_id = $1`,
            [id]
        );
        
        if (companyRes.rows.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }
        
        const company = companyRes.rows[0];

        // 2) Fetch all anime produced by this company
        const animeListRes = await client.query(
            `SELECT 
                anime_id as "animeId",
                title
             FROM anime
             WHERE company_id = $1
             ORDER BY title`,
            [id]
        );
        
        company.animeList = animeListRes.rows;
        res.json(company);
    } catch (err) {
        console.error('Error fetching company detail:', err);
        res.status(500).json({ 
            message: 'Failed to fetch company details',
            error: err.message 
        });
    } finally {
        client.release();
    }
});


// ─── ADMIN‐ONLY ────────────────────────────────────────
// POST /api/company - Create new company
router.post('/company', authenticate, authorizeAdmin, async (req, res) => {
    const { name, country, founded } = req.body;
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Company name is required' });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Check if company with same name already exists
        const existingCompany = await client.query(
            'SELECT 1 FROM company WHERE LOWER(name) = LOWER($1)',
            [name.trim()]
        );
        
        if (existingCompany.rows.length > 0) {
            return res.status(400).json({ 
                message: 'A company with this name already exists' 
            });
        }
        
        const result = await client.query(
            `INSERT INTO company (name, country, founded)
             VALUES ($1, $2, $3)
             RETURNING 
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
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating company:', err);
        
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ 
                message: 'A company with this name already exists' 
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to create company',
            error: err.message 
        });
    } finally {
        client.release();
    }
});

// PUT /api/company/:companyId - Update company
router.put('/company/:companyId', authenticate, authorizeAdmin, async (req, res) => {
    const { companyId } = req.params;
    const { name, country, founded } = req.body;
    
    // Validate companyId is a valid number
    const id = parseInt(companyId, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid company ID format' });
    }
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Company name is required' });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Check if company exists
        const companyExists = await client.query(
            'SELECT 1 FROM company WHERE company_id = $1',
            [id]
        );
        
        if (companyExists.rows.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }
        
        // Check if another company with the same name exists
        const nameExists = await client.query(
            'SELECT 1 FROM company WHERE LOWER(name) = LOWER($1) AND company_id != $2',
            [name.trim(), id]
        );
        
        if (nameExists.rows.length > 0) {
            return res.status(400).json({ 
                message: 'A company with this name already exists' 
            });
        }
        
        const result = await client.query(
            `UPDATE company
             SET 
                name = $1,
                country = $2,
                founded = $3
             WHERE company_id = $4
             RETURNING 
                company_id AS id, 
                name,
                country,
                founded`,
            [
                name.trim(),
                country ? country.trim() : null,
                founded || null,
                id
            ]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }
        
        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating company:', err);
        
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ 
                message: 'A company with this name already exists' 
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to update company',
            error: err.message 
        });
    } finally {
        client.release();
    }
});

// DELETE /api/company/:companyId
router.delete('/company/:companyId', authenticate, authorizeAdmin, async (req, res) => {
    const { companyId } = req.params;
    
    // Validate companyId is a valid number
    const id = parseInt(companyId, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid company ID format' });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // First check if company exists
        const checkResult = await client.query(
            'SELECT 1 FROM company WHERE company_id = $1',
            [id]
        );
        
        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Company not found' });
        }
        
        // First check if there are any anime associated with this company
        const animeCheck = await client.query(
            'SELECT 1 FROM anime WHERE company_id = $1 LIMIT 1',
            [id]
        );
        
        if (animeCheck.rows.length > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete company with associated anime. Please update or delete the anime first.' 
            });
        }
        
        // Delete the company
        const result = await client.query(
            'DELETE FROM company WHERE company_id = $1 RETURNING company_id',
            [id]
        );
        
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Company not found' });
        }
        
        await client.query('COMMIT');
        res.json({ 
            success: true,
            message: 'Company deleted successfully',
            id: id
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting company:', err);
        
        if (err.code === '23503') { // Foreign key violation
            return res.status(400).json({ 
                message: 'Cannot delete company with associated anime. Please update or delete the anime first.' 
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to delete company',
            error: err.message,
            code: err.code
        });
    } finally {
        client.release();
    }
});


export default router;
