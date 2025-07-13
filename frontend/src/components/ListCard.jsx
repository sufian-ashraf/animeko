import React from 'react';
import { Link } from 'react-router-dom';
import './ListCard.css';

function ListCard({ list }) {
    const formattedDate = new Date(list.created_at).toLocaleDateString();
    
    return (
        <Link to={`/my-lists/${list.id}`} key={list.id} className="list-card">
            <div className="list-card-header">
                <h4 className="list-card-title">{list.title}</h4>
                <span className="list-item-count">{list.item_count} items</span>
            </div>
            <div className="list-card-footer">
                <span className="list-owner">By {list.owner_username || 'you'}</span>
                <span className="list-date">{formattedDate}</span>
            </div>
        </Link>
    );
}

export default ListCard; 