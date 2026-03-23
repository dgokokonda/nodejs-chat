"use strict";

if (!window.WebSocket) {
  document.body.innerHTML = "WebSocket в этом браузере не поддерживается.";
}

$(function () {
  const form = $(".msg-report");
  const user = $(".user");
  let username = user.data("login");
  let socket = null;
  let currentRoom = null;
  let currentRecipientId = null;

  // Инициализация Moment.js
  if (typeof moment !== 'undefined') {
    moment.locale('ru');
  }

  // Инициализация WebSocket
  if (user.length && user.find(".chat").length) {
    currentRoom = user.find(".chat").data("chat-id");
    currentRecipientId = user.find("button").data("recipient-id");

    const userId = user.attr("id");
    socket = new WebSocket(`ws://${document.location.hostname}:8082?userId=${userId}`);

    socket.onopen = function () {
      console.log("WebSocket connected");
    };

    socket.onmessage = function (ev) {
      const data = JSON.parse(ev.data);

      console.log("WS message received:", data);
      if (data.username !== username && data.room === currentRoom) {
        addMessageToChat(data);
      }
      if ($(".dialogs").length) {
        updateDialogsList(data);
      }
    };

    socket.onerror = function (err) {
      console.log("WebSocket error", err);
    };
  }

  // === GraphQL функции (используют window.apolloClient) ===
  async function graphqlRequest(query, variables = {}) {
    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ query, variables }),
      });
      const result = await response.json();
      if (result.errors) {
        console.error('GraphQL Errors:', result.errors);
        throw new Error(result.errors[0]?.message || 'GraphQL error');
      }
      return result.data;
    } catch (error) {
      console.error('GraphQL request error:', error);
      throw error;
    }
  }

  // Загрузка списка пользователей
  async function loadUsers() {
    try {
      const data = await graphqlRequest(window.GET_USERS);
      const users = data.users;
      const myId = $("header span.me").data("my-id");

      const usersList = $(".users-list");
      usersList.empty();

      users.forEach(user => {
        const userHtml = `
          <div>
            <span class="user" data-id="${user.id}">${escapeHtml(user.login)}</span>
            <span class="status ${user.status == 'online' ? 'status--online' : 'status--offline'}">
              ${user.status}
            </span>
            ${user.id != myId ? `<a href="/chat/${myId}/sel=${user.id}">написать сообщение</a>` : ''}
          </div>
        `;
        usersList.append(userHtml);
      });
    } catch (err) {
      console.error("Error loading users:", err);
      $(".users-list").html('<p>Ошибка загрузки пользователей</p>');
    }
  }

  // Загрузка списка чатов
  async function loadChats() {
    try {
      const data = await graphqlRequest(window.GET_CHATS);
      const chats = data.chats;
      const myId = $("header span.me").data("my-id");

      const dialogs = $(".dialogs");
      dialogs.empty();

      if (chats && chats.length) {
        let hasMessages = false;
        chats.forEach(chat => {
          const companion = chat.users.find(u => u.userId != myId);
          if (!companion) return
          const companionId = companion?.userId || companion?.id
          if (chat.lastMsg && chat.lastMsg.message) {
            hasMessages = true;
            const timeStr = formatDate(+chat.lastMsg.createdAt);
            const chatHtml = `
              <div class="user" data-friend-id="${companionId}">
                <a href="/chat/${myId}/sel=${companionId}">
                  <div class="avatar"></div>
                  <div class="dialog" data-chat-id="${chat.room}">
                    <div class="username">
                      <b><span>${escapeHtml(companion.login)}</span></b>
                      <span class="msg-time">${timeStr}</span>
                    </div>
                    <div class="msg">${escapeHtml(chat.lastMsg.message)}</div>
                  </div>
                </a>
              </div>
            `;
            dialogs.append(chatHtml);
          }
        });
        if (!hasMessages) {
          dialogs.html('<p>Список диалогов пуст</p><a class="list" href="/chat/users">Выбрать юзера из списка</a>');
        }
      } else {
        dialogs.html('<p>Список диалогов пуст</p><a class="list" href="/chat/users">Выбрать юзера из списка</a>');
      }
    } catch (err) {
      console.error("Error loading chats:", err);
      $(".dialogs").html('<p>Ошибка загрузки чатов</p>');
    }
  }

  // Загрузка сообщений в текущем чате
  async function loadMessages() {
    if (!currentRoom) return;
    try {
      const data = await graphqlRequest(window.GET_MESSAGES, { room: currentRoom, limit: 50 });
      const messages = data.messages;
      const msgs = $(".messages");
      msgs.empty();

      messages.forEach(msg => {
        const isOwn = msg.sender.id == user.attr("id");
        const timeStr = formatTime(msg.createdAt);
        const msgHtml = `
          <div data-id="${msg.sender.id}" class="message ${isOwn ? '' : 'message--diffColor'}">
            <span>${escapeHtml(msg.sender.login)}:</span>
            <span class="msg-time">${timeStr}</span>
            <p>${escapeHtml(msg.message)}</p>
          </div>
        `;
        msgs.append(msgHtml);
      });
      msgs.scrollTop(msgs[0].scrollHeight);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  }

  // Отправка сообщения через GraphQL
  async function sendMessageViaGraphQL(msg, recipientId, room) {
    try {
      const data = await graphqlRequest(window.SEND_MESSAGE, { room, recipientId, message: msg });
      return data.sendMessage;
    } catch (err) {
      console.error("GraphQL error:", err);
      return null;
    }
  }

  // UI функции
  function formatTime(dateString) {
    if (typeof moment !== 'undefined') {
      return moment(+dateString).format('HH:mm');
    }
    return new Date(+dateString).toLocaleTimeString().slice(0, 5);
  }

  function formatDate(dateString) {
    if (typeof moment !== 'undefined') {
      const date = moment(dateString);
      const now = moment();
      if (date.isSame(now, 'day')) {
        return date.format('HH:mm');
      } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
        return 'Вчера';
      }
      return date.format('DD.MM.YY');
    }
    return new Date(dateString).toLocaleDateString();
  }

  function addMessageToChat(data) {
    const msgs = $(".messages");
    const isAnotherUser = data.username !== username;
    const timeStr = data.time || formatTime(data.createdAt || new Date());
    const msgBlock = `
      <div data-id="${data.userId}" class="message ${isAnotherUser ? 'message--diffColor' : ''}">
        <span>${escapeHtml(data.username)}:</span>
        <span class="msg-time">${timeStr}</span>
        <p>${escapeHtml(data.msg)}</p>
      </div>
    `;
    msgs.append(msgBlock);
    msgs.scrollTop(msgs[0].scrollHeight);
  }

  function addOwnMessageToChat(msg) {
    const msgs = $(".messages");
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const msgBlock = `
      <div data-id="${user.attr("id")}" class="message">
        <span>${escapeHtml(username)}:</span>
        <span class="msg-time">${timeStr}</span>
        <p>${escapeHtml(msg)}</p>
      </div>
    `;
    msgs.append(msgBlock);
    msgs.scrollTop(msgs[0].scrollHeight);
    form.find('[name="msg"]').val("");
  }

  function updateDialogsList(data) {
    const myId = $("header span.me").data("my-id");
    const dialog = $(`.dialog[data-chat-id="${data.room}"]`);
    const timeStr = data.time || formatTime(new Date());
    const lastMsg = `
      <div class="username">
        <b><span>${escapeHtml(data.username)}</span></b>
        <span class="msg-time">${timeStr}</span>
      </div>
      <div class="msg">${escapeHtml(data.msg)}</div>
    `;

    if (dialog.length) {
      dialog.html(lastMsg);
      const parentUser = dialog.closest('.user');
      $(".dialogs").prepend(parentUser);
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function pushMessage(msg) {
    if (!currentRoom || !currentRecipientId) return;

    addOwnMessageToChat(msg);

    sendMessageViaGraphQL(msg, currentRecipientId, currentRoom).then(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          msg: msg,
          username: username,
          userId: user.attr("id"),
          recipient: currentRecipientId,
          room: currentRoom
        }));
      }
    });
  }

  // ========== REST-обработчики ==========
  // Логин (REST)
  $(".js-confirm-auth").off('click').on("click", function (e) {
    e.preventDefault();
    const form = $(this).closest("form");
    const login = $("#auth-login").val().trim();
    const password = $("#auth-pass").val();

    form.find("p.error").remove();
    $(".error").removeClass("error");

    let hasError = false;
    if (!login) {
      $("#auth-login").addClass("error");
      hasError = true;
    }
    if (!password) {
      $("#auth-pass").addClass("error");
      hasError = true;
    }
    if (hasError) {
      form.find("h2").after('<p class="error">Все поля должны быть заполнены!</p>');
      return;
    }

    $.ajax({
      url: "/ajax/login",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ login, password }),
      success: function (data) {
        if (data.ok) {
          window.location.href = `/chat/${data.userId}`;
        } else {
          form.find("p.error").remove();
          if (data.error) {
            form.find("h2").after('<p class="error">' + data.error + "</p>");
          }
          if (data.fields) {
            data.fields.forEach(field => {
              $("#" + field).addClass("error");
            });
          }
        }
      },
      error: function (err) {
        console.error("Login error:", err);
        form.find("p.error").remove();
        form.find("h2").after('<p class="error">Ошибка сети. Попробуйте позже.</p>');
      }
    });
  });

  // Регистрация (REST)
  $(".js-confirm-reg").off('click').on("click", function (e) {
    e.preventDefault();
    const form = $(this).closest("form");
    const login = $("#reg-login").val().trim();
    const password = $("#reg-pass").val().trim();
    const passwordConfirm = $("#reg-pass-confirm").val();

    form.find("p.error").remove();
    $(".error").removeClass("error");

    let hasError = false;
    if (!login) {
      $("#auth-login").addClass("error");
      hasError = true;
    }
    if (!password) {
      $("#auth-pass").addClass("error");
      hasError = true;
    }
    if (hasError) {
      form.find("h2").after('<p class="error">Все поля должны быть заполнены!</p>');
      return;
    }

    $.ajax({
      url: "/ajax/register",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ login, password, passwordConfirm }),
      success: function (data) {
        if (data.ok) {
          window.location.href = `/chat/${data.userId}`;
        } else {
          form.find("p.error").remove();
          if (data.error) {
            form.find("h2").after('<p class="error">' + data.error + "</p>");
          }
          if (data.fields) {
            data.fields.forEach(field => {
              $("#" + field).addClass("error");
            });
          }
        }
      },
      error: function (err) {
        console.error("Register error:", err);
        form.find("p.error").remove();
        form.find("h2").after('<p class="error">Ошибка сети. Попробуйте позже.</p>');
      }
    });
  });

  // Выход (REST)
  $("a[href='/ajax/logout']").off('click').on("click", function (e) {
    e.preventDefault();
    window.location.href = "/ajax/logout";
  });

  // Переключение форм авторизации/регистрации
  $(".js-reg, .js-auth").click(function (e) {
    e.preventDefault();
    $(".auth form").slideToggle(500);
    $(".auth form").find("p.error").remove();
    $(".auth form").find("input.error").removeClass("error");
  });

  $("input").on("focus", function () {
    $(this).closest("form").find("p.error").remove();
    $(this).removeClass("error");
  });

  $("form[name=sendMsg]").submit(function (e) {
    e.preventDefault();
    const newMsg = $(this).find("input[name=msg]").val().trim();
    if (newMsg) {
      pushMessage(newMsg);
    }
  });

  // ========== Загрузка данных в зависимости от пути ==========
  const path = window.location.pathname;
  if (path.includes("/chat/users")) {
    loadUsers();
  } else if (path.match(/\/chat\/\d+$/) && !path.includes("sel=")) {
    loadChats();
  } else if (path.includes("sel=")) {
    loadMessages();
  } else {
    console.log('No matching route for:', path);
  }
});