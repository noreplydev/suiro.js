const net = require('net')
require('dotenv').config({
  path: '../.env'
})

const client = net.createConnection({
  host: process.env.TUNNELING_SERVER || 'localhost',
  port: 8080
})

client.on('connect', (socket) => {
  console.log('connected to tunneling server')
})

client.on('data', async (data) => {
  const [requestID, unwrappedData] = data.toString().split('\n')

  console.log('request id ' + requestID)

  const stream = unwrappedData.split('\n')
  const [method, route, httpVersion] = stream[0].split(' ')

  const headers = {}

  for (let i = 1; i < stream.length; i++) {
    if (stream[i] === '') {
      break // until the headers end
    }

    const [key, value] = stream[i].split(': ')
    headers[key] = value
  }

  const bodyOffset = Object.keys(headers).length + 2
  const body = stream.slice(bodyOffset).join('\n')

  const response = await fetch(`http://localhost:4545${route}`, {
    method,
    headers,
    body: body.length > 0 ? body : undefined
  }).then(res => res.text())
    .catch(err => err.message)

  console.log(response)
  client.write(`${requestID}\n${response}`)
})

client.on('end', () => {
  console.log('client disconnected')
  client.end()
})

