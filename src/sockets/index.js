const { Server } = require('socket.io')
const { QueueEvents } = require('bullmq')
const { redisClient } = require('../config/redis')

function inicializarSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  })

  const queueEvents = new QueueEvents('import', {
    connection: redisClient,
  })

  // Relay de eventos BullMQ → Socket.io
  queueEvents.on('progress', ({ jobId, data }) => {
    io.emit(`import:${data.importJobId}:progress`, data)
  })

  queueEvents.on('completed', ({ jobId, returnvalue }) => {
    if (returnvalue?.importJobId) {
      io.emit(`import:${returnvalue.importJobId}:completed`, returnvalue)
    }
  })

  queueEvents.on('failed', ({ jobId, failedReason, returnvalue }) => {
    const importJobId = returnvalue?.importJobId || jobId
    io.emit(`import:${importJobId}:failed`, { importJobId, motivo: failedReason })
  })

  io.on('connection', (socket) => {
    console.log(`Socket conectado: ${socket.id}`)
    socket.on('disconnect', () => {
      console.log(`Socket desconectado: ${socket.id}`)
    })
  })

  return io
}

module.exports = { inicializarSockets }