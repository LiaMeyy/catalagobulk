import { Server } from 'socket.io';

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket conectado:', socket.id);

    // TODO: suscribir al socket a una room por importJobId
    socket.on('disconnect', () => {
      console.log('Socket desconectado:', socket.id);
    });
  });

  // TODO: relay QueueEvents → socket (progreso del import)
  return io;
}

export default initSocket;
