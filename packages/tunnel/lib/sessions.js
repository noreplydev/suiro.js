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

function removeSession(sessionEndpoint) {
  const sessions = getSessions()

  // we only handle undefined maybe the file is empty
  if (sessions === undefined) {
    return undefined
  }

  if (!sessions[sessionEndpoint]) {
    return true
  }

  // remove session
  delete sessions[sessionEndpoint]

  // write the file with the session removed
  try {
    const content = fs.readFileSync(PATH)
    const jsonObject = JSON.parse(content)

    delete jsonObject[sessionEndpoint]

    fs.writeFileSync(PATH, JSON.stringify(jsonObject))
  } catch (e) {
    return false
  }

  return true
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
  removeSession
}