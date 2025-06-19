import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Login from '../Login';

// Mock the useNavigate hook
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => ({
    login: jest.fn(),
    error: null,
    loading: false,
  }),
}));

describe('Login Page', () => {
  const mockLogin = jest.fn();
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock the AuthContext
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      login: mockLogin,
      error: null,
      loading: false,
    }));
  });

  const renderLogin = () => {
    return render(
      <Router>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </Router>
    );
  };

  it('renders login form', () => {
    renderLogin();
    
    // Check if form elements are rendered
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/register');
  });

  it('validates form inputs', async () => {
    renderLogin();
    
    // Click login without filling any fields
    const loginButton = screen.getByRole('button', { name: 'Login' });
    fireEvent.click(loginButton);
    
    // Check for validation errors
    expect(await screen.findByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    
    // Check that login was not called
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login with form data', async () => {
    renderLogin();
    
    // Fill in the form
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByRole('button', { name: 'Login' });
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);
    
    // Check that login was called with the right parameters
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  it('displays error message when login fails', () => {
    // Mock AuthContext to return an error
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      login: mockLogin,
      error: 'Invalid credentials',
      loading: false,
    }));
    
    renderLogin();
    
    // Check if error message is displayed
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('shows loading state when logging in', () => {
    // Mock AuthContext to show loading state
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      login: mockLogin,
      error: null,
      loading: true,
    }));
    
    renderLogin();
    
    // Check if loading state is shown
    const loginButton = screen.getByRole('button', { name: 'Logging in...' });
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toBeDisabled();
  });
});
