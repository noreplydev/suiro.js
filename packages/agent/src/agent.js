#!/usr/bin/env node

const net = require('net')
const http = require('http')
const commandLineArgs = require('command-line-args')
const { flagsDeclaration } = require('./data/flagsDeclaration')

// command line arguments
const flags = commandLineArgs(flagsDeclaration)

let responsesCounter = 0;

if (Object.keys(flags).length < 1) {
  console.log(`
                     
  █████   ███  ███   ███  ████████   ██████ 
 ███░░  ░░███ ░███ ░░███ ░░███░░██  ███░░███
░░█████  ░███ ░███  ░███  ░███ ░░░ ░███ ░███
 ░░░░███ ░███ ░███  ░███  ░███     ░███ ░███
 ██████  ░░██████    ███  ████     ░░██████ 
░░░░░░    ░░░░░░░    ░░░ ░░░░░       ░░░░░  
                                             
v.0.2.1-rf                           

  `)
  process.exit(0)
}

if (!flags.port) {
  console.error('Missing required argument: port')
  process.exit(1)
}

if (!flags.host) {
  console.error('Missing required argument: host')
  process.exit(1)
}

const hostName = flags.host.split(':')[0]
const hostPort = flags.host.split(':')[1]
const hostEndpointPort = flags['endpoint-port']
const servicePort = flags.port

// connect to the tunneling server
const client = net.createConnection({
  host: hostName || 'localhost',
  port: hostPort || 8080
})

client.setMaxListeners(200)

client.on('error', (err) => {
  console.log('[ERROR] Cannot connect to the host: ', flags.host)
})

client.on('connect', (socket) => {
  console.log('[SUIRO] Connected, max listeners: ', client.getMaxListeners())
})

client.on('data', (data) => {
  const connectionStream = data.toString().split('\n')
  if (connectionStream[0] === 'connection') {
    console.log(`[SUIRO] Service ${servicePort} available on ${hostName}:${hostEndpointPort || '3000'}/${connectionStream[1]}`)
    return
  }

  // check if multiple requests are chunked
  const requests = data
    .toString()
    .split('<<<EOF>>>')
    .filter((request) => request)

  requests.forEach(async (request, i) => {
    const [requestID, ...stream] = request.split('\n')

    // request data
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

      console.log('[SUIRO] Fetching port:', servicePort)

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
        console.log('[ERROR] Local service is not running')
        reject(err)
        process.exit(1)
      })

      if (body) {
        req.write(body)
      }

      req.end();
    })

    const packetData = JSON.stringify(response)
    const packetSize = Buffer.byteLength(packetData)

    responsesCounter++
    console.log('[SUIRO] Response sent: ', body)
    client.write(`${requestID}:::${packetSize}\n\n\n${packetData}`)
  })
})

client.on('end', () => {
  console.log('[SUIRO] Connection closed')
  client.end()
})