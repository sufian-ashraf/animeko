import React from 'react';
import { Link } from 'react-router-dom';

const CastCard = ({
  characterId,
  name,
  imageUrl,
  vaName,
  vaId,
  va_image_url,
}) => {
  return (
    <div className="cast-card">
      <div style={{ textAlign: 'center' }}>
        <img
          src={imageUrl || '/src/images/image_not_available.jpg'}
          alt={name}
          style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }}
          onError={e => {
            e.target.onerror = null;
            e.target.src = '/src/images/image_not_available.jpg';
          }}
        />
      </div>
      <div className="cast-info">
        {characterId ? (
          <Link to={`/character/${characterId}`} className="link">
            <strong>{name}</strong>
          </Link>
        ) : (
          <strong>{name}</strong>
        )}
        {vaName && (
          <div className="va-info">
            <span>voiced by</span>
            {vaId ? (
              <Link to={`/va/${vaId}`} className="va-link">
                <div className="va-thumb-container">
                  <img
                    src={va_image_url || '/src/images/image_not_available.jpg'}
                    alt={vaName}
                    className="va-thumb"
                    style={{ width: '100%', height: '100%', objectFit: 'cover'}}
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = '/src/images/image_not_available.jpg';
                    }}
                  />
                </div>
                <span>{vaName}</span>
              </Link>
            ) : (
              <span style={{ marginLeft: 4 }}>{vaName}</span>
            )}
          </div>
        )}
        {/* No description in cast-card, to match AnimePage.jsx */}
      </div>
    </div>
  );
};

export default CastCard;
