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
  let pendingMessages = new Set(); // Храним временные ID отправленных сообщений

  // Инициализация WebSocket после загрузки страницы чата
  if (user.length && user.find(".chat").length) {
    currentRoom = user.find(".chat").data("chat-id");
    currentRecipientId = user.find("button").data("recipient-id");

    // Используем WebSocket с передачей userId через URL
    const userId = user.attr("id");
    socket = new WebSocket(`ws://${document.location.hostname}:8082?userId=${userId}`);

    socket.onopen = function () {
      console.log("WebSocket connected");
    };

    socket.onmessage = function (ev) {
      const data = JSON.parse(ev.data);
      console.log("WS message received:", data);

      // Игнорируем сообщения от себя
      if (data.username === username) {
        console.log("Ignoring own message");
        return;
      }

      // Добавляем сообщение, если оно для текущей комнаты
      if (data.room === currentRoom) {
        addMessageToChat(data);
      }

      // Обновление списка диалогов
      if ($(".dialogs").length) {
        updateDialogsList(data);
      }
    };

    socket.onerror = function (err) {
      console.log("WebSocket error", err);
    };

    socket.onclose = function (ev) {
      console.log("WebSocket closed", ev.code, ev.reason);
    };
  }

  // Функция для добавления сообщения в чат
  function addMessageToChat(data) {
    const msgs = $(".messages");
    const isAnotherUser = data.username !== username;
    const msgBlock = `
      <div data-id="${data.userId}" data-time="${data.time}" class="message ${isAnotherUser ? 'message--diffColor' : ''}">
        <span>${escapeHtml(data.username)}:</span>
        <span class="msg-time">${data.time || ""}</span>
        <p>${escapeHtml(data.msg)}</p>
      </div>
    `;

    msgs.append(msgBlock);
    msgs.scrollTop(msgs[0].scrollHeight);
  }

  // Функция для немедленного добавления своего сообщения
  function addOwnMessageToChat(msg) {
    const msgs = $(".messages");
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Уникальный ключ для отслеживания
    const messageKey = `${msg}_${timeStr}`;
    pendingMessages.add(messageKey);

    // Удаляем ключ через 5 секунд (на случай, если WebSocket не ответит)
    setTimeout(() => {
      pendingMessages.delete(messageKey);
    }, 5000);

    const msgBlock = `
      <div data-id="${user.attr("id")}" data-time="${timeStr}" class="message">
        <span>${escapeHtml(username)}:</span>
        <span class="msg-time">${timeStr}</span>
        <p>${escapeHtml(msg)}</p>
      </div>
    `;

    msgs.append(msgBlock);
    msgs.scrollTop(msgs[0].scrollHeight);

    // Очищаем поле ввода
    form.find('[name="msg"]').val("");
  }

  // Обновление списка диалогов
  function updateDialogsList(data) {
    const myId = $("header span.me").data("my-id");
    const dialog = $(`.dialog[data-chat-id="${data.room}"]`);
    const lastMsg = `
      <div class="username">
        <b><span>${escapeHtml(data.username)}</span></b>
        <span class="msg-time">${data.time || ""}</span>
      </div>
      <div class="msg">${escapeHtml(data.msg)}</div>
    `;

    if (dialog.length) {
      dialog.html(lastMsg);
      const parentUser = dialog.closest('.user');
      $(".dialogs").prepend(parentUser);
    } else {
      const dialogWrapper = `
        <div class="user" data-friend-id="${data.userId}">
          <a href="/chat/${myId}/sel=${data.userId}">
            <div class="avatar"></div>
      `;
      $(".dialogs").prepend(dialogWrapper + lastMsg + "</a></div>");
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

    // Сразу добавляем сообщение в интерфейс
    addOwnMessageToChat(msg);

    // Отправляем через AJAX на сервер
    $.ajax({
      url: "/chat/sendMsg",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        msg,
        recipient: currentRecipientId,
        room: currentRoom
      }),
      success: function () {
        // Отправляем через WebSocket для других пользователей
        if (socket && socket.readyState === WebSocket.OPEN) {
          const messageData = {
            msg: msg,
            username: username,
            userId: user.attr("id"),
            recipient: currentRecipientId,
            room: currentRoom
          };
          console.log("Sending WebSocket message:", messageData);
          socket.send(JSON.stringify(messageData));
        }
      },
      error: function (err) {
        console.log("Send message error:", err);
        // При ошибке можно пометить сообщение как неотправленное
        $(".messages .message:last-child").addClass("message--error");
      }
    });
  }

  function resetForms(form, reset) {
    form.find("input.error, textarea.error, div.error").removeClass("error");
    form.children("p.error, p.success").remove();

    if (reset) {
      form.find("input.error, textarea.error").val("");
      form.find("div.error").html("");
    }
  }

  function validateForm(data) {
    const form = this.tagName == "FORM" ? $(this) : $(this).closest("form");
    form.children("p").remove();

    if (!data.ok) {
      if (data.error) {
        const fTitle = form.find("h2");

        if (fTitle.length) {
          fTitle.after('<p class="error">' + data.error + "</p>");
        } else {
          form
            .children()
            .eq(0)
            .before('<p class="error">' + data.error + "</p>");
        }
      }

      if (data.fields) {
        data.fields.forEach(function (item) {
          form.find("#" + item).addClass("error");
        });
      }
    } else {
      resetForms(form);
    }
    return data.ok;
  }

  // Переключение форм
  $(".js-reg, .js-auth").click(function (e) {
    e.preventDefault();
    $(".auth form").slideToggle(500);
    resetForms($(".auth form"));
  });

  // Очистка ошибок
  $("input").on("focus", function () {
    resetForms($(this).closest("form"), false);
  });

  $(".form-group").on("click", function () {
    resetForms($(this).closest("form"), false);
  });

  // Регистрация
  $(".js-confirm-reg").on("click", function (e) {
    e.preventDefault();

    var el = this;
    var data = {
      login: $("#reg-login").val(),
      password: $("#reg-pass").val(),
      passwordConfirm: $("#reg-pass-confirm").val()
    };

    $.ajax({
      type: "POST",
      data: JSON.stringify(data),
      contentType: "application/json",
      url: "/ajax/register"
    }).done(function (data) {
      const success = validateForm.call(el, data);

      if (success) {
        $(location).attr("href", `/chat/${data.userId}`);
      }
    });
  });

  // Авторизация
  $(".js-confirm-auth").on("click", function (e) {
    e.preventDefault();

    var el = this;
    var data = {
      login: $("#auth-login").val(),
      password: $("#auth-pass").val()
    };

    $.ajax({
      type: "POST",
      data: JSON.stringify(data),
      contentType: "application/json",
      url: "/ajax/login"
    }).done(function (data) {
      const success = validateForm.call(el, data);

      if (success) {
        $(location).attr("href", `/chat/${data.userId}`);
      }
    });
  });

  // Enter для форм
  $(".auth form input").on("keydown", function (e) {
    if (e.key == "Enter") {
      $(this)
        .closest("form")
        .find(".btns button:last-child")
        .trigger("click");
      e.preventDefault();
    }
  });

  // Отправка сообщения
  $("form[name=sendMsg]").submit(function (e) {
    e.preventDefault();
    const newMsg = $(this)
      .find("input[name=msg]")
      .val()
      .trim();

    if (newMsg) {
      pushMessage(newMsg);
    }
  });
});