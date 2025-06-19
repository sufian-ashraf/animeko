import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router, useParams } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Profile from '../Profile';

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

// Mock the fetch API
global.fetch = jest.fn();

describe('Profile Component', () => {
  const mockUser = {
    user_id: 1,
    username: 'testuser',
    display_name: 'Test User',
    email: 'test@example.com',
    profile_bio: 'Test bio',
    created_at: '2023-01-01T00:00:00.000Z',
    is_admin: false,
  };

  const mockAnimeList = [
    {
      anime_id: 1,
      title: 'Test Anime 1',
      image_url: 'https://example.com/image1.jpg',
      episodes: 12,
      status: 'FINISHED',
      score: 8.5,
      user_status: 'WATCHING',
      user_episodes_watched: 5,
    },
  ];

  const mockFriends = [
    { user_id: 2, username: 'friend1', display_name: 'Friend One' },
    { user_id: 3, username: 'friend2', display_name: 'Friend Two' },
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock useParams to return a username
    useParams.mockReturnValue({ username: 'testuser' });
    
    // Mock fetch responses
    fetch.mockImplementation((url) => {
      if (url.includes('/api/users/testuser')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockUser,
        });
      }
      if (url.includes('/api/anime/user/testuser')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockAnimeList,
        });
      }
      if (url.includes('/api/friends/testuser')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockFriends,
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });
  });

  const renderProfile = () => {
    return render(
      <Router>
        <AuthProvider>
          <Profile />
        </AuthProvider>
      </Router>
    );
  };

  it('loads and displays user profile', async () => {
    renderProfile();
    
    // Check if loading state is shown initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for data to be loaded
    expect(await screen.findByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText('Test bio')).toBeInTheDocument();
    
    // Check if anime list is loaded
    expect(screen.getByText('Test Anime 1')).toBeInTheDocument();
    
    // Check if friends list is loaded
    expect(screen.getByText('Friend One')).toBeInTheDocument();
    expect(screen.getByText('Friend Two')).toBeInTheDocument();
  });

  it('displays edit button for own profile', async () => {
    // Mock AuthContext to return current user
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      user: { id: 1, username: 'testuser' },
      token: 'test_token',
    }));
    
    renderProfile();
    
    // Wait for data to be loaded
    await screen.findByText('Test User');
    
    // Check if edit button is shown
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('does not display edit button for other users', async () => {
    // Mock AuthContext to return different user
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      user: { id: 2, username: 'otheruser' },
      token: 'test_token',
    }));
    
    renderProfile();
    
    // Wait for data to be loaded
    await screen.findByText('Test User');
    
    // Check if edit button is not shown
    expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
  });

  it('handles profile editing', async () => {
    // Mock AuthContext to return current user
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      user: { id: 1, username: 'testuser' },
      token: 'test_token',
      updateUser: jest.fn(),
    }));
    
    // Mock successful update response
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          ...mockUser,
          display_name: 'Updated User',
          profile_bio: 'Updated bio',
        }),
      })
    );
    
    renderProfile();
    
    // Wait for data to be loaded
    await screen.findByText('Test User');
    
    // Click edit button
    fireEvent.click(screen.getByText('Edit Profile'));
    
    // Update form fields
    const displayNameInput = screen.getByLabelText('Display Name');
    const bioInput = screen.getByLabelText('Bio');
    
    fireEvent.change(displayNameInput, { target: { value: 'Updated User' } });
    fireEvent.change(bioInput, { target: { value: 'Updated bio' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Save Changes'));
    
    // Check if update was called with correct data
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/users/testuser',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            display_name: 'Updated User',
            profile_bio: 'Updated bio',
          }),
        })
      );
    });
    
    // Check if the UI is updated
    expect(await screen.findByText('Updated User')).toBeInTheDocument();
    expect(screen.getByText('Updated bio')).toBeInTheDocument();
  });

  it('displays error when profile fetch fails', async () => {
    // Mock failed fetch response
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Failed to fetch'))
    );
    
    renderProfile();
    
    // Check if error message is displayed
    expect(await screen.findByText('Error loading profile')).toBeInTheDocument();
  });
});
