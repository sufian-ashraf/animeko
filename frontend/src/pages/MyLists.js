import React, {useContext, useEffect, useState} from 'react';
import {AuthContext} from '../contexts/AuthContext';

function MyLists() {
    const [lists, setLists] = useState([]);
    const [newTitle, setNewTitle] = useState('');
    const {token} = useContext(AuthContext);


    // Fetch user's lists on component mount
    useEffect(() => {
        const fetchLists = async () => {
            try {
                const response = await fetch('/api/lists', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Fetched lists:', data);
                
                if (Array.isArray(data)) {
                    setLists(data);
                } else {
                    console.error('Unexpected list response format:', data);
                    setLists([]);
                }
            } catch (err) {
                console.error('Error fetching lists:', err);
                setLists([]);
            }
        };

        if (token) {
            fetchLists();
        }
    }, [token]);

    // Create new list
    const handleCreate = async (e) => {
        e.preventDefault();
        const title = newTitle.trim();
        if (!title) return;
        
        try {
            const response = await fetch('/api/lists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title })
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Failed to create list');
            }
            
            const createdList = await response.json();
            setLists(prevLists => [...prevLists, createdList]);
            setNewTitle('');
            
        } catch (error) {
            console.error('Error creating list:', error);
            alert(error.message || 'Failed to create list');
        }
    };

    return (<div className="my-lists-container">
        <h2>My Anime Lists</h2>

        {/* Create List Form */}
        <form className="create-list-form" onSubmit={handleCreate}>
            <input
                type="text"
                placeholder="New list title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
            />
            <button type="submit">Create List</button>
        </form>

        {/* User's Lists */}
        <div className="lists-grid">
            {lists.map(list => (<div key={list.id} className="list-card">
                <a href={`/my-lists/${list.id}`}>{list.title}</a>
            </div>))}
        </div>
    </div>);
}

export default MyLists;
