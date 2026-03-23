const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');
const userSchema = require('./user');
const chatSchema = require('./chat');
const messageSchema = require('./message');

const typeDefs = mergeTypeDefs([
  userSchema.typeDefs,
  chatSchema.typeDefs,
  messageSchema.typeDefs,
]);

const resolvers = mergeResolvers([
  userSchema.resolvers,
  chatSchema.resolvers,
  messageSchema.resolvers,
]);

module.exports = { typeDefs, resolvers };