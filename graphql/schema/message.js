const { gql } = require('graphql-tag');

const typeDefs = gql`
  type Message {
    id: ID!
    room: String!
    senderId: ID!
    recipientId: ID!
    message: String!
    status: String!
    createdAt: String!
    sender: User
    recipient: User
  }

  extend type Query {
    messages(room: String!, limit: Int): [Message]
  }

  extend type Mutation {
    sendMessage(room: String!, recipientId: ID!, message: String!): Message!
    markRoomMessagesAsRead(room: String!): Boolean
  }
`;

const resolvers = {
  Query: {
    messages: async (_, { room, limit = 50 }, { models, user }) => {
      if (!user) throw new Error("Unauthorized");
      return await models.Message.findByRoom(room, limit);
    }
  },
  Mutation: {
    sendMessage: async (_, { room, recipientId, message }, { models, user }) => {
      if (!user) throw new Error("Unauthorized");

      const newMessage = await models.Message.create(room, user.id, recipientId, message);

      const chat = await models.Chat.findByRoom(room);
      if (chat) {
        await models.Chat.updateLastMessage(chat.id, user.id, user.login, message);
      }

      // Явно формируем объект, чтобы поля соответствовали схеме
      const sender = await models.User.findById(user.id);
      const recipient = await models.User.findById(recipientId);

      return {
        id: newMessage.id,
        room: newMessage.room,
        senderId: newMessage.sender_id,
        recipientId: newMessage.recipient_id,
        message: newMessage.message,
        status: newMessage.status,
        createdAt: newMessage.created_at,
        sender,
        recipient,
      };
    },
    markRoomMessagesAsRead: async (_, { room }, { models, user }) => {
      if (!user) return false;
      await models.Message.markAsRead(room, user.id);
      return true;
    }
  }
};

module.exports = { typeDefs, resolvers };