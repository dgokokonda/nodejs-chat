const db = require("../db");

const Message = {
  // Преобразование snake_case -> camelCase
  _toCamelCase(row) {
    return {
      id: row.id,
      room: row.room,
      senderId: row.sender_id,
      recipientId: row.recipient_id,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
    };
  },

  async create(room, senderId, recipientId, message) {
    const result = await db.query(
      `INSERT INTO messages (room, sender_id, recipient_id, message, status)
       VALUES ($1, $2, $3, $4, 'unreaded')
       RETURNING *`,
      [room, senderId, recipientId, message]
    );
    return this._toCamelCase(result.rows[0]);
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
    const rows = result.rows.reverse();
    return rows.map(row => ({
      ...this._toCamelCase(row),
      sender: row.sender_login ? { id: row.sender_id, login: row.sender_login } : null,
      recipient: row.recipient_login ? { id: row.recipient_id, login: row.recipient_login } : null,
    }));
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