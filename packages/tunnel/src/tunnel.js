const net = require('net')
const http = require('http')
const { nanoid } = require('nanoid')
const { createSession, secondsToMs, getSessionData, minutesToMs } = require('alive-sessions')
const { storeSession, getSessionID, removeSession } = require('../lib/sessions')
const { getLogTime, toTitleCase } = require('../lib/utils')
const { getRequestUrl } = require('../modules/http')

// http server for consumption
http.createServer((req, res) => {
  let body = '';
  let headers = '';

  req.on('data', function (chunk) {
    body += chunk;
  });

  req.on('end', function () {
    let [requestEndpoint, ...hostRequestEndpoint] = getRequestUrl(req)

    if (!requestEndpoint && !hostRequestEndpoint.length) {
      res.writeHead(200);
      res.end(`
        <h1>Tunnel</h1>
        <code>https://github.com/noreplydev/tunnel.git</code>
      `);
      return
    }

    // get the sessionID based on the request endoint
    const sessionID = getSessionID(requestEndpoint)

    try {
      // if the sessionID is not found, throw an error
      getSessionData(sessionID)
    } catch (e) {
      console.log(getLogTime() + '[TUNNEL] ERROR: Unhandled route `' + requestEndpoint + '`')
      res.writeHead(404);
      res.end("<h1>404 Not Found</h1>");
      return
    }

    headers += req.method + ' /' + hostRequestEndpoint.join('/') + ' HTTP/' + req.httpVersion + '\n'

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

    // get the message list
    const messageList = sessionData.messageList

    // wait for the response appear in the message list
    const interval = setInterval(() => {
      if (messageList[requestID]) {
        const hostResponse = messageList[requestID]

        // send the response to the client
        res.writeHead(hostResponse.statusCode, {
          ...hostResponse.headers,
        });

        // write the body
        const base64Body = messageList[requestID].body
        const body = Buffer.from(base64Body, 'base64').toString('utf-8')

        res.write(body)
        res.end();

        // remove the request from the message list
        delete messageList[requestID]

        clearInterval(interval)
        return
      }
    }, 100)

    // we can close the interval after 10 seconds using set timeout
  })

  req.on('err', function (err) {
    console.error(err);
  })

}).listen(3000, () => {
  console.log(getLogTime() + '[HTTP] Listening on port 3000')
})

// tunneling service
const tunnelingServer = net.createServer((socket) => {
  let sessionVars = addSession(socket)

  // packet manager for tcp-segmentation
  let packetRequestID = ''
  let packetAccData = ''
  let packetTotalSize = 0
  let packetAccSize = 0

  console.log(getLogTime() + '[TUNNEL] NEW: ' + sessionVars.sessionId + ' → ' + sessionVars.sessionEndpoint)

  socket.on('data', (data) => {
    const sessionData = getSessionData(sessionVars.sessionId)

    // check if the packet is splitted
    if (packetRequestID !== '') {
      // append the packet data
      packetAccData += data.toString()
      packetAccSize += Buffer.byteLength(data)

      if (packetTotalSize === packetAccSize) {
        console.log(getLogTime() + '[TUNNEL] DATA: ', sessionVars.sessionId)

        try {
          sessionData.messageList[packetRequestID] = JSON.parse(packetAccData)
        } catch (e) {
          console.log('the agent responded with bad format')
        }

        // reset the packet manager values
        packetAccSize = 0
        packetTotalSize = 0
        packetAccData = ''
        packetRequestID = ''
      }

      return // exit and wait for the next packet fragment
    }

    // check if the pcket length is fine
    const [packetHeader, packetData] = data.toString().split('\n\n\n')
    const [requestID, packetSize] = packetHeader.split(':::')

    // firse packet appear 
    if (Number(packetSize) === Number(Buffer.byteLength(packetData))) {
      console.log(getLogTime() + '[TUNNEL] DATA: ', sessionVars.sessionId)

      try {
        sessionData.messageList[requestID] = JSON.parse(packetData)
      } catch (e) {
        console.log('the agent responded with bad format')
      }
    } else {
      // splitted packet
      packetRequestID = requestID
      packetAccSize = Buffer.byteLength(packetData)
      packetAccData = packetData
      packetTotalSize = Number(packetSize)
    }
  })

  socket.on('end', () => {
    try {
      removeSession(sessionVars.sessionEndpoint)
      console.log(getLogTime() + '[TUNNEL] CLOSED: ' + sessionVars.sessionId)
    } catch (err) {
      console.log(getLogTime() + '[TUNNEL] CLOSED-WITH-ERROR: ' + sessionVars.sessionId)
    }
  })

})

tunnelingServer.listen(8080, () => {
  console.log(getLogTime() + '[TUNNEL] Listening on port 8080')
})

function addSession(socket) {
  // create a session for each client
  const sessionId = nanoid().toString()
  const sessionEndpoint = nanoid().toString()

  // create a session and close after timeout
  createSession({
    sessionID: sessionId,
    expireMs: minutesToMs(1),
    data: {
      socket: socket,
      messageList: {},
    },
    action: () => {
      socket.end()
      // remove the session from the sessions file
    }
  })

  // update the sessions file 
  storeSession(sessionId, sessionEndpoint)

  return { sessionEndpoint, sessionId }
}

