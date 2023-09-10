const { createSession, secondsToMs, removeSession } = require('alive-sessions')
const { nanoid } = require('nanoid')
const net = require('net')

const tunnelingServer = net.createServer((socket) => {
  // create a session for each client
  const sessionId = nanoid()

  createSession({
    sessionID: sessionId,
    expireMs: secondsToMs(20),
    action: () => {
      socket.end()
    }
  })

  socket.on('connection', (client) => {
    console.log('client connected', client)
  })

  socket.on('data', (data) => {
    console.log('Client: ', data.toString())
  })

  socket.on('end', () => {
    removeSession(sessionId)
    console.log('session expired: ', sessionId)
  })
})

tunnelingServer.listen(8080, () => {
  console.log('tunneling server listening on port 8080')
})