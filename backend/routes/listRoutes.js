import express from 'express';
import List from '../models/List.js'; // Import the List model
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

// ──────────────────────────────────────────────────
// 1) GET /api/lists            (fetch current user's lists)
// ──────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const lists = await List.getListsByUserId(userId);
        res.json(lists);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to fetch lists'});
    }
});

// ──────────────────────────────────────────────────
// 2) GET /api/lists/all        (get all public lists with owner info and item counts)
// ──────────────────────────────────────────────────
router.get('/all', async (req, res) => {
    try {
        const lists = await List.getAllPublicLists();
        res.json(lists);
    } catch (err) {
        console.error('[GET /lists/all] Error:', err);
        res.status(500).json({error: 'Failed to fetch lists: ' + err.message});
    }
});

// ──────────────────────────────────────────────────
// 2.5) GET /api/lists/recent   (get the most recently created lists)
// ──────────────────────────────────────────────────
router.get('/recent', async (req, res) => {
    try {
        const lists = await List.getRecentLists();
        res.json(lists);
    } catch (err) {
        console.error('[GET /lists/recent] Error:', err);
        res.status(500).json({error: 'Failed to fetch recent lists: ' + err.message});
    }
});

// ──────────────────────────────────────────────────
// 3) GET /api/lists/search/:keyword   (search lists by keyword)
// ──────────────────────────────────────────────────
router.get('/search/:keyword', async (req, res) => {
    try {
        const keyword = req.params.keyword;
        const lists = await List.searchLists(keyword);
        res.json(lists);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({error: 'Search failed: ' + err.message});
    }
});

// ──────────────────────────────────────────────────
// 5) GET /api/lists/:id          (get a specific list by ID with its items)
// ──────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const listId = parseInt(req.params.id, 10);
        
        if (isNaN(listId) || listId <= 0) {
            return res.status(400).json({error: 'Invalid list ID'});
        }

        const list = await List.getListById(listId);
        
        if (!list) {
            return res.status(404).json({error: 'List not found'});
        }
        
        res.json(list);
        
    } catch (err) {
        console.error('[GET /lists/:id] Error:', err);
        res.status(500).json({error: 'Failed to fetch list: ' + err.message});
    }
});

// ──────────────────────────────────────────────────
// 6) PUT /api/lists/:id           (update a list)
// ──────────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
    try {
        const listId = parseInt(req.params.id, 10);
        const { title, animeEntries = [] } = req.body;
        const userId = req.user.id;

        if (isNaN(listId) || listId <= 0) {
            return res.status(400).json({error: 'Invalid list ID'});
        }

        const updatedList = await List.updateList(listId, userId, { title, animeEntries });
        
        res.json(updatedList);
        
    } catch (err) {
        console.error('[PUT /lists/:id] Error:', err);
        let statusCode = 500;
        if (err.message.includes('not found')) {
            statusCode = 404;
        } else if (err.message.includes('permission')) {
            statusCode = 403;
        } else if (err.message.includes('title is required')) {
            statusCode = 400;
        }
        res.status(statusCode).json({error: err.message});
    }
});

// ──────────────────────────────────────────────────
// 8) GET /api/lists/anime/:animeId   (get lists containing an anime)
// ──────────────────────────────────────────────────
router.get('/anime/:animeId', async (req, res) => {
    // Log request details
    console.log('Request headers:', req.headers);
    console.log('Request params:', req.params);
    console.log('Request query:', req.query);
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    const { animeId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
        // Log the anime ID being queried
        console.log('Fetching lists for anime ID:', animeId);
        
        const result = await List.getPaginatedListsByAnimeId(animeId, page, limit);

        res.json(result);
    } catch (err) {
        console.error('Error fetching anime lists:', err);
        res.status(500).json({ error: 'Failed to fetch lists containing this anime' });
    }
});

// ──────────────────────────────────────────────────
// 9) DELETE /api/lists/:id        (delete a list)
// ──────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const listId = parseInt(req.params.id, 10);
        const userId = req.user.id;

        if (isNaN(listId) || listId <= 0) {
            return res.status(400).json({error: 'Invalid list ID'});
        }

        await List.deleteList(listId, userId);

        res.status(204).send();
        
    } catch (err) {
        console.error('[DELETE /lists/:id] Error:', err);
        let statusCode = 500;
        if (err.message.includes('not found')) {
            statusCode = 404;
        } else if (err.message.includes('permission')) {
            statusCode = 403;
        }
        res.status(statusCode).json({error: err.message});
    }
});

// ──────────────────────────────────────────────────
// 8) GET /api/lists/:id/items  (get just the items for a list) - UPDATED WITH MEDIA
// ──────────────────────────────────────────────────
router.get('/:id/items', authenticate, async (req, res) => {
    try {
        const listId = parseInt(req.params.id, 10);
        if (isNaN(listId)) {
            return res.status(400).json({ error: 'Invalid list ID format' });
        }

        // Check if list exists (handled by model)
        const listExists = await List.getListById(listId);
        if (!listExists) {
            return res.status(404).json({ error: 'List not found' });
        }

        const items = await List.getListItems(listId);

        res.json(items);
    } catch (err) {
        console.error('[GET /lists/:id/items] Error:', err);
        res.status(500).json({ error: 'Failed to fetch list items' });
    }
});

export default router;
