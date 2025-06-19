import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import AnimeCard from '../AnimeCard';

// Mock the react-router-dom's useNavigate
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('AnimeCard Component', () => {
  const mockAnime = {
    anime_id: 1,
    title: 'Test Anime',
    english_title: 'Test Anime',
    image_url: 'https://example.com/image.jpg',
    episodes: 12,
    status: 'FINISHED',
    score: 8.5,
    user_status: 'WATCHING',
    user_episodes_watched: 5,
    user_score: 9,
    user_start_date: '2023-01-01',
    user_finish_date: '2023-01-15',
    user_rewatch_count: 0,
    user_notes: 'Great anime!'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders anime card with correct information', () => {
    render(
      <Router>
        <AnimeCard anime={mockAnime} />
      </Router>
    );

    // Check if anime title is rendered
    expect(screen.getByText(mockAnime.title)).toBeInTheDocument();
    
    // Check if image is rendered with correct alt text
    const image = screen.getByAltText(mockAnime.title);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockAnime.image_url);
    
    // Check if status is rendered
    expect(screen.getByText(mockAnime.status)).toBeInTheDocument();
    
    // Check if score is rendered
    expect(screen.getByText(mockAnime.score.toFixed(1))).toBeInTheDocument();
  });

  it('navigates to anime details when clicked', () => {
    render(
      <Router>
        <AnimeCard anime={mockAnime} />
      </Router>
    );

    // Click on the anime card
    const card = screen.getByRole('link');
    fireEvent.click(card);

    // Check if navigate was called with the correct URL
    expect(mockNavigate).toHaveBeenCalledWith(`/anime/${mockAnime.anime_id}`);
  });

  it('displays progress bar when user is watching', () => {
    render(
      <Router>
        <AnimeCard anime={mockAnime} />
      </Router>
    );

    // Check if progress bar is rendered
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    
    // Check progress percentage
    const expectedProgress = (mockAnime.user_episodes_watched / mockAnime.episodes) * 100;
    expect(progressBar).toHaveAttribute('aria-valuenow', expectedProgress.toString());
  });

  it('displays user score when provided', () => {
    render(
      <Router>
        <AnimeCard anime={mockAnime} />
      </Router>
    );

    // Check if user score is rendered
    expect(screen.getByText(`Your Score: ${mockAnime.user_score}`)).toBeInTheDocument();
  });

  it('displays "No image available" when image_url is not provided', () => {
    const animeWithoutImage = { ...mockAnime, image_url: null };
    
    render(
      <Router>
        <AnimeCard anime={animeWithoutImage} />
      </Router>
    );

    // Check if fallback text is displayed
    expect(screen.getByText('No image available')).toBeInTheDocument();
  });
});
