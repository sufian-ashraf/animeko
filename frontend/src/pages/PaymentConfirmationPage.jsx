import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/PaymentConfirmationPage.css';

const PaymentConfirmationPage = () => {
  const [status, setStatus] = useState('pending');
  const location = useLocation();
  const transactionId = new URLSearchParams(location.search).get('transactionId');

  useEffect(() => {
    const pollStatus = async () => {
      // In a real application, you would make an API call to your backend to get the transaction status.
      console.log(`Polling status for transaction ID: ${transactionId}`);
      // Here, we'll simulate it with a timeout.
      const timeout = setTimeout(() => {
        // Simulate a random outcome
        const randomStatus = Math.random() > 0.5 ? 'success' : 'failed';
        setStatus(randomStatus);
      }, 3000);

      return () => clearTimeout(timeout);
    };

    if (transactionId) {
      pollStatus();
    }
  }, [transactionId]);

  return (
    <div className="payment-confirmation-container">
      {status === 'pending' && (
        <div className="pending-container">
          <h2>Processing your payment...</h2>
          <div className="loader"></div>
        </div>
      )}

      {status === 'success' && (
        <div className="success-container">
          <h2>Payment Successful!</h2>
          <p>Thank you for your purchase. Your subscription is now active.</p>
        </div>
      )}

      {status === 'failed' && (
        <div className="failed-container">
          <h2>Payment Failed</h2>
          <p>Unfortunately, we were unable to process your payment. Please try again.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentConfirmationPage;
