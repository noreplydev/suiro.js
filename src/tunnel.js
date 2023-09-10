const net = require('net')
const http = require('http')
const { nanoid } = require('nanoid')
const { createSession, secondsToMs, removeSession } = require('alive-sessions')

// http server for consumption
http.createServer((req, res) => {
  let body = '';
  let headers = '';

  req.on('data', function (chunk) {
    body += chunk;
  });

  req.on('end', function () {
    headers += req.method + ' ' + req.url + ' HTTP/' + req.httpVersion + '\n'

    for (prop in req.headers) {
      headers += toTitleCase(prop) + ': ' + req.headers[prop] + '\n'
    }

    let request = headers
    if (body.length > 0) {
      request += '\n' + body
    }

    console.log(request)

    res.writeHead(200);
    res.end();
  })

  req.on('err', function (err) {
    console.error(err);
  })

}).listen(3000, () => {
  console.log('http server listening on port 3000')
})

function toTitleCase(str) {
  return str.replace(/[a-z]*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}

// tunneling service
const tunnelingServer = net.createServer((socket) => {
  // create a session for each client
  const sessionId = nanoid()

  // create a session and close after timeout
  createSession({
    sessionID: sessionId,
    expireMs: secondsToMs(120),
    action: () => {
      socket.end()
    }
  })

  socket.on('connection', (client) => {
    console.log('client connected', client)
  })

  socket.on('data', (data) => {
    console.log('Client: ', data.toString())
  })

  socket.on('end', () => {
    removeSession(sessionId)
    console.log('session expired: ', sessionId)
  })
})

tunnelingServer.listen(8080, () => {
  console.log('tunneling server listening on port 8080')
})