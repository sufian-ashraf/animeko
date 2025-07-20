
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import '../styles/TrailerModal.css';

const TrailerModal = ({ videoId, onClose }) => {
    useEffect(() => {
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        
        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    if (!videoId) {
        return null;
    }

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Anime Trailer">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button 
                    className="close-button" 
                    onClick={onClose}
                    aria-label="Close trailer modal"
                    type="button"
                >
                    ×
                </button>
                <div className="video-container">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Anime Trailer Video"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};

TrailerModal.propTypes = {
    videoId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default TrailerModal;
