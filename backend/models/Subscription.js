import db from '../db.js';

class Subscription {
  static async create({ userId, transactionId, subscriptionType, amount }) {
    const result = await db.query(
      `INSERT INTO transaction_history (user_id, transaction_id, subscription_type, amount, ispaid)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, transactionId, subscriptionType, amount, false]
    );
    return result.rows[0];
  }

  static async findByTransactionId(transactionId) {
    const result = await db.query(
      `SELECT * FROM transaction_history WHERE transaction_id = $1`,
      [transactionId]
    );
    return result.rows[0];
  }

  static async update(transactionId, { isPaid, completedOn, endDate }) {
    const result = await db.query(
      `UPDATE transaction_history
       SET ispaid = $1, completed_on = $2, end_date = $3
       WHERE transaction_id = $4
       RETURNING *`,
      [isPaid, completedOn, endDate, transactionId]
    );
    return result.rows[0];
  }
}

export default Subscription;