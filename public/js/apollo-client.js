// Простой GraphQL клиент с интерфейсом Apollo
(function () {
  'use strict';

  // console.log('=== GraphQL Client (Apollo compatible) ===');

  class GraphQLClient {
    constructor(endpoint = '/graphql') {
      this.endpoint = endpoint;
    }

    async request(document, variables = {}) {
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify({
            query: document,
            variables: variables,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
        }

        const result = await response.json();

        if (result.errors) {
          console.error('GraphQL Errors:', result.errors);
          const error = new Error(result.errors[0]?.message || 'GraphQL error');
          error.graphQLErrors = result.errors;
          throw error;
        }

        return result;
      } catch (error) {
        console.error('GraphQL request error:', error);
        throw error;
      }
    }

    query(options) {
      return this.request(options.query, options.variables);
    }

    mutate(options) {
      return this.request(options.mutation, options.variables);
    }
  }

  // Создаём клиент
  const client = new GraphQLClient('/graphql');

  // GraphQL запросы
  const GET_USERS = `
    query GetUsers {
      users {
        id
        login
        status
      }
    }
  `;

  const GET_CHATS = `
    query GetChats {
      chats {
        id
        room
        users {
          userId
          login
        }
        lastMsg {
          message
          senderName
          createdAt
        }
        updatedAt
      }
    }
  `;

  const GET_MESSAGES = `
    query GetMessages($room: String!, $limit: Int) {
      messages(room: $room, limit: $limit) {
        id
        message
        status
        createdAt
        sender {
          id
          login
        }
        recipient {
          id
          login
        }
      }
    }
  `;

  const SEND_MESSAGE = `
    mutation SendMessage($room: String!, $recipientId: ID!, $message: String!) {
      sendMessage(room: $room, recipientId: $recipientId, message: $message) {
        id
        message
        createdAt
        sender {
          id
          login
        }
      }
    }
  `;

  const LOGIN_MUTATION = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        ok
        userId
        error
        fields
      }
    }
  `;

  const REGISTER_MUTATION = `
    mutation Register($input: RegisterInput!) {
      register(input: $input) {
        ok
        userId
        error
        fields
      }
    }
  `;

  const LOGOUT_MUTATION = `
    mutation Logout {
      logout
    }
  `;

  // Экспортируем в глобальную область с интерфейсом Apollo
  window.apolloClient = client;
  window.gql = (strings) => strings[0];
  window.GET_USERS = GET_USERS;
  window.GET_CHATS = GET_CHATS;
  window.GET_MESSAGES = GET_MESSAGES;
  window.SEND_MESSAGE = SEND_MESSAGE;
  window.LOGIN_MUTATION = LOGIN_MUTATION;
  window.REGISTER_MUTATION = REGISTER_MUTATION;
  window.LOGOUT_MUTATION = LOGOUT_MUTATION;

  console.log('✓ GraphQL client ready (Apollo compatible)');
})();