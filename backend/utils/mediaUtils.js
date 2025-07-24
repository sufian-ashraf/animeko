
import pool from '../db.js';

export async function getMediaUrl(entityType, entityId, mediaType) {
    const result = await pool.query(
        `SELECT url FROM media WHERE entity_type = $1 AND entity_id = $2 AND media_type = $3`,
        [entityType, entityId, mediaType]
    );
    return result.rows.length > 0 ? result.rows[0].url : null;
}

/**
 * Safely parse an integer from a string parameter
 * @param {string} value - The value to parse
 * @param {string} paramName - The name of the parameter (for error messages)
 * @returns {number} - The parsed integer
 * @throws {Error} - If the value is not a valid integer
 */
export function parseIntParam(value, paramName = 'parameter') {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1) {
        throw new Error(`Invalid ${paramName}: must be a positive integer`);
    }
    return parsed;
}

/**
 * Safely parse an integer from body data with optional null/undefined handling
 * @param {any} value - The value to parse
 * @param {string} paramName - The name of the parameter (for error messages)
 * @param {boolean} allowNull - Whether to allow null/undefined values
 * @returns {number|null} - The parsed integer or null if allowed
 * @throws {Error} - If the value is not a valid integer
 */
export function parseIntBody(value, paramName = 'parameter', allowNull = false) {
    if (allowNull && (value === null || value === undefined || value === '')) {
        return null;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1) {
        throw new Error(`Invalid ${paramName}: must be a positive integer`);
    }
    return parsed;
}
