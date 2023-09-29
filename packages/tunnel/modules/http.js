function getRequestUrl(req) {
  const referer = req.headers.referer
  const [requestEndpoint, ...hostRequestEndpoint] = req.url.split('/').slice(1)

  // no referer means it's a first request
  if (!referer) {
    return [requestEndpoint, ...hostRequestEndpoint]
  }

  // if referer exists, it's possible that the request is a subrequest
  const refererSlices = referer.split('/')
  const refererEndpoint = refererSlices[3] // '0-http:'/'1'/'2-localhost:3000'/'3-endpoint'

  // if the referer endpoint is the same as the request endpoint return 
  // the normal request endpoint
  if (refererEndpoint === requestEndpoint) {
    return [requestEndpoint, ...hostRequestEndpoint]
  }

  // if the referer endpoint is not the same as the request endpoint
  // it means that the request is a subrequest
  return [refererEndpoint, ...[].concat(requestEndpoint, ...hostRequestEndpoint)]
}

module.exports = {
  getRequestUrl
}