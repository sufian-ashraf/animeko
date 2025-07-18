import User from '../models/User.js';

/**
 * Middleware to verify that the current user has an active, valid subscription.
 * This should be placed *after* the `authenticate` middleware in the route chain.
 * It checks the database in real-time, ignoring any potentially stale data in the JWT.
 *
 * @example
 * import requireSubscription from '../middlewares/requireSubscription.js';
 * import authenticate from '../middlewares/authenticate.js';
 * router.get('/premium-content', [authenticate, requireSubscription], (req, res) => {
 *   // This code will only run if the user is authenticated AND has a valid subscription.
 *   res.json({ message: 'Here is your premium content.' });
 * });
 */
const requireSubscription = async (req, res, next) => {
  try {
    // We assume the 'authenticate' middleware has already run and set req.user.id
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const user = await User.findByIdWithSubscription(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // The real-time check against the database
    const now = new Date();
    const hasValidSubscription = user.subscription_status && user.subscription_end_date && new Date(user.subscription_end_date) > now;

    if (hasValidSubscription) {
      return next(); // User has a valid subscription, proceed.
    } else {
      // User does not have a valid subscription.
      return res.status(403).json({ message: 'Access denied. Active subscription required.' });
    }
  } catch (error) {
    console.error('Error in requireSubscription middleware:', error);
    return res.status(500).json({ message: 'Server error during subscription check.' });
  }
};

export default requireSubscription;
