import pool from '../db.js';

class List {
    // Search lists by name/title (partial match)
    static async getAll({ name } = {}) {
        let query = `
            SELECT 
                l.id,
                l.title,
                l.created_at,
                u.username as owner_username,
                u.user_id as owner_id,
                COALESCE(li.item_count, 0) as item_count
            FROM lists l
            JOIN users u ON l.user_id = u.user_id
            LEFT JOIN (
                SELECT list_id, COUNT(*) as item_count 
                FROM list_items 
                GROUP BY list_id
            ) li ON l.id = li.list_id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;
        if (name) {
            query += ` AND l.title ILIKE $${paramCount++}`;
            params.push(`%${name}%`);
        }
        query += ' ORDER BY l.created_at DESC';
        const result = await pool.query(query, params);
        return result.rows;
    }
    static async getListsByUserId(userId) {
        const result = await pool.query(
            `SELECT 
                l.id,
                l.title,
                l.created_at,
                COALESCE(li.item_count, 0) as item_count
             FROM lists l
             LEFT JOIN (
                 SELECT list_id, COUNT(*) as item_count 
                 FROM list_items 
                 GROUP BY list_id
             ) li ON l.id = li.list_id
             WHERE l.user_id = $1
             ORDER BY l.created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    static async getAllPublicLists() {
        const result = await pool.query(
            `SELECT 
                l.id,
                l.title,
                l.created_at,
                u.username as owner_username,
                u.user_id as owner_id,
                COALESCE(li.item_count, 0) as item_count
             FROM lists l
             JOIN users u ON l.user_id = u.user_id
             LEFT JOIN (
                 SELECT list_id, COUNT(*) as item_count 
                 FROM list_items 
                 GROUP BY list_id
             ) li ON l.id = li.list_id
             ORDER BY l.created_at DESC`
        );
        return result.rows;
    }

    static async getRecentLists() {
        const result = await pool.query(
            `SELECT 
                l.id,
                l.title,
                l.created_at,
                u.username as owner_username,
                u.user_id as owner_id,
                COALESCE(li.item_count, 0) as item_count
             FROM lists l
             JOIN users u ON l.user_id = u.user_id
             LEFT JOIN (
                 SELECT list_id, COUNT(*) as item_count 
                 FROM list_items 
                 GROUP BY list_id
             ) li ON l.id = li.list_id
             ORDER BY l.created_at DESC
             LIMIT 10`
        );
        return result.rows;
    }

    static async searchLists(keyword) {
        const result = await pool.query(
            `SELECT 
                l.id,
                l.title,
                l.created_at,
                u.username as owner_username,
                u.user_id as owner_id,
                COALESCE(li.item_count, 0) as item_count
             FROM lists l
             JOIN users u ON l.user_id = u.user_id
             LEFT JOIN (
                 SELECT list_id, COUNT(*) as item_count 
                 FROM list_items 
                 GROUP BY list_id
             ) li ON l.id = li.list_id
             WHERE LOWER(l.title) LIKE $1
             ORDER BY l.created_at DESC`,
            [`%${keyword.toLowerCase()}%`]
        );
        return result.rows;
    }

    static async getListsByAnimeId(animeId) {
        const result = await pool.query(
            `SELECT DISTINCT 
                l.id,
                l.title,
                l.created_at,
                u.username as owner_username,
                u.user_id as owner_id,
                (SELECT COUNT(*) FROM list_items WHERE list_id = l.id) as item_count
             FROM lists l
             JOIN users u ON l.user_id = u.user_id
             JOIN list_items li ON l.id = li.list_id
             WHERE li.anime_id = $1
             ORDER BY l.created_at DESC`,
            [animeId]
        );
        return result.rows;
    }

    static async createList({ userId, title, animeEntries = [] }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const listResult = await client.query(
                'INSERT INTO lists (user_id, title) VALUES ($1, $2) RETURNING id, title, created_at',
                [userId, title.trim()]
            );
            
            const listId = listResult.rows[0].id;
            
            if (Array.isArray(animeEntries) && animeEntries.length > 0) {
                const validEntries = [];
                const animeIds = [];
                
                for (const entry of animeEntries) {
                    if (entry.anime_id && !isNaN(parseInt(entry.anime_id, 10))) {
                        validEntries.push(entry);
                        animeIds.push(parseInt(entry.anime_id, 10));
                    }
                }
                
                if (animeIds.length > 0) {
                    const animeCheck = await client.query(
                        'SELECT anime_id FROM anime WHERE anime_id = ANY($1::int[])',
                        [animeIds]
                    );
                    
                    const existingAnimeIds = new Set(animeCheck.rows.map(row => row.anime_id));
                    
                    for (const entry of validEntries) {
                        if (existingAnimeIds.has(parseInt(entry.anime_id, 10))) {
                            await client.query(
                                'INSERT INTO list_items (list_id, anime_id, rank, note) VALUES ($1, $2, $3, $4)',
                                [
                                    listId,
                                    entry.anime_id,
                                    entry.rank || null,
                                    entry.note || ''
                                ]
                            );
                        }
                    }
                }
            }
            
            await client.query('COMMIT');
            return listResult.rows[0];
            
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async getListById(listId) {
        const client = await pool.connect();
        try {
            const listResult = await client.query(
                `SELECT 
                    l.id, 
                    l.title, 
                    l.created_at,
                    l.user_id,
                    u.username as owner_username
                 FROM lists l
                 JOIN users u ON l.user_id = u.user_id
                 WHERE l.id = $1`,
                [listId]
            );
            
            if (listResult.rows.length === 0) {
                return null;
            }
            
            const list = listResult.rows[0];
            
            const itemsResult = await client.query(
                `SELECT 
                    li.anime_id,
                    li.rank,
                    li.note,
                    a.title as anime_title,
                    a.alternative_title,
                    a.release_date,
                    a.season,
                    a.episodes,
                    a.synopsis,
                    a.rating,
                    a.rank as anime_rank,
                    m.url as image_url
                 FROM list_items li
                 JOIN anime a ON li.anime_id = a.anime_id
                 LEFT JOIN media m ON m.entity_id = a.anime_id 
                     AND m.entity_type = 'anime' 
                     AND m.media_type = 'image'
                 WHERE li.list_id = $1
                 ORDER BY li.rank ASC NULLS LAST, a.title ASC`,
                [listId]
            );
            
            list.items = itemsResult.rows;
            
            return list;
            
        } finally {
            client.release();
        }
    }

    static async updateList(listId, userId, { title, animeEntries = [] }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const listCheck = await client.query(
                'SELECT user_id FROM lists WHERE id = $1',
                [listId]
            );

            if (listCheck.rows.length === 0) {
                throw new Error('List not found');
            }

            if (listCheck.rows[0].user_id !== userId) {
                throw new Error('You do not have permission to edit this list');
            }

            if (title) {
                await client.query(
                    'UPDATE lists SET title = $1 WHERE id = $2',
                    [title.trim(), listId]
                );
            }

            if (Array.isArray(animeEntries)) {
                await client.query(
                    'DELETE FROM list_items WHERE list_id = $1',
                    [listId]
                );

                const validEntries = [];
                const animeIds = [];
                
                for (const entry of animeEntries) {
                    if (entry.anime_id && !isNaN(parseInt(entry.anime_id, 10))) {
                        validEntries.push(entry);
                        animeIds.push(parseInt(entry.anime_id, 10));
                    }
                }
                
                if (animeIds.length > 0) {
                    const animeCheck = await client.query(
                        'SELECT anime_id FROM anime WHERE anime_id = ANY($1::int[])',
                        [animeIds]
                    );
                    
                    const existingAnimeIds = new Set(animeCheck.rows.map(row => row.anime_id));
                    
                    for (const entry of validEntries) {
                        if (existingAnimeIds.has(parseInt(entry.anime_id, 10))) {
                            await client.query(
                                'INSERT INTO list_items (list_id, anime_id, rank, note) VALUES ($1, $2, $3, $4)',
                                [
                                    listId,
                                    entry.anime_id,
                                    entry.rank || null,
                                    entry.note || ''
                                ]
                            );
                        }
                    }
                }
            }
            
            await client.query('COMMIT');
            return this.getListById(listId); // Fetch and return the updated list with items
            
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async deleteList(listId, userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const listCheck = await client.query(
                'SELECT user_id FROM lists WHERE id = $1',
                [listId]
            );

            if (listCheck.rows.length === 0) {
                throw new Error('List not found');
            }

            if (listCheck.rows[0].user_id !== userId) {
                throw new Error('You do not have permission to delete this list');
            }

            await client.query(
                'DELETE FROM list_items WHERE list_id = $1',
                [listId]
            );

            await client.query(
                'DELETE FROM lists WHERE id = $1',
                [listId]
            );

            await client.query('COMMIT');
            return true;
            
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async getListItems(listId) {
        const itemsRes = await pool.query(
            `SELECT li.anime_id,
                    li.rank,
                    li.note,
                    a.title,
                    a.rating,
                    a.episodes,
                    m.url as image_url
             FROM list_items li
                      JOIN anime a ON li.anime_id = a.anime_id
                      LEFT JOIN media m ON a.anime_id = m.entity_id
                 AND m.entity_type = 'anime'
                 AND m.media_type = 'cover'
             WHERE li.list_id = $1
             ORDER BY
                 CASE WHEN li.rank IS NULL THEN 1 ELSE 0 END,
                 li.rank ASC,
                 a.title ASC`,
            [listId]
        );
        return itemsRes.rows;
    }

    static async getPaginatedListsByAnimeId(animeId, page, limit) {
        const offset = (page - 1) * limit;

        const countQuery = `
            SELECT COUNT(DISTINCT l.id) as total
            FROM lists l
            JOIN list_items li ON l.id = li.list_id
            WHERE li.anime_id = $1
        `;
        
        const countResult = await pool.query(countQuery, [animeId]);
        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        const listsQuery = `
            SELECT 
                l.id,
                l.title,
                l.created_at,
                u.username as owner_username,
                u.user_id as owner_id,
                (SELECT COUNT(*) FROM list_items WHERE list_id = l.id) as item_count
            FROM lists l
            JOIN list_items li ON l.id = li.list_id
            JOIN users u ON l.user_id = u.user_id
            WHERE li.anime_id = $1
            ORDER BY l.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const listsResult = await pool.query(listsQuery, [animeId, limit, offset]);

        return {
            data: listsResult.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit
            }
        };
    }
}

export default List;
