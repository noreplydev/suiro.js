const net = require('net')
const http = require('http')

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

  // request data
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

  // fetch the host service
  const response = await new Promise((resolve, reject) => {
    const serviceResponse = {}

    const req = http.request({
      hostname: 'localhost',
      port: 4545,
      path: route,
      method: method,
      headers: {
        httpVersion: httpVersion,
        ...headers
      },

    }, (res) => {
      // response info
      serviceResponse.httpVersion = 'HTTP/' + res.httpVersion
      serviceResponse.statusCode = res.statusCode
      serviceResponse.statusMessage = res.statusMessage

      // headers object
      serviceResponse.headers = res.headers

      // body stream
      serviceResponse.body = ''

      res.on('data', (chunk) => {
        if (chunk) {
          serviceResponse.body += chunk
        }
      });

      res.on('end', () => {
        resolve(serviceResponse)
      });
    });

    req.on('error', (err) => {
      console.error('error on request', err);
      reject(err)
    })

    if (body) {
      req.write(body)
    }

    req.end();
  })


  client.write(`${requestID}\n${JSON.stringify(response)}`)

  client.on('end', () => {
    console.log('client disconnected')
    client.end()
  })

})

