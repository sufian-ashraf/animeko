import React from 'react';
import { Link } from 'react-router-dom';
import './VisibilityRestriction.css';

const VisibilityRestriction = ({ 
  type = 'content', 
  message, 
  showIcon = true, 
  compact = false,
  showLoginButton = false
}) => {
  const getDefaultMessage = () => {
    switch (type) {
      case 'profile':
        return 'This profile is private and not accessible to you.';
      case 'list':
        return 'This list is private and not accessible to you.';
      case 'library':
        return 'This user\'s anime library is private.';
      default:
        return 'This content is not accessible to you.';
    }
  };

  const getMessage = () => message || getDefaultMessage();

  const getIcon = () => {
    switch (type) {
      case 'profile':
        return '👤';
      case 'list':
        return '📝';
      case 'library':
        return '📚';
      default:
        return '🔒';
    }
  };

  if (compact) {
    return (
      <div className="visibility-restriction compact">
        {showIcon && <span className="restriction-icon">{getIcon()}</span>}
        <span className="restriction-message">{getMessage()}</span>
      </div>
    );
  }

  return (
    <div className="visibility-restriction">
      {showIcon && <div className="restriction-icon">{getIcon()}</div>}
      <div className="restriction-content">
        <h3 className="restriction-title">Access Restricted</h3>
        <p className="restriction-message">{getMessage()}</p>
        <div className="restriction-actions">
          {showLoginButton && (
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
          )}
          <button 
            onClick={() => window.history.back()} 
            className="btn btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisibilityRestriction;
