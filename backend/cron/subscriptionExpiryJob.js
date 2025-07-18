
import cron from 'node-cron';
import User from '../models/User.js';

// Schedule a task to run every hour to check for expired subscriptions.
const subscriptionExpiryJob = cron.schedule('0 * * * *', async () => {
  console.log('Running subscription expiry check...');
  try {
    const now = new Date();
    const expiredUsers = await User.findExpiredSubscriptions(now);

    if (expiredUsers.length > 0) {
      console.log(`Found ${expiredUsers.length} expired subscriptions. Updating status...`);
      await User.deactivateSubscriptions(expiredUsers.map(u => u.user_id));
      console.log('Successfully updated expired subscriptions.');
    } else {
      console.log('No expired subscriptions found.');
    }
  } catch (error) {
    console.error('Error checking for expired subscriptions:', error);
  }
});

export default subscriptionExpiryJob;
