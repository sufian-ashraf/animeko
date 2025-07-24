import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/ListCard.module.css';

function ListCard({ list, currentUser }) {
    const navigate = useNavigate();
    const formattedDate = new Date(list.created_at).toLocaleDateString();
    
    const handleOwnerClick = (e) => {
        e.preventDefault(); // Prevent the outer Link from navigating
        e.stopPropagation(); // Stop event propagation

        let targetUserId = list.owner_id;
        
        // If owner_id is still not present, fallback to current user
        if (!targetUserId && currentUser) {
            targetUserId = currentUser.user_id;
        }
        
        if (targetUserId) {
            navigate(`/profile/${targetUserId}`);
        } else {
            console.warn('Could not determine user ID for navigation.', { list, currentUser });
        }
    };

    // Determine display text for owner
    const getOwnerDisplayText = () => {
        if (currentUser && list.owner_id === currentUser.user_id) {
            return 'you';
        }
        return list.owner_username || 'you';
    };

    return (
        <Link to={`/lists/${list.id}`} key={list.id} className={styles.listCard}>
            <div className={styles.listCardHeader}>
                <h4 className={styles.listCardTitle}>{list.title}</h4>
                <span className={styles.listItemCount}>{list.item_count} items</span>
            </div>
            <div className={styles.listCardFooter}>
                <span className={styles.listOwner}>
                    By <span onClick={handleOwnerClick} className="username-link" style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                        {getOwnerDisplayText()}
                    </span>
                </span>
                <span className={styles.listDate}>{formattedDate}</span>
            </div>
        </Link>
    );
}

export default ListCard; 