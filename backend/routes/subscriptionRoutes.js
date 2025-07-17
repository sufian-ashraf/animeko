
import express from 'express';
const router = express.Router();
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import authenticate from '../middlewares/authenticate.js';

// Get current user's subscription details
router.get('/current', authenticate, async (req, res) => {
  try {
    const user = await User.findByIdWithSubscription(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if subscription is still valid (not expired)
    const now = new Date();
    const isExpired = user.subscription_end_date && new Date(user.subscription_end_date) < now;
    const hasValidSubscription = user.subscription_status && !isExpired;

    const subscriptionData = {
      hasSubscription: hasValidSubscription,
      subscriptionType: user.subscription_type,
      transactionId: user.transaction_id,
      endDate: user.subscription_end_date,
      purchasedOn: user.subscription_purchased_on,
      isExpired: isExpired
    };

    res.json(subscriptionData);
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    res.status(500).json({ message: 'Error fetching subscription details' });
  }
});

router.post('/create-transaction', authenticate, async (req, res) => {
  const { subscriptionType, amount, transactionId } = req.body;
  const userId = req.user.user_id;

  console.log('Creating transaction:', { userId, transactionId, subscriptionType, amount });

  if (!transactionId) {
    return res.status(400).json({ message: 'Transaction ID is required' });
  }

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Check if user already has an active subscription
    const user = await User.findByIdWithSubscription(userId);
    if (user && user.subscription_status) {
      // Check if subscription is still valid (not expired)
      const now = new Date();
      const isExpired = user.subscription_end_date && new Date(user.subscription_end_date) < now;
      
      if (!isExpired) {
        return res.status(400).json({ 
          message: 'User already has an active subscription',
          subscriptionDetails: {
            subscriptionType: user.subscription_type,
            transactionId: user.transaction_id,
            endDate: user.subscription_end_date,
            purchasedOn: user.subscription_purchased_on
          }
        });
      }
    }

    const transaction = await Subscription.create({ userId, transactionId, subscriptionType, amount });
    console.log('Transaction created successfully:', transaction);
    res.status(201).json({ transactionId });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Error creating transaction' });
  }
});

router.post('/confirm-payment', async (req, res) => {
  const { transactionId, isPaid, completedOn } = req.body;

  try {
    const transaction = await Subscription.findByTransactionId(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.ispaid) {
      return res.status(200).json({ message: 'Payment already confirmed' });
    }

    const now = new Date(completedOn);
    let endDate;

    switch (transaction.subscription_type) {
      case 'monthly':
        endDate = new Date(now.setMonth(now.getMonth() + 1));
        break;
      case 'yearly':
        endDate = new Date(now.setFullYear(now.getFullYear() + 1));
        break;
      case 'lifetime':
        endDate = new Date(now.setFullYear(now.getFullYear() + 100));
        break;
      default:
        endDate = null;
    }

    const updatedTransaction = await Subscription.update(transactionId, { isPaid, completedOn, endDate });

    res.status(200).json(updatedTransaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error confirming payment' });
  }
});

export default router;
