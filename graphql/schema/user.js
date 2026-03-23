const { gql } = require('graphql-tag');

const typeDefs = gql`
  type User {
    id: ID!
    login: String!
    status: String!
    createdAt: String!
  }

  type AuthPayload {
    ok: Boolean!
    userId: ID
    error: String
    fields: [String]
  }

  input LoginInput {
    login: String!
    password: String!
  }

  input RegisterInput {
    login: String!
    password: String!
    passwordConfirm: String!
  }

  # Базовые типы Query и Mutation (без extend)
  type Query {
    me: User
    users: [User]
    user(id: ID!): User
  }

  type Mutation {
    login(input: LoginInput!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    logout: Boolean!
  }
`;

const resolvers = {
  Query: {
    me: async (_, __, { user }) => user,
    users: async (_, __, { models }) => {

      if (!models || !models.User) {
        console.error('❌ models.User is missing');
        return [];
      }
      await models.User.updateStatusesFromSessions();

      const users = await models.User.findAll();
      console.log('✅ users count:', users.length);
      return users;
    },
    user: async (_, { id }, { models }) => {
      return await models.User.findById(id);
    },
  },
  Mutation: {
    login: async (_, { input }, { models, req }) => {
    },
    register: async (_, { input }, { models, req }) => {
    },
    logout: async (_, __, { models, req }) => {
    }
  }
};

module.exports = { typeDefs, resolvers };