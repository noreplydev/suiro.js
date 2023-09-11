const net = require('net')
const http = require('http')
const fs = require('fs')
const { nanoid } = require('nanoid')
const { createSession, secondsToMs, removeSession, getSessionData } = require('alive-sessions')

// http server for consumption
http.createServer((req, res) => {
  let body = '';
  let headers = '';

  req.on('data', function (chunk) {
    body += chunk;
  });

  req.on('end', function () {
    // get the sessionID based on the request endoint
    const sessions = fs.readFileSync('sessions.json')
    const sessionsJson = JSON.parse(sessions)
    const sessionID = sessionsJson[req.url.split('/')[1]]

    // avoid requests without sessionID
    if (!sessionID) {
      res.writeHead(404);
      res.end();
      return
    }

    headers += req.method + ' ' + req.url + ' HTTP/' + req.httpVersion + '\n'

    for (prop in req.headers) {
      headers += toTitleCase(prop) + ': ' + req.headers[prop] + '\n'
    }

    let request = headers
    if (body.length > 0) {
      request += '\n' + body
    }

    // get the session data
    const sessionData = getSessionData(sessionID)

    // send the request to the client
    sessionData.write(request)

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
  let sessionVars = addSession(socket)
  console.log('[NEW]', sessionVars.sessionId, ':', sessionVars.sessionEndpoint)

  socket.on('data', (data) => {
    console.log('[DATA] ', sessionVars.sessionId, ': ', data.toString())
  })

  socket.on('end', () => {
    removeSession(sessionVars.sessionId)
    console.log('[CLOSED] ', sessionVars.sessionId)
  })
})

tunnelingServer.listen(8080, () => {
  console.log('tunneling server listening on port 8080')
})

function addSession(socket) {
  // create a session for each client
  const sessionId = nanoid().toString()
  const sessionEndpoint = nanoid().toString()


  // create a session and close after timeout
  createSession({
    sessionID: sessionId,
    expireMs: secondsToMs(120),
    data: socket,
    action: () => {
      socket.end()
    }
  })

  // read the json file 
  const sessions = fs.readFileSync('sessions.json')
  const sessionsJson = JSON.parse(sessions)
  sessionsJson[sessionEndpoint] = sessionId

  // write the session to the json file
  fs.writeFileSync('sessions.json', JSON.stringify(sessionsJson))

  return { sessionEndpoint, sessionId }
}