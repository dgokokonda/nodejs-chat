'use strict'

if (!window.WebSocket) {
	document.body.innerHTML = 'WebSocket в этом браузере не поддерживается.';
}

const form = document.querySelector('.msg-report');
const user = document.querySelector('.user');
let username = 'anonymous';
const socket = new WebSocket(`ws://${document.location.host}:8081`); // or ws://localhost:8081

socket.onclose = function (ev) {
    if (ev.wasClean) {
        console.log('Соединение закрыто чисто');
    } else {
        console.log('Обрыв соединения');
    }
    console.log('Код: ' + ev.code + ' причина: ' + ev.reason);
}

socket.onmessage = function (ev) {
    const data = JSON.parse(ev.data);
    console.log(data)
    const msgs = user.querySelector('.messages');
    const content = msgs.innerHTML;
    const anotherUser = username !== data.username;
    const msgBlock = `<div 
    data-id="${data.id}" 
    class="message ${anotherUser ? 'message--diffColor' : ''}">
    <span>${data.username}:</span> ${data.msg}</div>`;

    msgs.innerHTML = content + msgBlock;
    form.querySelector('[name="msg"]').value = '';
}

socket.onerror = function (err) {
    console.log('err', err)
}

function pushMessage(msg) {
    socket.send(JSON.stringify({msg, username}))
}

document.forms.sendMsg.onsubmit = function() {
    const newMsg = this.msg.value.trim();

    if (newMsg) {
        pushMessage(newMsg)
    }
    return false;
};

document.forms.auth.onsubmit = function() {
    const self = this;
    const login = this.login.value.trim();

    if (login) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/auth', true);
        xhr.send(login);
        xhr.onreadystatechange = function () {
            if (xhr.readyState != 4) return;
            if (xhr.status != 200) return;
            else {
                if (xhr.responseText === 'success') {
                    username = login;
                    self.login.value = '';
                    document.querySelector('.login').style.display = 'none';
                    document.querySelector('.chatRoom').style.display = 'block';
                    // user.id = 
                    user.querySelector('h3').innerText = 'User: ' + username;
                }

            }
        }

    }
    return false;
}