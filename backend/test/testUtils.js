const { jest } = require('@jest/globals');

// Mock database
const mockDb = {
  query: jest.fn()
};

// Set up global mocks
global.mockDb = mockDb;

// Mock the database module
jest.mock('../../db', () => ({
  query: mockDb.query
}));

// Import the mocked db
const db = require('../../db');

// Mock bcrypt if needed
if (!global.mockBcrypt) {
  global.mockBcrypt = {
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn().mockResolvedValue(true)
  };
}

// Create test user
const createTestUser = (overrides = {}) => ({
  user_id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: 'testpassword',
  is_admin: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

// Create test anime
const createTestAnime = (overrides = {}) => ({
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
  source: 'MANGA',
  duration: 24,
  rating: 'PG-13',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

// Mock query function
const mockQuery = (mockImplementation) => {
  mockDb.query.mockImplementation(mockImplementation);
};

// Reset all mocks
const resetMocks = () => {
  jest.clearAllMocks();
  mockDb.query.mockReset();
  
  // Reset global mocks
  if (global.mockJwt) {
    global.mockJwt.verify.mockReset();
    global.mockJwt.sign.mockReset();
  }
  
  if (global.mockBcrypt) {
    global.mockBcrypt.hash.mockReset().mockResolvedValue('hashed_password');
    global.mockBcrypt.compare.mockReset().mockResolvedValue(true);
  }
};

module.exports = {
  mockDb,
  createTestUser,
  createTestAnime,
  mockQuery,
  resetMocks,
  db
};

/**
 * Mock database query function
 */
const mockQuery = (result, options = {}) => {
  const { times = 1, error = null } = options;
  
  if (error) {
    mockDb.query.mockRejectedValueOnce(error);
    return;
  }
  
  const mockImplementation = () => {
    if (Array.isArray(result)) {
      return Promise.resolve({ rows: result });
    }
    if (result === undefined || result === null) {
      return Promise.resolve({ rows: [] });
    }
    return Promise.resolve({ rows: [result] });
  };
  
  // Apply the mock implementation the specified number of times
  for (let i = 0; i < times; i++) {
    mockDb.query.mockImplementationOnce(mockImplementation);
  }
};

// Reset all mocks
const resetMocks = () => {
  // Reset all mock functions
  jest.clearAllMocks();
  
  // Set default implementations
  mockDb.query.mockImplementation(() => Promise.resolve({ rows: [] }));
  
  mockJwt.verify.mockImplementation((token, secret, callback) => {
    if (token === 'valid_token') {
      callback(null, { id: 1, username: 'testuser', is_admin: false });
    } else if (token === 'admin_token') {
      callback(null, { id: 2, username: 'admin', is_admin: true });
    } else {
      callback(new Error('Invalid token'));
    }
  });
  
  mockJwt.sign.mockReturnValue('mocked_jwt_token');
  mockBcrypt.hash.mockResolvedValue('hashed_password');
  mockBcrypt.compare.mockResolvedValue(true);
};

// Helper to create a test user
const createTestUser = (overrides = {}) => ({
  user_id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashed_password',
  display_name: 'Test User',
  profile_bio: 'Test bio',
  is_admin: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

// Helper to create a test anime
const createTestAnime = (overrides = {}) => ({
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
  updated_at: new Date().toISOString(),
  ...overrides
});

// Helper to create a test genre
const createTestGenre = (overrides = {}) => ({
  genre_id: 1,
  name: 'Action',
  description: 'Action-packed anime with exciting fight scenes',
  created_at: new Date().toISOString(),
  ...overrides
});

module.exports = {
  mockQuery,
  resetMocks,
  createTestUser,
  createTestAnime,
  createTestGenre
};
