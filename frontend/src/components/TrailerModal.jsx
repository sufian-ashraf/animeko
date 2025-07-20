
import React from 'react';
import PropTypes from 'prop-types';
import '../styles/TrailerModal.css';

const TrailerModal = ({ videoId, onClose }) => {
    if (!videoId) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>X</button>
                <div className="video-container">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="YouTube video player"
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
