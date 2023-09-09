const http2 = require('http2')
const fs = require('fs')

const server = http2.createSecureServer({
  key: fs.readFileSync('localhost-privkey.pem'),
  cert: fs.readFileSync('localhost-cert.pem'),
  allowHTTP1: true
})

server.on('error', err => {
  console.error(err)
})

server.on('stream', (stream, headers) => {
  console.log('headers', headers)
  console.log('stream', stream)

  stream.respond({
    'content-type': 'text/html',
    'status': 200
  })

  stream.write('<h1>Hello World</h1>')
  setTimeout(() => {
    stream.write('<h1>deu</h1>')
  }, 5000)
})

server.listen(4040)