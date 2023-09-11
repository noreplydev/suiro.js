const net = require('net')

const client = net.createConnection({
  host: 'localhost',
  port: 8080
})

client.on('connect', (socket) => {
  console.log('connected to tunneling server')
})

client.on('data', (data) => {
  console.log('Server: ', data.toString())
})

client.on('end', () => {
  console.log('client disconnected')
  client.end()
})

