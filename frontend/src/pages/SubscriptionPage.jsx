import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SubscriptionPage.css';

const SubscriptionPage = () => {
  const navigate = useNavigate();

  const handlePayment = (plan) => {
    // In a real application, you would make an API call to generate a transaction ID.
    const transactionId = Math.random().toString(36).substring(2, 15);
    console.log(`Proceeding to payment for ${plan} plan with transaction ID: ${transactionId}`);
    navigate(`/payment-confirmation?transactionId=${transactionId}`);
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
