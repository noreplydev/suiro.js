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

    // append the requestID on the first line
    const requestID = nanoid().toString()
    let request = requestID + '\n'

    // append the headers
    request += headers

    // append the body if exists
    if (body.length > 0) {
      request += '\n' + body
    }

    // get the session data
    const sessionData = getSessionData(sessionID)

    // send the request to the client
    sessionData.socket.write(request)

    // wait for the response
    const interval = setInterval(() => {
      const messageList = getSessionData(sessionID).messageList

      if (messageList[requestID]) {
        // ON THIS PART THE RESPONSE HEADERS HAS TO BE USING THE 
        // HEADERS FROM THE RESPONSE OF THE CLIENT NOT THE DEFAULT BUT ITS OKAY

        // send the response to the client
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        // write the body
        res.write(messageList[requestID])
        res.end();
        clearInterval(interval)

        // remove the request from the message list
        // ---------------

        return
      }
    }, 100)

    // we can close the interval after 10 seconds using set timeout
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
    const sessionData = getSessionData(sessionVars.sessionId)
    // get first line which the requestID
    const requestID = data.toString().split('\n')[0]
    sessionData.messageList[requestID] = data.toString().split('\n')[1]
  })

  socket.on('end', () => {
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
    expireMs: secondsToMs(60),
    data: {
      socket: socket,
      messageList: {},
    },
    action: () => {
      socket.end()
    }
  })

  // create a json file if not exists
  if (!fs.existsSync('sessions.json')) {
    fs.writeFileSync('sessions.json', '{}')
  }

  // read the json file 
  const sessions = fs.readFileSync('sessions.json')
  const sessionsJson = JSON.parse(sessions)
  sessionsJson[sessionEndpoint] = sessionId

  // write the session to the json file
  fs.writeFileSync('sessions.json', JSON.stringify(sessionsJson))

  return { sessionEndpoint, sessionId }
}