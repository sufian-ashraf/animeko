import { render, screen, act } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../AuthContext';
import { jwtDecode } from 'jwt-decode';

// Mock the jwt-decode module
jest.mock('jwt-decode', () => jest.fn());

// Mock the fetch API
global.fetch = jest.fn();

const TestComponent = () => {
  const { user, token, loading, error, login, logout } = React.useContext(AuthContext);
  
  return (
    <div>
      <div data-testid="user">{JSON.stringify(user)}</div>
      <div data-testid="token">{token}</div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="error">{error}</div>
      <button onClick={() => login('testuser', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should provide initial context values', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('token').textContent).toBe('');
    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('should handle successful login', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      is_admin: false
    };

    // Mock successful login response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'test_token',
        user: mockUser
      })
    });

    // Mock jwtDecode
    jwtDecode.mockReturnValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click login button
    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });

    // Check if fetch was called with correct parameters
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password'
        })
      })
    );

    // Check if user is set in the context
    expect(JSON.parse(screen.getByTestId('user').textContent)).toMatchObject(mockUser);
    expect(screen.getByTestId('token').textContent).toBe('test_token');
  });

  it('should handle login error', async () => {
    // Mock failed login response
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        message: 'Invalid credentials'
      })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click login button
    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });

    // Check if error is set in the context
    expect(screen.getByTestId('error').textContent).toBe('Invalid credentials');
  });

  it('should handle logout', async () => {
    // Set initial state
    localStorage.setItem('token', 'test_token');
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click logout button
    const logoutButton = screen.getByText('Logout');
    await act(async () => {
      logoutButton.click();
    });

    // Check if token is removed from localStorage
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    
    // Check if user is cleared from context
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('token').textContent).toBe('');
  });
});
