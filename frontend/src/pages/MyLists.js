import React, {useContext, useEffect, useState} from 'react';
import {AuthContext} from '../contexts/AuthContext';

function MyLists() {
    const [lists, setLists] = useState([]);
    const [newTitle, setNewTitle] = useState('');
    const {token} = useContext(AuthContext);


    // Fetch user's lists on component mount
    useEffect(() => {
        fetch('/lists', {
            headers: {'Authorization': `Bearer ${token}`}
        })
            .then(res => res.json())
            .then(data => {
                console.log('Fetched data:', data);
                if (Array.isArray(data)) {
                    setLists(data);
                } else if (Array.isArray(data.lists)) {
                    setLists(data.lists);
                } else {
                    console.error('Unexpected list response:', data);
                    setLists([]);
                }
            })
            .catch(err => {
                console.error('Error fetching lists:', err);
                setLists([]);
            });
    }, [token]);

    // Create new list
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        try {
            const res = await fetch('/lists', {
                method: 'POST', headers: {
                    'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`
                }, body: JSON.stringify({title: newTitle.trim()})
            });
            if (res.ok) {
                const created = await res.json();
                setLists([...lists, created]);
                setNewTitle('');
            } else {
                console.error('Create failed:', await res.text());
            }
        } catch (error) {
            console.error('Error creating list:', error);
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
