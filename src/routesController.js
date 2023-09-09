const { addRouter } = require("./routes/add")

const routes = {
  '/add': addRouter
}


exports.routesController = (stream, headers) => {
  if (routes[headers[':path']]) {
    return routes[headers[':path']](stream, headers)
  }

  stream.respond({
    'content-type': 'text/html',
    ':status': 404
  })

  stream.end('<h1>404 Not Found</h1>')
}