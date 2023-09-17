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

  // const response = await fetch(`http://localhost:4545${route}`, {
  //   method,
  //   headers,
  //   body: body.length > 0 ? body : undefined
  // }).then(res => {
  //   const headers = []

  //   for (let [key, value] of res.headers.entries()) {
  //     headers.push(`${key}: ${value}`)
  //   }

  //   console.log(` ${res.status} ${res.statusText}\n${headers.join('\n')}\n\n${res.body}`)
  //   return `${res.type} ${res.status} ${res.statusText}\n${headers.join('\n')}\n\n${res.body}`
  // }).catch(err => err.message)

  // the response is here, no worries from 03:41 AM Cristian
  // https://nodejs.org/api/http.html#httprequestoptions-callback

  const response = await new Promise((resolve, reject) => {
    const serviceResponse = {}

    const req = http.request({
      hostname: 'localhost',
      port: 4545,
      path: '/',
      method: 'GET'
    }, (res) => {
      // first line
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

    req.end();
  })


  client.write(`${requestID}\n${JSON.stringify(response)}`)

  client.on('end', () => {
    console.log('client disconnected')
    client.end()
  })

})

