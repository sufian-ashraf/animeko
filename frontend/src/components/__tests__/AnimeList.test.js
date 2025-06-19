import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import AnimeList from '../AnimeList';

// Mock the fetch API
global.fetch = jest.fn();

// Mock the useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'test_token',
    user: { id: 1, username: 'testuser', is_admin: false },
  }),
}));

describe('AnimeList Component', () => {
  const mockAnimeList = [
    {
      anime_id: 1,
      title: 'Test Anime 1',
      image_url: 'https://example.com/image1.jpg',
      episodes: 12,
      status: 'FINISHED',
      score: 8.5,
    },
    {
      anime_id: 2,
      title: 'Test Anime 2',
      image_url: 'https://example.com/image2.jpg',
      episodes: 24,
      status: 'ONGOING',
      score: 7.8,
    },
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock successful fetch response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnimeList,
    });
  });

  const renderAnimeList = () => {
    return render(
      <Router>
        <AnimeList />
      </Router>
    );
  };

  it('fetches and displays anime list', async () => {
    renderAnimeList();
    
    // Check if loading state is shown initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for data to be loaded
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/anime',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test_token',
            'Content-Type': 'application/json',
          },
        })
      );
    });
    
    // Check if anime items are rendered
    expect(await screen.findByText('Test Anime 1')).toBeInTheDocument();
    expect(screen.getByText('Test Anime 2')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('displays error message when fetch fails', async () => {
    // Mock failed fetch response
    fetch.mockReset();
    fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
    
    renderAnimeList();
    
    // Check if error message is displayed
    expect(await screen.findByText('Error loading anime. Please try again later.')).toBeInTheDocument();
  });

  it('displays empty state when no anime found', async () => {
    // Mock empty response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    
    renderAnimeList();
    
    // Check if empty state is displayed
    expect(await screen.findByText('No anime found.')).toBeInTheDocument();
  });

  it('filters anime based on search query', async () => {
    renderAnimeList();
    
    // Wait for initial data to load
    await screen.findByText('Test Anime 1');
    
    // Mock filtered response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockAnimeList[0]],
    });
    
    // Simulate search
    const searchInput = screen.getByPlaceholderText('Search anime...');
    fireEvent.change(searchInput, { target: { value: 'Test Anime 1' } });
    
    // Check if search was triggered
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/anime?search=Test+Anime+1',
        expect.any(Object)
      );
    });
    
    // Check if filtered results are displayed
    expect(await screen.findByText('Test Anime 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Anime 2')).not.toBeInTheDocument();
  });
});
