import pool from '../db.js';

// Check if user1 and user2 are confirmed friends
async function areUsersFriends(userId1, userId2) {
    if (!userId1 || !userId2 || userId1 === userId2) {
        return false;
    }
    
    const result = await pool.query(
        `SELECT 1 FROM friendship 
         WHERE ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)) 
         AND status = 'accepted'`,
        [userId1, userId2]
    );
    
    return result.rows.length > 0;
}

// Check if user can access profile based on visibility
export async function canAccessProfile(targetUserId, currentUserId, visibilityLevel) {
    if (!visibilityLevel) visibilityLevel = 'public';
    
    // Owner can always access their own profile
    if (currentUserId && targetUserId === currentUserId) {
        return true;
    }
    
    switch (visibilityLevel) {
        case 'public':
            return true;
        case 'private':
            return false; // Only owner can access (checked above)
        case 'friends_only':
            return currentUserId ? await areUsersFriends(currentUserId, targetUserId) : false;
        default:
            return false;
    }
}

// Check if user can access list based on visibility
export async function canAccessList(listOwnerId, currentUserId, visibilityLevel) {
    if (!visibilityLevel) visibilityLevel = 'public';
    
    // Owner can always access their own list
    if (currentUserId && listOwnerId === currentUserId) {
        return true;
    }
    
    switch (visibilityLevel) {
        case 'public':
            return true;
        case 'private':
            return false; // Only owner can access (checked above)
        case 'friends_only':
            return currentUserId ? await areUsersFriends(currentUserId, listOwnerId) : false;
        default:
            return false;
    }
}

// Sanitize profile data based on visibility and access rights
export function sanitizeProfileData(profileData, hasAccess, isOwner) {
    if (!profileData) return null;
    
    if (hasAccess) {
        // If user has access, return full data but exclude sensitive fields for non-owners
        const sanitized = { ...profileData };
        if (!isOwner) {
            delete sanitized.email;
            delete sanitized.subscription_status;
            delete sanitized.subscription_end_date;
            delete sanitized.active_transaction_id;
        }
        return sanitized;
    } else {
        // If no access, return minimal public data
        return {
            user_id: profileData.user_id,
            username: profileData.username,
            display_name: profileData.display_name,
            profile_bio: profileData.profile_bio, // Always show profile bio
            profile_picture_url: profileData.profile_picture_url, // Show profile image even for restricted profiles
            visibility_level: profileData.visibility_level,
            restricted: true,
            message: profileData.visibility_level === 'private' 
                ? 'This profile is private'
                : 'This profile is only visible to friends'
        };
    }
}

// Sanitize list data based on visibility and access rights
export function sanitizeListData(listData, hasAccess, isOwner) {
    if (!listData) return null;
    
    if (hasAccess) {
        // If user has access, return full data
        return listData;
    } else {
        // If no access, return minimal data
        return {
            id: listData.id,
            title: listData.title,
            created_at: listData.created_at,
            user_id: listData.user_id,
            owner_username: listData.owner_username,
            visibility_level: listData.visibility_level,
            restricted: true,
            message: listData.visibility_level === 'private' 
                ? 'This list is private'
                : 'This list is only visible to friends'
        };
    }
}

// Middleware to attach visibility check functions to req
export function attachVisibilityHelpers(req, res, next) {
    req.canAccessProfile = canAccessProfile;
    req.canAccessList = canAccessList;
    req.sanitizeProfileData = sanitizeProfileData;
    req.sanitizeListData = sanitizeListData;
    next();
}
