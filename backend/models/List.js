import pool from '../db.js';

class List {
    // Search lists by name/title (partial match) - only public lists visible to non-friends
    static async getAll({ name } = {}, currentUserId = null) {
        let query = `
            SELECT 
                l.id,
                l.title,
                l.visibility_level,
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
        
        // Only show public lists to non-authenticated users
        if (!currentUserId) {
            query += ` AND l.visibility_level = 'public'`;
        } else {
            // For authenticated users, show public lists + their own lists + friends_only lists from friends
            query += ` AND (
                l.visibility_level = 'public' 
                OR l.user_id = $${paramCount++}
                OR (l.visibility_level = 'friends_only' AND EXISTS (
                    SELECT 1 FROM friendship f 
                    WHERE ((f.requester_id = $${paramCount++} AND f.addressee_id = l.user_id) 
                           OR (f.requester_id = l.user_id AND f.addressee_id = $${paramCount++}))
                    AND f.status = 'accepted'
                ))
            )`;
            params.push(currentUserId, currentUserId, currentUserId);
        }
        
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
                l.visibility_level,
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
             WHERE l.user_id = $1
             ORDER BY l.created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    static async getAllPublicLists(currentUserId = null) {
        let query = `
            SELECT 
                l.id,
                l.title,
                l.visibility_level,
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
        `;
        
        const params = [];
        
        // Apply visibility filters
        if (!currentUserId) {
            query += ` WHERE l.visibility_level = 'public'`;
        } else {
            query += ` WHERE (
                l.visibility_level = 'public' 
                OR l.user_id = $1
                OR (l.visibility_level = 'friends_only' AND EXISTS (
                    SELECT 1 FROM friendship f 
                    WHERE ((f.requester_id = $2 AND f.addressee_id = l.user_id) 
                           OR (f.requester_id = l.user_id AND f.addressee_id = $3))
                    AND f.status = 'accepted'
                ))
            )`;
            params.push(currentUserId, currentUserId, currentUserId);
        }
        
        query += ' ORDER BY l.created_at DESC';
        
        const result = await pool.query(query, params);
        return result.rows;
    }

    static async searchLists(keyword, currentUserId = null) {
        let query = `
            SELECT 
                l.id,
                l.title,
                l.visibility_level,
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
        `;
        
        const params = [`%${keyword.toLowerCase()}%`];
        
        // Apply visibility filters
        if (!currentUserId) {
            query += ` AND l.visibility_level = 'public'`;
        } else {
            query += ` AND (
                l.visibility_level = 'public' 
                OR l.user_id = $2
                OR (l.visibility_level = 'friends_only' AND EXISTS (
                    SELECT 1 FROM friendship f 
                    WHERE ((f.requester_id = $3 AND f.addressee_id = l.user_id) 
                           OR (f.requester_id = l.user_id AND f.addressee_id = $4))
                    AND f.status = 'accepted'
                ))
            )`;
            params.push(currentUserId, currentUserId, currentUserId);
        }
        
        query += ' ORDER BY l.created_at DESC';
        
        const result = await pool.query(query, params);
        
        console.log('[DEBUG] Search results count:', result.rows.length);
        console.log('[DEBUG] Search results:', result.rows.map(r => ({
            id: r.id,
            title: r.title,
            visibility: r.visibility_level,
            owner: r.owner_username
        })));
        
        return result.rows;
    }

    static async getListsByAnimeId(animeId, currentUserId = null) {
        let query = `
            SELECT DISTINCT 
                l.id,
                l.title,
                l.visibility_level,
                l.created_at,
                u.username as owner_username,
                u.user_id as owner_id,
                (SELECT COUNT(*) FROM list_items WHERE list_id = l.id) as item_count
             FROM lists l
             JOIN users u ON l.user_id = u.user_id
             JOIN list_items li ON l.id = li.list_id
             WHERE li.anime_id = $1
        `;
        
        const params = [animeId];
        let paramCount = 2;
        
        // Apply visibility filters
        if (!currentUserId) {
            query += ` AND l.visibility_level = 'public'`;
        } else {
            query += ` AND (
                l.visibility_level = 'public' 
                OR l.user_id = $${paramCount++}
                OR (l.visibility_level = 'friends_only' AND EXISTS (
                    SELECT 1 FROM friendship f 
                    WHERE ((f.requester_id = $${paramCount} AND f.addressee_id = l.user_id) 
                           OR (f.requester_id = l.user_id AND f.addressee_id = $${paramCount}))
                    AND f.status = 'accepted'
                ))
            )`;
            params.push(currentUserId, currentUserId, currentUserId);
        }
        
        query += ' ORDER BY l.created_at DESC';
        const result = await pool.query(query, params);
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
                    
                    for (const [idx, entry] of validEntries.entries()) {
                        if (existingAnimeIds.has(parseInt(entry.anime_id, 10))) {
                            await client.query(
                                'INSERT INTO list_items (list_id, anime_id, note) VALUES ($1, $2, $3)',
                                [
                                    listId,
                                    entry.anime_id,
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
                    l.visibility_level,
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
                    li.note,
                    a.title as anime_title,
                    a.alternative_title,
                    a.release_date,
                    a.season,
                    a.episodes,
                    a.synopsis,
                    a.rating,
                    a.rating as anime_rating,
                    m.url as image_url
                 FROM list_items li
                 JOIN anime a ON li.anime_id = a.anime_id
                 LEFT JOIN media m ON m.entity_id = a.anime_id 
                     AND m.entity_type = 'anime' 
                     AND m.media_type = 'image'
                 WHERE li.list_id = $1
                 ORDER BY a.title ASC`,
                [listId]
            );
            
            list.items = itemsResult.rows;
            
            return list;
            
        } finally {
            client.release();
        }
    }

    static async updateList(listId, userId, { title, visibility_level, animeEntries = [] }) {
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

            // Update title and/or visibility_level if provided
            let updateFields = [];
            let updateValues = [];
            let paramCount = 1;

            if (title) {
                updateFields.push(`title = $${paramCount++}`);
                updateValues.push(title.trim());
            }
            if (visibility_level !== undefined) {
                updateFields.push(`visibility_level = $${paramCount++}`);
                updateValues.push(visibility_level);
            }

            if (updateFields.length > 0) {
                updateValues.push(listId);
                await client.query(
                    `UPDATE lists SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
                    updateValues
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
                    
                    for (const [idx, entry] of validEntries.entries()) {
                        if (existingAnimeIds.has(parseInt(entry.anime_id, 10))) {
                            await client.query(
                                'INSERT INTO list_items (list_id, anime_id, note) VALUES ($1, $2, $3)',
                                [
                                    listId,
                                    entry.anime_id,
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

    static async updateListMetadata(listId, userId, { title, visibility_level }) {
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

            // Update only title and/or visibility_level if provided
            let updateFields = [];
            let updateValues = [];
            let paramCount = 1;

            if (title) {
                if (title.trim().length === 0) {
                    throw new Error('List title is required');
                }
                updateFields.push(`title = $${paramCount++}`);
                updateValues.push(title.trim());
            }
            if (visibility_level !== undefined) {
                updateFields.push(`visibility_level = $${paramCount++}`);
                updateValues.push(visibility_level);
            }

            if (updateFields.length === 0) {
                throw new Error('No fields to update');
            }

            updateValues.push(listId);
            await client.query(
                `UPDATE lists SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
                updateValues
            );
            
            await client.query('COMMIT');
            return this.getListById(listId); // Fetch and return the updated list
            
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
             ORDER BY a.title ASC`,
            [listId]
        );
        return itemsRes.rows;
    }

    static async getPaginatedListsByAnimeId(animeId, page, limit, currentUserId = null) {
        const offset = (page - 1) * limit;

        let countQuery = `
            SELECT COUNT(DISTINCT l.id) as total
            FROM lists l
            JOIN list_items li ON l.id = li.list_id
            WHERE li.anime_id = $1
        `;
        
        let countParams = [animeId];
        
        // Apply visibility filters for count
        if (!currentUserId) {
            countQuery += ` AND l.visibility_level = 'public'`;
        } else {
            countQuery += ` AND (
                l.visibility_level = 'public' 
                OR l.user_id = $2
                OR (l.visibility_level = 'friends_only' AND EXISTS (
                    SELECT 1 FROM friendship f 
                    WHERE ((f.requester_id = $3 AND f.addressee_id = l.user_id) 
                           OR (f.requester_id = l.user_id AND f.addressee_id = $4))
                    AND f.status = 'accepted'
                ))
            )`;
            countParams.push(currentUserId, currentUserId, currentUserId);
        }
        
        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        let listsQuery = `
            SELECT 
                l.id,
                l.title,
                l.visibility_level,
                l.created_at,
                u.username as owner_username,
                u.user_id as owner_id,
                (SELECT COUNT(*) FROM list_items WHERE list_id = l.id) as item_count
            FROM lists l
            JOIN list_items li ON l.id = li.list_id
            JOIN users u ON l.user_id = u.user_id
            WHERE li.anime_id = $1
        `;
        
        let listsParams = [animeId];
        
        // Apply same visibility filters for lists
        if (!currentUserId) {
            listsQuery += ` AND l.visibility_level = 'public'`;
        } else {
            listsQuery += ` AND (
                l.visibility_level = 'public' 
                OR l.user_id = $${listsParams.length + 1}
                OR (l.visibility_level = 'friends_only' AND EXISTS (
                    SELECT 1 FROM friendship f 
                    WHERE ((f.requester_id = $${listsParams.length + 2} AND f.addressee_id = l.user_id) 
                           OR (f.requester_id = l.user_id AND f.addressee_id = $${listsParams.length + 3}))
                    AND f.status = 'accepted'
                ))
            )`;
            listsParams.push(currentUserId, currentUserId, currentUserId);
        }
        
        listsQuery += ` ORDER BY l.created_at DESC LIMIT $${listsParams.length + 1} OFFSET $${listsParams.length + 2}`;
        listsParams.push(limit, offset);

        const listsResult = await pool.query(listsQuery, listsParams);

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
