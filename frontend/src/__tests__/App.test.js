import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import App from '../App';

// Mock the components that are lazy loaded
jest.mock('../pages/Home', () => () => <div>Home Page</div>);
jest.mock('../pages/Login', () => () => <div>Login Page</div>);
jest.mock('../pages/Register', () => () => <div>Register Page</div>);

// Mock the AuthContext
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    loading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

describe('App Component', () => {
  const renderApp = (initialRoute = '/') => {
    window.history.pushState({}, 'Test page', initialRoute);
    return render(
      <Router>
        <App />
      </Router>
    );
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders the home page by default', async () => {
    renderApp('/');
    
    // Check if the home page is rendered
    expect(await screen.findByText('Home Page')).toBeInTheDocument();
  });

  it('renders the login page when navigating to /login', async () => {
    renderApp('/login');
    
    // Check if the login page is rendered
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
  });

  it('renders the register page when navigating to /register', async () => {
    renderApp('/register');
    
    // Check if the register page is rendered
    expect(await screen.findByText('Register Page')).toBeInTheDocument();
  });

  it('renders 404 page when navigating to an unknown route', async () => {
    renderApp('/unknown-route');
    
    // Check if the 404 page is rendered
    expect(await screen.findByText('404 - Page Not Found')).toBeInTheDocument();
  });

  it('displays loading state when authentication is in progress', async () => {
    // Mock AuthContext to show loading state
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      user: null,
      token: null,
      loading: true,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
    }));
    
    renderApp('/');
    
    // Check if loading spinner is displayed
    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays error message when there is an authentication error', async () => {
    // Mock AuthContext to show error
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      user: null,
      token: null,
      loading: false,
      error: 'Authentication failed',
      login: jest.fn(),
      logout: jest.fn(),
    }));
    
    renderApp('/');
    
    // Check if error message is displayed
    expect(await screen.findByText('Authentication failed')).toBeInTheDocument();
  });

  it('renders protected routes when user is authenticated', async () => {
    // Mock AuthContext with authenticated user
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      user: { id: 1, username: 'testuser', is_admin: false },
      token: 'test_token',
      loading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
    }));
    
    renderApp('/profile/testuser');
    
    // Check if the profile page is rendered
    expect(await screen.findByText('Profile Page')).toBeInTheDocument();
  });

  it('redirects to login page when accessing protected route without authentication', async () => {
    // Mock AuthContext with unauthenticated user
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      user: null,
      token: null,
      loading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
    }));
    
    renderApp('/profile/testuser');
    
    // Check if redirected to login page
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
  });
});
