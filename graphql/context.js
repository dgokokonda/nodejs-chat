const { User, Chat, Message } = require("../models");
// console.log('🔍 Context models:', { User: !!User, Chat: !!Chat, Message: !!Message });

module.exports = ({ req }) => {
  return {
    models: { User, Chat, Message },
    user: req.session?.userId ? {
      id: req.session.userId,
      login: req.session.userLogin
    } : null,
    req,
  };
};