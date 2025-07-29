import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import AdvancedSearchForm from "./AdvancedSearchForm";
import "../styles/Navigation.css";

function Navigation() {
  const { user, logout, loading, isAdmin } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTitle, setSearchTitle] = useState("");
  const [searchType, setSearchType] = useState("anime"); // New state for search type

  // Reset search type to anime if user logs out and was searching users
  useEffect(() => {
    if (!user && searchType === 'user') {
      setSearchType('anime');
    }
  }, [user, searchType]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  if (loading) return null;

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTitle.trim()) {
      let query = '';
      switch (searchType) {
        case 'anime':
          query = `title=${encodeURIComponent(searchTitle.trim())}`;
          break;
        case 'character':
          query = `name=${encodeURIComponent(searchTitle.trim())}`;
          break;
        case 'va':
          query = `name=${encodeURIComponent(searchTitle.trim())}`;
          break;
        case 'user':
          query = `username=${encodeURIComponent(searchTitle.trim())}`;
          break;
        case 'list':
          query = `name=${encodeURIComponent(searchTitle.trim())}`;
          break;
        default:
          query = `title=${encodeURIComponent(searchTitle.trim())}`;
      }
      navigate(`/search-results?type=${searchType}&${query}`);
      setSearchTitle("");
      setMenuOpen(false);
    }
  };

  const handleAdvancedSearchChange = (advancedParams) => {
    // Check if advanced params are empty (for clear all functionality)
    const hasAdvancedParams = Object.values(advancedParams).some(value => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value && value !== '';
    });
    
    // Check if there's a basic search term
    const hasBasicSearch = searchTitle.trim() !== '';
    
    // If no search params at all, don't navigate (this handles "Clear All")
    if (!hasAdvancedParams && !hasBasicSearch) {
      setShowAdvancedSearch(false);
      setMenuOpen(false);
      return;
    }
    
    // Build the URL with advanced search parameters
    let query = '';
    const params = new URLSearchParams();
    params.set('type', searchType);
    
    // Add basic search if title is provided
    if (searchTitle.trim()) {
      switch (searchType) {
        case 'anime':
          params.set('title', searchTitle.trim());
          break;
        case 'character':
          params.set('name', searchTitle.trim());
          break;
        case 'va':
          params.set('name', searchTitle.trim());
          break;
        case 'user':
          params.set('username', searchTitle.trim());
          break;
        case 'list':
          params.set('name', searchTitle.trim());
          break;
        default:
          params.set('title', searchTitle.trim());
      }
    }
    
    // Add advanced search params
    Object.entries(advancedParams).forEach(([key, value]) => {
      if (value && value !== '') {
        if (key === 'genres' && Array.isArray(value) && value.length > 0) {
          params.set('genres', value.join(','));
        } else if (key !== 'genres') {
          params.set(key, value);
        }
      }
    });
    
    navigate(`/search-results?${params.toString()}`);
    setShowAdvancedSearch(false);
    setMenuOpen(false);
  };


  return (
    <>
      <div className="nav-left">
        <Link to={isAdmin ? "/admin" : "/"} className="brand">
          <div className="brand-wrapper">
            <span className="brand-text">AnimeKo</span>
            {user && user.subscription_status === true && (
              <span className="premium-badge">PRO</span>
            )}
          </div>
        </Link>
      </div>

      <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        <div className={menuOpen ? "ham-box ham-box-open" : "ham-box"}>
          <span
            className={menuOpen ? "line line-1 line-1-open" : "line line-1"}
          ></span>
          <span
            className={menuOpen ? "line line-2 line-2-open" : "line line-2"}
          ></span>
          <span
            className={menuOpen ? "line line-3 line-3-open" : "line line-3"}
          ></span>
        </div>
      </div>

      <div className={`nav-main-links ${menuOpen ? "open" : ""}`}>
        {!isAdmin && (
          <div className="nav-center">
            <div className="search-container" style={{ position: 'relative' }}>
              <form onSubmit={handleSearch} className="search-bar">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="search-type-dropdown"
                  aria-label="Select search type"
                  style={{ marginRight: '8px', padding: '4px' }}
                >
                  <option value="anime">Anime</option>
                  <option value="character">Character</option>
                  <option value="va">Voice Actor</option>
                  {user && <option value="user">User</option>}
                  <option value="list">List</option>
                </select>
                <input
                  type="text"
                  placeholder={`Search ${searchType}...`}
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  aria-label={`Search ${searchType} by name`}
                />
                <button type="submit">Search</button>
              </form>
              
              {/* Advanced Search Button - positioned right below search bar */}
              {searchType === 'anime' && (
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '0.25rem',
                  height: '1.5rem', // Fixed height to prevent layout shift
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <button 
                    type="button"
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isDarkMode ? '#3498db' : '#2980b9',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      textDecoration: 'underline',
                      padding: '0.25rem 0'
                    }}
                  >
                    {showAdvancedSearch ? 'Hide Advanced Search' : 'Advanced Search'}
                  </button>
                </div>
              )}
              
              {/* Reserve space for other search types to maintain consistent navbar height */}
              {searchType !== 'anime' && (
                <div style={{ 
                  height: '1.5rem', // Same height as advanced search button area
                  marginTop: '0.25rem'
                }} />
              )}
            </div>
            
            {/* Advanced Search Form - positioned absolutely outside the navbar flow */}
            {searchType === 'anime' && showAdvancedSearch && (
              <>
                {/* Backdrop to close advanced search when clicking outside */}
                <div 
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    backgroundColor: 'transparent'
                  }}
                  onClick={() => setShowAdvancedSearch(false)}
                />
                <div style={{ 
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 10000,
                  marginTop: '0.5rem',
                  width: '400px',
                  maxWidth: '90vw'
                }}>
                  <AdvancedSearchForm 
                    onSearchParamsChange={handleAdvancedSearchChange}
                    initialParams={{}}
                    isInNavbar={true}
                  />
                </div>
              </>
            )}
          </div>
        )}

        <div className="nav-right">
          <div className="theme-toggle-slider" onClick={toggleDarkMode}>
            <div className={`slider-track ${isDarkMode ? "dark" : "light"}`}>
              <span className={`slider-icon ${isDarkMode ? 'right' : 'left'}`}>{isDarkMode ? "🌑" : "☀️"}</span>
              <div
                className="slider-thumb"
                style={{ left: isDarkMode ? '4px' : '34px' }}
              />
            </div>
          </div>

          {user ? (
            <div className="user-menu" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="nav-link profile-button"
              >
                Menu
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  {!isAdmin && (
                    <>
                      <Link to="/streaming" className="dropdown-item">
                        Streaming
                      </Link>
                      <Link to="/profile" className="dropdown-item">
                        My Profile
                      </Link>
                      <Link to="/my-friends" className="dropdown-item">
                        My Friends
                      </Link>
                      <Link to="/my-lists" className="dropdown-item">
                        My Lists
                      </Link>
                      <Link to="/anime-library" className="dropdown-item">
                        My Library
                      </Link>
                      <Link to="/subscription" className="dropdown-item">
                        Subscription
                      </Link>
                    </>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className="dropdown-item">
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="dropdown-item logout-button"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="user-menu" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="nav-link profile-button"
              >
                Menu
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <Link 
                    to="/streaming" 
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Streaming
                  </Link>
                  <Link 
                    to="/login" 
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Navigation;