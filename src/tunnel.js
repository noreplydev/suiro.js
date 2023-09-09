const http2 = require('http2')
const fs = require('fs')
const { routesController } = require('./routesController')

const server = http2.createSecureServer({
  key: fs.readFileSync('keys/localhost-privkey.pem'),
  cert: fs.readFileSync('keys/localhost-cert.pem'),
  allowHTTP1: true
})

server.on('error', err => {
  console.error(err)
})

server.on('stream', routesController)

server.listen(4040, () => {
  console.log('\nServer listening on port 4040 \n')
})