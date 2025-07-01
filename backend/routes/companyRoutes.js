import express from 'express';
import Company from '../models/Company.js'; // Import the Company model
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';

const router = express.Router();

// GET /api/company - List all companies
router.get('/company', async (req, res) => {
    try {
        const companies = await Company.getAll();
        res.json(companies);
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
    const {companyId} = req.params;
    const id = parseInt(companyId, 10);
    if (isNaN(id)) {
        return res.status(400).json({message: 'Invalid company ID format'});
    }
    try {
        const company = await Company.getById(id);
        if (!company) {
            return res.status(404).json({message: 'Company not found'});
        }
        res.json(company);
    } catch (err) {
        console.error('Error fetching company detail:', err);
        res.status(500).json({
            message: 'Failed to fetch company details',
            error: err.message
        });
    }
});

// POST /api/company - Create new company
router.post('/company', authenticate, authorizeAdmin, async (req, res) => {
    const {name, country, founded} = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({message: 'Company name is required'});
    }
    try {
        const newCompany = await Company.create({ name, country, founded });
        res.status(201).json(newCompany);
    } catch (err) {
        console.error('Error creating company:', err);
        let statusCode = 500;
        let message = 'Failed to create company';
        if (err.message.includes('already exists')) {
            statusCode = 400;
            message = err.message;
        }
        res.status(statusCode).json({
            message: message,
            error: err.message
        });
    }
});

// PUT /api/company/:companyId - Update company
router.put('/company/:companyId', authenticate, authorizeAdmin, async (req, res) => {
    const {companyId} = req.params;
    const {name, country, founded} = req.body;
    const id = parseInt(companyId, 10);
    if (isNaN(id)) {
        return res.status(400).json({message: 'Invalid company ID format'});
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({message: 'Company name is required'});
    }
    try {
        const updatedCompany = await Company.update(id, { name, country, founded });
        if (!updatedCompany) {
            return res.status(404).json({message: 'Company not found'});
        }
        res.json(updatedCompany);
    } catch (err) {
        console.error('Error updating company:', err);
        let statusCode = 500;
        let message = 'Failed to update company';
        if (err.message.includes('not found')) {
            statusCode = 404;
            message = err.message;
        } else if (err.message.includes('already exists')) {
            statusCode = 400;
            message = err.message;
        }
        res.status(statusCode).json({
            message: message,
            error: err.message
        });
    }
});

// DELETE /api/company/:companyId
router.delete('/company/:companyId', authenticate, authorizeAdmin, async (req, res) => {
    const {companyId} = req.params;
    const id = parseInt(companyId, 10);
    if (isNaN(id)) {
        return res.status(400).json({message: 'Invalid company ID format'});
    }
    try {
        const deletedCompany = await Company.delete(id);
        if (!deletedCompany) {
            return res.status(404).json({message: 'Company not found'});
        }
        res.json({
            success: true,
            message: 'Company deleted successfully',
            id: id
        });
    } catch (err) {
        console.error('Error deleting company:', err);
        let statusCode = 500;
        let message = 'Failed to delete company';
        if (err.message.includes('not found')) {
            statusCode = 404;
            message = err.message;
        } else if (err.message.includes('associated anime')) {
            statusCode = 400;
            message = err.message;
        }
        res.status(statusCode).json({
            message: message,
            error: err.message,
            code: err.code
        });
    }
});

export default router;