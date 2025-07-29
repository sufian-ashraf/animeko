import React from 'react';
import { Link } from 'react-router-dom';
import FriendshipButton from './FriendshipButton';
import defaultAvatar from '../images/default_avatar.svg';
import '../styles/UserSearchCard.css';

const UserSearchCard = ({ user }) => {
    return (
        <div className="user-search-card">
            <div className="user-search-content">
                <div className="user-avatar">
                    <img 
                        src={user.profile_image_url || defaultAvatar} 
                        alt={user.username}
                        className="user-profile-image"
                        onError={(e) => {
                            e.target.src = defaultAvatar;
                        }}
                    />
                </div>
                <div className="user-info">
                    <h4>
                        <Link to={`/profile/${user.id}`} className="username-link">
                            {user.username}
                        </Link>
                    </h4>
                    {user.display_name && (
                        <p className="display-name">Display: {user.display_name}</p>
                    )}
                </div>
                <div className="user-actions">
                    <FriendshipButton targetUserId={user.id} size="small" />
                </div>
            </div>
        </div>
    );
};

export default UserSearchCard;
