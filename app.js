const express = require('express');
const Server = require('http').Server;
const io = require('socket.io');

const app = express();

const options = { 
    root: `${__dirname}/public`
};

app.use( express.static( options.root ) );

app.get('/', (req, res) => {
    res.sendFile('views/index.html', options);
});

const server = Server( app );
const socketio = io( server );

const users = [];

socketio.on('connection', (socket) => {

    socket.on('disconnect', () => {
       users.slice( users.findIndex(user => user.socketId === socket.id), 1 );
    });

    socket.on('set-username', (username) => {
        const clean = username.trim();
        if ( users.find(user => user.username === clean) ) {
            socket.emit('user-rejected', `Username ${username} is already taken`);
        } else {
            socket.join('users');
            const user = { username: clean, socketId: socket.id } 
            users.push( user );
            socket.emit('user-added', user, users);
            socket.to('users').emit('new-user', user, users);
        }
    });

    socket.on('send-message', ({ from, to, message}) => {
        socket.to(to).emit('recept-message', { from, message })
    });
});

server.listen(8080, () => {
    console.log('Connected on port 8080');
});

