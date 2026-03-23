const { gql } = require('graphql-tag');

const typeDefs = gql`
  type Chat {
    id: ID!
    room: String!
    users: [ChatUser]!
    lastMsg: LastMessage
    createdAt: String!
    updatedAt: String!
  }

  type ChatUser {
    userId: ID!
    login: String!
  }

  type LastMessage {
    senderId: ID
    senderName: String
    message: String
    createdAt: String
  }

  extend type Query {
    chats: [Chat]
    chat(room: String!): Chat
  }

  extend type Mutation {
    createChat(companionId: ID!): Chat!
  }
`;

const resolvers = {
  Query: {
    chats: async (_, __, { models, user }) => {
      if (!user) return [];
      const chats = await models.User.getUserChats(user.id);
      const enrichedChats = await Promise.all(chats.map(async (chat) => {
        // Загружаем участников чата
        const users = await models.Chat.getChatUsers(chat.id);
        // Преобразуем поля из snake_case в camelCase
        return {
          id: chat.id,
          room: chat.room,
          users: users.map(u => ({ userId: u.user_id, login: u.login })),
          lastMsg: chat.last_msg ? {
            senderId: chat.last_msg_sender_id,
            senderName: chat.last_msg_sender,
            message: chat.last_msg,
            createdAt: chat.last_msg_time,
          } : null,
          createdAt: chat.created_at,
          updatedAt: chat.updated_at,
        };
      }));
      return enrichedChats;
    },
    chat: async (_, { room }, { models }) => {
      return await models.Chat.findByRoom(room);
    },
  },
  Mutation: {
    createChat: async (_, { companionId }, { models, user }) => {
      if (!user) throw new Error("Unauthorized");
      const companion = await models.User.findById(companionId);
      if (!companion) throw new Error("Companion not found");
      let chat = await models.Chat.findByUsers(user.id, companionId);
      if (!chat) {
        const room = `${Date.now()}_${user.id}_${companionId}`;
        chat = await models.Chat.create(room, [
          { id: user.id, login: user.login },
          { id: companionId, login: companion.login }
        ]);
      }
      return chat;
    }
  }
};

module.exports = { typeDefs, resolvers };