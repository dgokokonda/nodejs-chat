'use strict'
const http = require('http');
const port = 80;
const fs = require('fs');
const path = require('path');
const WebSocketServer = new require('ws');

const clients = {};

const webSocketServer = new WebSocketServer.Server({port: 8081});
webSocketServer.on('connection', (ws) => {
    const id = Math.random();
    clients[id] = ws;
    console.log("новое соединение " + id);

    ws.on('message', (data) => {
        console.log('получено сообщение ' + data);

        for(var key in clients) {
            const parsedData = JSON.parse(data);
            clients[key].send(JSON.stringify({...parsedData, id}));
        }  
    });

    ws.on('close', () => {
        console.log('соединение закрыто ' + id);
        delete clients[id];
    })
})

http.createServer((req, res) => {
    let filePath = '.' + req.url;

    if (req.url === '/') {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        fs.readFile('index.html', (err, text) => {
            if (err) throw err;
            else {
                res.writeHead(200, {
                    'Content-Type': 'text/html; charset=utf-8'
                });
                res.end(text, 'utf-8');
            }
        });
    }

    if (req.url == '/auth') {
        let body = '';
        req.on('data', (data) => {
            body += data;
            res.end(body)
            return body;
        });

        res.end('success')
        
    }

    if (filePath == './') {
        filePath = './index.html';
    }

    let extname = path.extname(filePath);
    let contentType = 'text/html; charset=utf-8';
    switch(extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        default:
            break;
    }

    fs.readFile(filePath, (err, text) => {
        if (err) {
            if (err.code == 'ENOENT') {
                fs.readFile('./404.html', (text) => {
                    res.writeHead(200, {
                        'Content-Type': contentType
                    });
                    res.end(text, 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + err.code + ' ..\n');
                res.end();
            }  
        } else {
            res.writeHead(200, {
                'Content-Type': contentType
            });
            res.end(text, 'utf-8');
        }
    });
}).listen(port, () => {
    console.log(`Server is running at http://localhost:${port}/`);
});

