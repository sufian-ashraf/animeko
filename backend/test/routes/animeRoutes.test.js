const request = require('supertest');
const { jest } = require('@jest/globals');
const { createTestAnime, createTestUser, mockQuery, resetMocks, mockDb } = require('../testUtils');
const { mockJwt } = require('../setup');

// Import app
const app = require('../../server');

// Import modules after mocks are set up
const db = require('../../db');

// Set up test data
const testUser = createTestUser();
const testAnime = createTestAnime();

// Mock JWT tokens
const testToken = 'test.token.value';
const testPayload = { user_id: testUser.user_id, username: testUser.username };

// Mock the JWT verify function
mockJwt.verify.mockImplementation(() => testPayload);

// Mock database responses
const mockAnimeQuery = {
  rows: [testAnime]
};

const mockAnimeListQuery = {
  rows: [testAnime],
  rowCount: 1
};

// Reset all mocks before each test
beforeEach(() => {
  resetMocks();
  // Re-apply the mock implementations after reset
  mockJwt.verify.mockImplementation(() => testPayload);
  mockDb.query.mockResolvedValue(mockAnimeQuery);
});

describe('Anime Routes', () => {
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

  describe('GET /api/anime', () => {
    it('should return a list of anime', async () => {
      const mockAnimeList = [mockAnime];
      mockQuery(mockAnimeList);

      const response = await request(app)
        .get('/api/anime')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toMatchObject({
        anime_id: mockAnime.anime_id,
        title: mockAnime.title
      });
    });

    it('should return 401 without valid token', async () => {
      const response = await request(app)
        .get('/api/anime')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/anime/:id', () => {
    it('should return a single anime by ID', async () => {
      mockQuery([mockAnime]);

      const response = await request(app)
        .get('/api/anime/1')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        anime_id: mockAnime.anime_id,
        title: mockAnime.title
      });
    });

    it('should return 404 if anime not found', async () => {
      mockQuery([]);

      const response = await request(app)
        .get('/api/anime/999')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Anime not found');
    });
  });
});
