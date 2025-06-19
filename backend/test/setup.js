// Setup file for Jest tests
const { jest } = require('@jest/globals');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

// Mock JWT
const mockJwt = {
  verify: jest.fn(),
  sign: jest.fn()
};

// Mock bcrypt functions
const mockBcrypt = {
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
};

// Set up global mocks
global.mockJwt = mockJwt;
global.mockBcrypt = mockBcrypt;

// Mock modules with our mock implementations
jest.mock('jsonwebtoken', () => ({
  verify: mockJwt.verify,
  sign: mockJwt.sign
}));

// Mock bcryptjs if available
try {
  require('bcryptjs');
  jest.mock('bcryptjs', () => ({
    hash: mockBcrypt.hash,
    compare: mockBcrypt.compare
  }));
} catch (e) {
  // bcryptjs not installed, using mock object directly
}

module.exports = { mockJwt, mockBcrypt };

// Mock Express response methods
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

// Mock Express request
const mockRequest = (body = {}, params = {}, query = {}, headers = {}) => ({
  body,
  params,
  query,
  headers: {
    authorization: 'Bearer valid_token',
    ...headers
  },
  cookies: {},
  session: {}
});

// Mock Express next function
const mockNext = jest.fn();

// Setup global mocks
global.mockResponse = mockResponse;
global.mockRequest = mockRequest;
global.mockNext = mockNext;

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset default mocks
  if (global.mockDb && global.mockDb.query) {
    global.mockDb.query.mockReset();
    global.mockDb.query.mockImplementation(() => Promise.resolve({ rows: [] }));
  }
  
  if (global.mockJwt) {
    global.mockJwt.verify.mockReset();
    global.mockJwt.sign.mockReset();
    
    global.mockJwt.verify.mockImplementation((token, secret, callback) => {
      if (token === 'valid_token') {
        callback(null, { id: 1, username: 'testuser', is_admin: false });
      } else if (token === 'admin_token') {
        callback(null, { id: 2, username: 'admin', is_admin: true });
      } else {
        callback(new Error('Invalid token'));
      }
    });
    
    global.mockJwt.sign.mockReturnValue('mocked_jwt_token');
  }
  
  if (global.mockBcrypt) {
    global.mockBcrypt.hash.mockReset();
    global.mockBcrypt.compare.mockReset();
    global.mockBcrypt.hash.mockResolvedValue('hashed_password');
    global.mockBcrypt.compare.mockResolvedValue(true);
  }
  
  if (global.mockNext) {
    global.mockNext.mockReset();
  }
});
