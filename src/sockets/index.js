import socketIo from 'socket.io';

function initSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket conectado:', socket.id);

    socket.on('disconnect', () => {
      console.log('Socket desconectado:', socket.id);
    });
  });

  return io;
}

export default initSocket;
