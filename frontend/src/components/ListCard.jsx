import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/ListCard.module.css';

function ListCard({ list }) {
    const formattedDate = new Date(list.created_at).toLocaleDateString();
    
    return (
        <Link to={`/lists/${list.id}`} key={list.id} className={styles.listCard}>
            <div className={styles.listCardHeader}>
                <h4 className={styles.listCardTitle}>{list.title}</h4>
                <span className={styles.listItemCount}>{list.item_count} items</span>
            </div>
            <div className={styles.listCardFooter}>
                <span className={styles.listOwner}>By <Link to={`/profile/${list.owner_id}`} className="username-link">{list.owner_username || 'you'}</Link></span>
                <span className={styles.listDate}>{formattedDate}</span>
            </div>
        </Link>
    );
}

export default ListCard; 