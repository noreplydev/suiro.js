const net = require('net')
const http = require('http')
const { nanoid } = require('nanoid')
const { createSession, secondsToMs, removeSession } = require('alive-sessions')

// http server for consumption
http.createServer((req, res) => {
  var body;

  body = '';
  req.on('data', function (chunk) {
    body += chunk;
  });

  req.on('end', function () {
    console.log(req.method + ' ' + req.url + ' HTTP/' + req.httpVersion);

    for (prop in req.headers) {
      console.log(toTitleCase(prop) + ': ' + req.headers[prop]);
    }

    if (body.length > 0) {
      console.log('\n' + body);
    }
    console.log('');

    res.writeHead(200);
    res.end();
  });

  req.on('err', function (err) {
    console.error(err);
  });
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