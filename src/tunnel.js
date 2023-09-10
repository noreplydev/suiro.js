const net = require('net')

const tunnelingServer = net.createServer((socket) => {
  socket.on('connection', (client) => {
    console.log('client connected', client)
  })

  socket.on('data', (data) => {
    console.log('Client: ', data.toString())
    socket.end("This tunnel has been closed")
  })
})

tunnelingServer.listen(8080, () => {
  console.log('tunneling server listening on port 8080')
})