
import pool from '../db.js';

export async function getMediaUrl(entityType, entityId, mediaType) {
    const result = await pool.query(
        `SELECT url FROM media WHERE entity_type = $1 AND entity_id = $2 AND media_type = $3`,
        [entityType, entityId, mediaType]
    );
    return result.rows.length > 0 ? result.rows[0].url : null;
}
