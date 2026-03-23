const db = require("../db");

const User = {
  async findById(id) {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0];
  },

  async findByLogin(login) {
    const result = await db.query("SELECT * FROM users WHERE login = $1", [login]);
    return result.rows[0];
  },

  async findAll() {
    try {
      // console.log('🔍 User.findAll SQL executing...');
      const result = await db.query("SELECT * FROM users ORDER BY login");
      // console.log('🔍 User.findAll result rows:', result.rows);
      return result.rows;
    } catch (err) {
      console.error('❌ Error in findAll:', err);
      return [];
    }
  },

  async create(login, passwordHash) {
    const result = await db.query(
      `INSERT INTO users (login, password, status) 
       VALUES ($1, $2, 'online') 
       RETURNING *`,
      [login, passwordHash]
    );
    return result.rows[0];
  },

  async updateStatus(id, status) {
    const result = await db.query(
      "UPDATE users SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    return result.rows[0];
  },

  async getUserChats(userId) {
    const result = await db.query(
      `SELECT c.*, 
              clm.message as last_msg, 
              clm.created_at as last_msg_time,
              clm.sender_name as last_msg_sender
       FROM chats c
       JOIN chat_users cu ON c.id = cu.chat_id
       LEFT JOIN chat_last_messages clm ON c.id = clm.chat_id
       WHERE cu.user_id = $1
       ORDER BY clm.created_at DESC NULLS LAST`,
      [userId]
    );
    return result.rows;
  },

  async updateStatusesFromSessions() {
    // Получаем всех пользователей с активной сессией (expire > NOW)
    const result = await db.query(`
    SELECT DISTINCT (sess->>'userId') as user_id
    FROM session
    WHERE expire > NOW()
      AND sess->>'userId' IS NOT NULL
  `);
    const activeUserIds = result.rows.map(r => parseInt(r.user_id));
    // Устанавливаем online для активных, offline для остальных
    await db.query('UPDATE users SET status = $1 WHERE id = ANY($2)', ['online', activeUserIds]);
    await db.query('UPDATE users SET status = $1 WHERE id != ALL($2)', ['offline', activeUserIds]);
  }
};

module.exports = User;