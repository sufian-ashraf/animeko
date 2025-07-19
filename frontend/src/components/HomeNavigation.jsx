import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import "../styles/Navigation.css";

function Navigation() {
  const { user, logout, loading, isAdmin } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTitle, setSearchTitle] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
      navigate(
        `/search-results?title=${encodeURIComponent(searchTitle.trim())}`
      );
      setSearchTitle("");
      setMenuOpen(false);
    }
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
            <form onSubmit={handleSearch} className="search-bar">
              <input
                type="text"
                placeholder="Search anime..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                aria-label="Search anime by title"
              />
              <button type="submit">Search</button>
            </form>
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
                      <Link to="/profile" className="dropdown-item">
                        My Profile
                      </Link>
                      <Link to="/my-friends" className="dropdown-item">
                        My Friends
                      </Link>
                      <Link to="/my-lists" className="dropdown-item">
                        My Lists
                      </Link>
                      <Link to="/my-library" className="dropdown-item">
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
            <div className="auth-links">
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Navigation;