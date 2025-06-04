import express from 'express';
import pool from '../db.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';

const router = express.Router();

// GET /api/company/:companyId
router.get('/company/:companyId', async (req, res) => {
    const {companyId} = req.params;
    try {
        // 1) Fetch company info
        const compRes = await pool.query(`SELECT company_id AS id,
                                                 name,
                                                 country,
                                                 founded
                                          FROM company
                                          WHERE company_id = $1`, [companyId]);
        if (compRes.rows.length === 0) {
            return res.status(404).json({message: 'Company not found'});
        }
        const company = compRes.rows[0];

        // 2) Fetch all anime produced by this company
        const animeListRes = await pool.query(`SELECT anime_id AS "animeId",
                                                      title    AS "title"
                                               FROM anime
                                               WHERE company_id = $1
                                               ORDER BY title`, [companyId]);
        company.animeList = animeListRes.rows;

        res.json(company);
    } catch (err) {
        console.error('Error fetching company detail:', err);
        res.status(500).json({message: 'Server error'});
    }
});


// ─── ADMIN‐ONLY ────────────────────────────────────────
// POST /api/company       (create new company)
router.post('/company', authenticate, authorizeAdmin, async (req, res) => {
    const { name, country, founded } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO company (name, country, founded)
       VALUES ($1, $2, $3)
       RETURNING company_id AS id, name`,
            [name, country, founded]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create company' });
    }
});

// PUT /api/company/:companyId  (update)
router.put('/company/:companyId', authenticate, authorizeAdmin, async (req, res) => {
    const { companyId } = req.params;
    const { name, country, founded } = req.body;
    try {
        await pool.query(
            `UPDATE company
       SET name = $1,
           country = $2,
           founded = $3
       WHERE company_id = $4`,
            [name, country, founded, companyId]
        );
        res.json({ message: 'Company updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update company' });
    }
});

// DELETE /api/company/:companyId
router.delete('/company/:companyId', authenticate, authorizeAdmin, async (req, res) => {
    const { companyId } = req.params;
    try {
        await pool.query(`DELETE FROM company WHERE company_id = $1`, [companyId]);
        res.json({ message: 'Company deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete company' });
    }
});


export default router;
