const app = require('express')();
const cors = require('cors');
const server = require('http').Server(app);
const io = require('socket.io')(server, {origins: '*:*'});
const PORT = process.env.PORT || 3000;
app.use(cors())


const roomMap = {};
server.listen(PORT);


io.on('connection', function (socket) {
    console.log(`${socket.id} is connected!`)
    console.log(`Room map ${roomMap}`)

    socket.on('message', data => {
        data = JSON.parse(data)
        if (!roomMap[data.room]) {
            roomMap[data.room] = [socket.id]
        } else if (roomMap[data.room].length < 2) {
            if (roomMap[data.room].filter(i => i === socket.id).length === 0) {
                roomMap[data.room].push(socket.id)
            }
        }
        if (roomMap[data.room].length === 2) {
            for (socketId of roomMap[data.room]) {
                if (socketId !== socket.id && io.sockets.sockets[socketId] && roomMap[data.room].length <= 2) {
                    io.sockets.sockets[socketId].emit('message', data.data)
                }
            }
        }
    })

    socket.on('join', (roomId) => {
        console.log(`roomId join!`)
        if (roomMap[roomId] && roomMap[roomId].length === 2) {
            socket.emit('reject', {error: 'Room is full!'})
        }
    })

    socket.on('leave', (socketId) => {
        console.log(`${socketId} left!`)
        retirar(socketId)
    })

    socket.on('disconnect', () => {
        console.log(`${socket.id} was disconnected!`)
        retirar(socket.id);
    })
});

function retirar(socketId) {
    for (room in roomMap) {
        for (let i = 0; i < roomMap[room].length; i++) {
            if (roomMap[room][i] === socketId) {
                roomMap[room].splice(i, 1)
                if (roomMap[room].length === 0) {
                    delete roomMap[room]
                }
                break
            }
        }
    }
    console.log(roomMap)
}