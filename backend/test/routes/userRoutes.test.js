import request from 'supertest';
import { jest } from '@jest/globals';
import { mockQuery, resetMocks } from '../testUtils.js';
import app from '../../server.js';

describe('User Routes', () => {
  const mockUser = {
    user_id: 1,
    username: 'testuser',
    display_name: 'Test User',
    email: 'test@example.com',
    profile_bio: 'Test bio',
    created_at: new Date().toISOString(),
    is_admin: false
  };

  beforeEach(() => {
    resetMocks();
    // Mock authentication middleware
    jest.spyOn(require('jsonwebtoken'), 'verify').mockImplementation((token, secret, callback) => {
      if (token === 'valid_token') {
        callback(null, { id: 1, username: 'testuser', is_admin: false });
      } else if (token === 'admin_token') {
        callback(null, { id: 2, username: 'admin', is_admin: true });
      } else {
        callback(new Error('Invalid token'));
      }
    });
  });

  describe('GET /api/users', () => {
    it('should return a list of users (admin only)', async () => {
      mockQuery([mockUser]);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer admin_token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toMatchObject({
        user_id: mockUser.user_id,
        username: mockUser.username,
        email: mockUser.email
      });
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/users/:username', () => {
    it('should return a user by username', async () => {
      mockQuery([mockUser]);

      const response = await request(app)
        .get('/api/users/testuser')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        user_id: mockUser.user_id,
        username: mockUser.username,
        display_name: mockUser.display_name
      });
    });

    it('should return 404 if user not found', async () => {
      mockQuery([]);

      const response = await request(app)
        .get('/api/users/nonexistent')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('PUT /api/users/:username', () => {
    it('should update a user', async () => {
      const updatedData = {
        display_name: 'Updated Name',
        profile_bio: 'Updated bio'
      };

      mockQuery([{ ...mockUser, ...updatedData }]);

      const response = await request(app)
        .put('/api/users/testuser')
        .set('Authorization', 'Bearer valid_token')
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(updatedData);
    });

    it('should return 403 when updating another user', async () => {
      const response = await request(app)
        .put('/api/users/otheruser')
        .set('Authorization', 'Bearer valid_token')
        .send({ display_name: 'New Name' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Not authorized to update this user');
    });
  });

  describe('DELETE /api/users/:username', () => {
    it('should delete a user (admin only)', async () => {
      mockQuery([mockUser]);
      mockQuery();

      const response = await request(app)
        .delete('/api/users/testuser')
        .set('Authorization', 'Bearer admin_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User deleted successfully');
    });

    it('should allow users to delete their own account', async () => {
      mockQuery([mockUser]);
      mockQuery();

      const response = await request(app)
        .delete('/api/users/testuser')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
    });

    it('should return 403 when trying to delete another user', async () => {
      const response = await request(app)
        .delete('/api/users/otheruser')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/users/search', () => {
    it('should search for users', async () => {
      mockQuery([{ user_id: 2, username: 'otheruser', display_name: 'Other User' }]);

      const response = await request(app)
        .get('/api/users/search?q=other')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toMatchObject({
        user_id: 2,
        username: 'otheruser',
        display_name: 'Other User'
      });
    });

    it('should return 400 if no search query is provided', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Search query is required');
    });
  });
});
