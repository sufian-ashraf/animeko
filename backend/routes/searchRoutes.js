import express from 'express';
import Anime from '../models/Anime.js';
import Character from '../models/Character.js';
import VoiceActor from '../models/VoiceActor.js';
import User from '../models/User.js';
import List from '../models/List.js';

const router = express.Router();

// GET /api/search?type=anime|character|va|user|list&...params
router.get('/', async (req, res) => {
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
        results = await User.getAll({ username: req.query.username });
        break;
      case 'list':
        results = await List.getAll({ name: req.query.name });
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
