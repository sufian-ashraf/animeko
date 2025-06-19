const request = require('supertest');
const { jest } = require('@jest/globals');
const { createTestUser, mockQuery, resetMocks, mockDb } = require('../testUtils');
const { mockJwt } = require('../setup');

// Import app
const app = require('../../server');

// Import modules after mocks are set up
const jwt = require('jsonwebtoken');
const db = require('../../db');

// Set up test user
const testUser = createTestUser();

// Mock bcrypt
const mockBcrypt = global.mockBcrypt;

// Mock JWT tokens
const testToken = 'test.token.value';
const testPayload = { user_id: testUser.user_id, username: testUser.username };

// Mock the JWT sign function
mockJwt.sign.mockImplementation(() => testToken);
mockJwt.verify.mockImplementation(() => testPayload);

// Mock bcrypt functions
mockBcrypt.hash.mockResolvedValue('hashed_password');
mockBcrypt.compare.mockResolvedValue(true);

// Mock database responses
const mockUserQuery = {
  rows: [{
    ...testUser,
    password: 'hashed_password'
  }]
};

// Reset all mocks before each test
beforeEach(() => {
  resetMocks();
  // Re-apply the mock implementations after reset
  mockJwt.sign.mockImplementation(() => testToken);
  mockJwt.verify.mockImplementation(() => testPayload);
  mockBcrypt.hash.mockResolvedValue('hashed_password');
  mockBcrypt.compare.mockResolvedValue(true);
  mockDb.query.mockResolvedValue(mockUserQuery);
});

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMocks();
    
    // Set up default mocks
    db.query.mockImplementation(() => Promise.resolve({ rows: [] }));
    jwt.verify.mockImplementation((token, secret, callback) => {
      if (token === 'valid_token') {
        callback(null, { id: 1, username: 'testuser', is_admin: false });
      } else if (token === 'admin_token') {
        callback(null, { id: 2, username: 'admin', is_admin: true });
      } else {
        callback(new Error('Invalid token'));
      }
    });
    jwt.sign.mockReturnValue('mocked_jwt_token');
    bcrypt.hash.mockResolvedValue('hashed_password');
    bcrypt.compare.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const newUser = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        display_name: 'New User'
      };

      // Mock that no user exists with this email or username
      mockQuery(null); // First check for existing username
      mockQuery(null); // Then check for existing email
      
      // Mock user creation
      mockQuery([{
        ...newUser,
        user_id: 2,
        password: 'hashed_password',
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        username: newUser.username,
        email: newUser.email,
        display_name: newUser.display_name
      });
      expect(global.mockBcrypt.hash).toHaveBeenCalledWith(newUser.password, 10);
    });

    it('should return 400 if username already exists', async () => {
      const existingUser = createTestUser({ username: 'existinguser' });
      
      // Mock that a user with this username already exists
      mockQuery([existingUser]);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'existinguser',
          email: 'new@example.com',
          password: 'password123',
          display_name: 'Existing User'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Username already exists');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const user = createTestUser();
      
      // Mock user lookup
      mockQuery([user]);
      
      // Mock password comparison to succeed
      global.mockBcrypt.compare.mockResolvedValueOnce(true);

      const credentials = {
        email: user.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toBe('mocked_jwt_token');
      expect(global.mockJwt.sign).toHaveBeenCalledWith(
        { id: user.user_id, username: user.username, is_admin: user.is_admin },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    });

    it('should return 401 with invalid email', async () => {
      // Mock user not found
      mockQuery([]);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });

    it('should return 401 with invalid password', async () => {
      const user = createTestUser();
      
      // Mock user lookup
      mockQuery([user]);
      
      // Mock password comparison to fail
      global.mockBcrypt.compare.mockResolvedValueOnce(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const user = createTestUser();
      
      // Mock user lookup
      mockQuery([user]);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        user_id: user.user_id,
        username: user.username,
        email: user.email
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'No token provided');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid token');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear the JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Successfully logged out');
      
      // Verify the response clears the token cookie
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token=;');
    });
  });
});
