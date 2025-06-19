import request from 'supertest';
import { jest } from '@jest/globals';
import { mockQuery, resetMocks } from '../testUtils.js';
import app from '../../server.js';

describe('Friend Routes', () => {
  const mockUser = {
    user_id: 1,
    username: 'testuser',
    display_name: 'Test User',
    email: 'test@example.com',
    is_admin: false
  };

  const mockFriend = {
    user_id: 2,
    username: 'frienduser',
    display_name: 'Friend User',
    email: 'friend@example.com',
    is_admin: false
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

  describe('GET /api/friends', () => {
    it('should return a list of friends', async () => {
      mockQuery([{ ...mockFriend, friendship_id: 1, status: 'ACCEPTED' }]);

      const response = await request(app)
        .get('/api/friends')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toMatchObject({
        user_id: mockFriend.user_id,
        username: mockFriend.username,
        display_name: mockFriend.display_name
      });
    });

    it('should return 401 without valid token', async () => {
      const response = await request(app)
        .get('/api/friends')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/friends/requests', () => {
    it('should send a friend request', async () => {
      mockQuery([{ ...mockFriend }]); // User exists
      mockQuery([{ ...mockUser }]); // No existing request
      mockQuery([{ friendship_id: 1, user_id: 1, friend_id: 2, status: 'PENDING' }]); // Request created

      const response = await request(app)
        .post('/api/friends/requests')
        .set('Authorization', 'Bearer valid_token')
        .send({ username: 'frienduser' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Friend request sent');
    });

    it('should return 404 if user not found', async () => {
      mockQuery([]); // User not found

      const response = await request(app)
        .post('/api/friends/requests')
        .set('Authorization', 'Bearer valid_token')
        .send({ username: 'nonexistent' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('PUT /api/friends/requests/:id', () => {
    it('should accept a friend request', async () => {
      mockQuery([{ friendship_id: 1, user_id: 2, friend_id: 1, status: 'PENDING' }]); // Request exists
      mockQuery([{ ...mockFriend }]); // Friend user exists
      mockQuery([{ friendship_id: 1, user_id: 2, friend_id: 1, status: 'ACCEPTED' }]); // Request updated

      const response = await request(app)
        .put('/api/friends/requests/1')
        .set('Authorization', 'Bearer valid_token')
        .send({ action: 'accept' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Friend request accepted');
    });

    it('should reject a friend request', async () => {
      mockQuery([{ friendship_id: 1, user_id: 2, friend_id: 1, status: 'PENDING' }]); // Request exists
      mockQuery(); // Request deleted

      const response = await request(app)
        .put('/api/friends/requests/1')
        .set('Authorization', 'Bearer valid_token')
        .send({ action: 'reject' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Friend request rejected');
    });
  });

  describe('DELETE /api/friends/:id', () => {
    it('should remove a friend', async () => {
      mockQuery([{ friendship_id: 1, user_id: 1, friend_id: 2, status: 'ACCEPTED' }]); // Friendship exists
      mockQuery(); // Friendship deleted

      const response = await request(app)
        .delete('/api/friends/2')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Friend removed');
    });

    it('should return 404 if friendship not found', async () => {
      mockQuery([]); // No friendship found

      const response = await request(app)
        .delete('/api/friends/999')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Friendship not found');
    });
  });
});
