import cron from 'node-cron';
import pool from '../db.js';

// Cleanup old notifications every day at 2 AM
const notificationCleanupJob = cron.schedule('0 2 * * *', async () => {
    try {
        console.log('Running notification cleanup job...');
        
        const result = await pool.query('SELECT cleanup_old_notifications()');
        
        console.log('Notification cleanup completed successfully');
    } catch (error) {
        console.error('Error during notification cleanup:', error);
    }
}, {
    scheduled: false, // Don't start automatically
    timezone: "UTC"
});

export default notificationCleanupJob;
