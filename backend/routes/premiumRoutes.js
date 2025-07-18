import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import requireSubscription from '../middlewares/requireSubscription.js';

const router = express.Router();

/**
 * GET /api/premium-content-check
 * This route is used by the frontend's SubscriptionProtectedRoute to verify
 * if the user has an active subscription in real-time.
 * It doesn't return any specific data, just a success status if access is granted.
 */
router.get(
  '/premium-content-check',
  [authenticate, requireSubscription],
  (req, res) => {
    res.status(200).json({ message: 'Subscription active. Access granted.' });
  }
);

export default router;
