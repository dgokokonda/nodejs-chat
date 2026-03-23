const db = require("../db");

const Message = {
  async create(room, senderId, recipientId, message) {
    const result = await db.query(
      `INSERT INTO messages (room, sender_id, recipient_id, message, status)
       VALUES ($1, $2, $3, $4, 'unreaded')
       RETURNING *`,
      [room, senderId, recipientId, message]
    );
    return result.rows[0];
  },

  async findByRoom(room, limit = 20) {
    const result = await db.query(
      `SELECT m.*, u_s.login as sender_login, u_r.login as recipient_login
       FROM messages m
       LEFT JOIN users u_s ON m.sender_id = u_s.id
       LEFT JOIN users u_r ON m.recipient_id = u_r.id
       WHERE m.room = $1
       ORDER BY m.created_at DESC
       LIMIT $2`,
      [room, limit]
    );
    return result.rows.reverse();
  },

  async markAsRead(room, userId) {
    await db.query(
      `UPDATE messages 
       SET status = 'readed' 
       WHERE room = $1 AND recipient_id = $2 AND status = 'unreaded'`,
      [room, userId]
    );
  }
};

module.exports = Message;