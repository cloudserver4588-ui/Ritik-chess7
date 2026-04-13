const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use('/img', express.static(path.join(__dirname, 'node_modules/chessboardjs/www/img')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let matches = [];

io.on('connection', (socket) => {
    console.log("User connected ✅");

    socket.emit('init-data', matches.map(({ id, p1, p2 }) => ({ id, p1, p2 })));

    socket.on('create-match', (match) => {
        matches.push({ ...match, fen: 'start' });
        io.emit('init-data', matches.map(({ id, p1, p2 }) => ({ id, p1, p2 })));
    });

    socket.on('join-match', (id) => {
        socket.join(id);
        const match = matches.find(m => m.id === id);
        if (match) {
            socket.emit('match-state', { matchId: id, fen: match.fen });
        }
    });

    socket.on('move', (data) => {
        const match = matches.find(m => m.id === data.matchId);
        if (!match) return;
        match.fen = data.fen;
        socket.to(data.matchId).emit('move', data);
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}/`);
});






