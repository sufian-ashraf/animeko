import request from 'supertest';
import { jest } from '@jest/globals';
import { mockQuery, resetMocks } from '../testUtils.js';
import app from '../../server.js';

describe('Genre Routes', () => {
  const mockGenre = {
    genre_id: 1,
    name: 'Action',
    description: 'Action-packed anime with exciting fight scenes',
    created_at: new Date().toISOString()
  };

  const mockAnime = {
    anime_id: 1,
    title: 'Test Anime',
    english_title: 'Test Anime',
    japanese_title: 'テストアニメ',
    synopsis: 'A test anime',
    episodes: 12,
    status: 'FINISHED',
    start_date: '2023-01-01',
    end_date: '2023-03-31',
    season: 'WINTER',
    year: 2023,
    image_url: 'https://example.com/image.jpg',
    trailer_url: 'https://youtube.com/embed/example',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  beforeEach(() => {
    resetMocks();
    // Mock authentication middleware
    jest.spyOn(require('jsonwebtoken'), 'verify').mockImplementation((token, secret, callback) => {
      if (token === 'valid_token') {
        callback(null, { id: 1, username: 'testuser', is_admin: false });
      } else {
        callback(new Error('Invalid token'));
      }
    });
  });

  describe('GET /api/genres', () => {
    it('should return a list of genres', async () => {
      mockQuery([mockGenre]);

      const response = await request(app)
        .get('/api/genres')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toMatchObject({
        genre_id: mockGenre.genre_id,
        name: mockGenre.name,
        description: mockGenre.description
      });
    });

    it('should return 401 without valid token', async () => {
      const response = await request(app)
        .get('/api/genres')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/genres/:id', () => {
    it('should return a single genre by ID', async () => {
      mockQuery([mockGenre]);

      const response = await request(app)
        .get('/api/genres/1')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        genre_id: mockGenre.genre_id,
        name: mockGenre.name,
        description: mockGenre.description
      });
    });

    it('should return 404 if genre not found', async () => {
      mockQuery([]);

      const response = await request(app)
        .get('/api/genres/999')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Genre not found');
    });
  });

  describe('GET /api/genres/:id/anime', () => {
    it('should return anime for a specific genre', async () => {
      mockQuery([{ ...mockAnime, genre_id: 1 }]);

      const response = await request(app)
        .get('/api/genres/1/anime')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toMatchObject({
        anime_id: mockAnime.anime_id,
        title: mockAnime.title,
        episodes: mockAnime.episodes
      });
    });

    it('should return 404 if no anime found for genre', async () => {
      mockQuery([]);

      const response = await request(app)
        .get('/api/genres/999/anime')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'No anime found for this genre');
    });
  });

  describe('POST /api/genres', () => {
    it('should create a new genre (admin only)', async () => {
      const newGenre = {
        name: 'New Genre',
        description: 'A new genre description'
      };

      mockQuery([{ ...newGenre, genre_id: 2, created_at: new Date().toISOString() }]);

      const response = await request(app)
        .post('/api/genres')
        .set('Authorization', 'Bearer valid_token')
        .send(newGenre);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: newGenre.name,
        description: newGenre.description
      });
      expect(response.body).toHaveProperty('genre_id');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/genres')
        .set('Authorization', 'Bearer valid_token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/genres/:id', () => {
    it('should update a genre (admin only)', async () => {
      const updatedData = {
        name: 'Updated Genre',
        description: 'Updated description'
      };

      mockQuery([{ ...mockGenre, ...updatedData }]);

      const response = await request(app)
        .put('/api/genres/1')
        .set('Authorization', 'Bearer valid_token')
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(updatedData);
    });
  });

  describe('DELETE /api/genres/:id', () => {
    it('should delete a genre (admin only)', async () => {
      mockQuery([mockGenre]);
      mockQuery();

      const response = await request(app)
        .delete('/api/genres/1')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Genre deleted successfully');
    });
  });
});
