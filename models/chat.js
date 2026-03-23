const db = require("../db");

const Chat = {
  async findById(id) {
    const result = await db.query("SELECT * FROM chats WHERE id = $1", [id]);
    return result.rows[0];
  },

  async findByRoom(room) {
    const result = await db.query("SELECT * FROM chats WHERE room = $1", [room]);
    return result.rows[0];
  },

  async findByUsers(userId1, userId2) {
    const result = await db.query(
      `SELECT c.* FROM chats c
       JOIN chat_users cu1 ON c.id = cu1.chat_id AND cu1.user_id = $1
       JOIN chat_users cu2 ON c.id = cu2.chat_id AND cu2.user_id = $2
       WHERE cu1.user_id = $1 AND cu2.user_id = $2`,
      [userId1, userId2]
    );
    return result.rows[0];
  },

  async create(room, users) {
    const chatResult = await db.query(
      "INSERT INTO chats (room) VALUES ($1) RETURNING *",
      [room]
    );
    const chat = chatResult.rows[0];

    for (const user of users) {
      await db.query(
        "INSERT INTO chat_users (chat_id, user_id, login) VALUES ($1, $2, $3)",
        [chat.id, user.id, user.login]
      );
    }
    return chat;
  },

  async updateLastMessage(chatId, senderId, senderName, message) {
    await db.query(
      `INSERT INTO chat_last_messages (chat_id, sender_id, sender_name, message, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (chat_id) 
       DO UPDATE SET sender_id = $2, sender_name = $3, message = $4, created_at = CURRENT_TIMESTAMP`,
      [chatId, senderId, senderName, message]
    );
  },

  async getChatUsers(chatId) {
    const result = await db.query(
      "SELECT user_id, login FROM chat_users WHERE chat_id = $1",
      [chatId]
    );
    return result.rows;
  }
};

module.exports = Chat;