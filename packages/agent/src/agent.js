const net = require('net')
const http = require('http')
const commandLineArgs = require('command-line-args')
const { flagsDeclaration } = require('./data/flagsDeclaration')

// load .env file variables
require('dotenv').config({
  path: '../.env'
})

// command line arguments
const flags = commandLineArgs(flagsDeclaration)

if (!flags.port) {
  console.error('Missing required argument: port')
  process.exit(1)
}

const servicePort = flags.port

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

    console.log('Fetching service localhost:', servicePort)

    const req = http.request({
      hostname: 'localhost',
      port: servicePort,
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
        // convert the body to base64
        serviceResponse.body = Buffer.from(serviceResponse.body).toString('base64')

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

  const packetData = JSON.stringify(response)
  const packetSize = Buffer.byteLength(packetData)

  console.log(packetSize)

  client.write(`${requestID}:::${packetSize}\n\n\n${packetData}`)

  client.on('end', () => {
    console.log('client disconnected')
    client.end()
  })

})

