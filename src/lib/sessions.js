const path = require('path')
const fs = require('fs')

const PATH = path.join(__dirname, '..', 'sessions.json')

function storeSession(sessionID, sessionEndpoint) {
  const sessions = getSessions()

  // we only handle undefined maybe the file is empty
  if (sessions === undefined) {
    return false
  }

  // add session
  sessions[sessionEndpoint] = sessionID

  try {
    fs.writeFileSync(PATH, JSON.stringify(sessions))
    return true
  } catch (e) {
    return false
  }
}

function getSessionID(sessionEndpoint) {
  const sessions = getSessions()

  // we only handle undefined maybe the file is empty
  if (sessions === undefined) {
    return undefined
  }

  if (!sessions[sessionEndpoint]) {
    return undefined
  }

  // get the sessionID based on the request endoint
  return sessions[sessionEndpoint]
}

function getSessions() {
  // create a json file if not exists
  if (!fs.existsSync(PATH)) {
    fs.writeFileSync(PATH, '{}')
  }

  try {
    // read the json file
    const json = fs.readFileSync(PATH)
    const jsonObject = JSON.parse(json) // const to catch error
    return jsonObject
  } catch (e) {
    return undefined
  }
}

module.exports = {
  storeSession,
  getSessionID,
}