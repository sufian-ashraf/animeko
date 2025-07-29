import express from 'express';
import jwt from 'jsonwebtoken';
import Anime from '../models/Anime.js';
import Character from '../models/Character.js';
import VoiceActor from '../models/VoiceActor.js';
import User from '../models/User.js';
import List from '../models/List.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

// Optional authentication middleware to get user context for visibility
const optionalAuth = async (req, res, next) => {
  // Try to authenticate but don't fail if no token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch the full user data from the database
      const user = await User.findById(decoded.id);
      
      if (user) {
        // Set the user object on the request for visibility checks
        req.user = {
          id: user.user_id,
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          profile_bio: user.profile_bio,
          created_at: user.created_at,
          is_admin: user.is_admin === true || user.is_admin === 't' || user.is_admin === 1
        };
      }
    } catch (err) {
      // Authentication failed, but continue without user context
      console.log('Optional auth failed:', err.message);
    }
  }
  next();
};

// GET /api/search?type=anime|character|va|user|list&...params
router.get('/', optionalAuth, async (req, res) => {
  const { type } = req.query;
  try {
    let results = [];
    switch (type) {
      case 'anime':
        // Parse genres if provided as comma-separated string
        let genres = null;
        if (req.query.genres) {
          genres = req.query.genres.split(',').map(g => g.trim()).filter(Boolean);
        }
        
        results = await Anime.getAll({
          title: req.query.title,
          genre: req.query.genre,
          genres: genres,
          year: req.query.year,
          releaseYearStart: req.query.releaseYearStart,
          releaseYearEnd: req.query.releaseYearEnd,
          episodeCountMin: req.query.episodeCountMin,
          episodeCountMax: req.query.episodeCountMax,
          ratingMin: req.query.ratingMin,
          ratingMax: req.query.ratingMax,
          sortField: req.query.sortField,
          sortOrder: req.query.sortOrder,
        });
        break;
      case 'character':
        results = await Character.getAll({ name: req.query.name });
        break;
      case 'va':
        results = await VoiceActor.getAll({ name: req.query.name });
        break;
      case 'user':
        // Only authenticated users can search for other users
        if (!req.user) {
          return res.status(401).json({ error: 'Authentication required to search users' });
        }
        const currentUserIdForUsers = req.user?.id || null;
        results = await User.getAll({ username: req.query.username }, currentUserIdForUsers);
        break;
      case 'list':
        const currentUserId = req.user?.id || null;
        results = await List.getAll({ name: req.query.name }, currentUserId);
        break;
      default:
        return res.status(400).json({ error: 'Invalid search type' });
    }
    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
