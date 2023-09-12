const net = require('net')

const client = net.createConnection({
  host: 'localhost',
  port: 8080
})

client.on('connect', (socket) => {
  console.log('connected to tunneling server')
})

client.on('data', (data) => {
  const stream = data.toString().split('\n')
  console.log('Server: ', stream[1])

  client.write(`${stream[0]}\nResponded from the client`)
})

client.on('end', () => {
  console.log('client disconnected')
  client.end()
})

