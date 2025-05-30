import express from 'express';
import pool from '../db.js';

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

export default router;
