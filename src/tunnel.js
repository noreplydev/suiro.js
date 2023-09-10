const { createSession, secondsToMs, removeSession } = require('alive-sessions')
const { nanoid } = require('nanoid')
const express = require('express')
const net = require('net')

// http server for consumption
const app = express()

app.get('*', (req, res) => {
  res.send('hello world')
})

app.listen(3000, () => {
  console.log('http server listening on port 3000')
})

// tunneling service
const tunnelingServer = net.createServer((socket) => {
  // create a session for each client
  const sessionId = nanoid()

  // create a session and close after timeout
  createSession({
    sessionID: sessionId,
    expireMs: secondsToMs(120),
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