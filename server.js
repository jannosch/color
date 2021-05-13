const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const randomColor = require('randomcolor');
const createBoard = require('./createBoard');
const createCooldown = require('./createCooldown');

const app = express();

app.use(express.static(`./client`));
//app.listen(process.env.PORT);

const server = http.createServer(app);
const io = socketio(server);
const { clear, getBoard, makeTurn } = createBoard(20);

io.on('connection', (sock) => {
    let color = randomColor.randomColor();
    const cooldown = createCooldown(2000);
    sock.emit('board', { getBoard, color });

    sock.on('message', ({text, name}) => io.emit('message', {text, name, color}));
    sock.on('color', (c) => {color = c});
    sock.on('turn', ({ x, y }) => {
        if (cooldown()) {
            const playerWon = makeTurn(x, y, color);
            io.emit('turn', {x, y, color})

            if (playerWon) {
                sock.emit('message', 'You gewonnen!');
                io.emit('message', 'Neue Runde lelele!');
                clear();
                io.emit('board');
            }
        };
    });
});

server.on('error', (err) => {
    console.error(err);
});

let port = process.env.PORT;
if (port == null || port === "") {
    port = 8080;
}
server.listen(port, () => {
    console.log('server is ready on port ' + port);
});