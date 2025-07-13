import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/SubscriptionPage.css';

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const handlePayment = async (plan) => {
    let amount;
    switch (plan) {
      case 'monthly':
        amount = 9.99;
        break;
      case 'yearly':
        amount = 99.99;
        break;
      case 'lifetime':
        amount = 299.99;
        break;
      default:
        amount = 0;
    }

    try {
      const response = await fetch('https://test-project-production-bf2e.up.railway.app/api/create-trx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '13acc245-b584-4767-b80a-5c9a1fe9d71e',
        },
        body: JSON.stringify({
          username: 'scariful',
          amount: parseInt(amount),
        }),
      });

      const data = await response.json();

      if (data.valid) {
        const transactionId = data.transacitonId;
        const redirectURL = encodeURIComponent(`${window.location.origin}/payment-confirmation?transactionId=${transactionId}`);
        const gatewayURL = `https://tpg-six.vercel.app/gateway?transactionid=${transactionId}&redirectURL=${redirectURL}`;
        window.location.href = gatewayURL; // Redirect to the payment gateway
      } else {
        console.error('Failed to create transaction:', data.message);
        alert('Failed to initiate payment. Please try again.');
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('An error occurred while initiating payment. Please try again.');
    }
  };

  return (
    <div className="subscription-container">
      <h1>Choose Your Subscription Plan</h1>
      <div className="subscription-options">
        <div className="subscription-plan">
          <h2>Monthly</h2>
          <p className="price">$9.99/month</p>
          <button onClick={() => handlePayment('monthly')}>Continue to Payment</button>
        </div>
        <div className="subscription-plan">
          <h2>Yearly</h2>
          <p className="price">$99.99/year</p>
          <button onClick={() => handlePayment('yearly')}>Continue to Payment</button>
        </div>
        <div className="subscription-plan">
          <h2>Lifetime</h2>
          <p className="price">$299.99</p>
          <button onClick={() => handlePayment('lifetime')}>Continue to Payment</button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
