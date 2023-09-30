# Tunnel (building 🚧)

Tunnel is an self-hosted and open-source project that aims to provide a simple and easy to use tool for creating and managing http tunnels to your local network.

It works by creating a tunnel between your local network and a public server, so you can access your local network from anywhere. 

There 2 main pieces of this project, the tunneling server and the agent.

The server is responsible for managing the connections and the agent is responsible for creating the tunnel between your local network and the server.

The core of the project is on the server, the agent is just a simple tool to make the connection between your local network and the server.

## Server
The server has two main parts inside of it, the exposed API and the tunneling server. 

The exposed API is responsible for managing the connections and the tunneling server is responsible for creating the tunnel between your local network and the server.

## Agent
Tunnel has an agent which is the responsible for starting the connection with the tunneling server.

## Limitations
Tunnel is still in development but we can predict some limitations that will be present in the first release.

#### · Url resolution
When a exposed service like a react app refers to a local resource (like an image) with relative routes it could not work. When a resource is requested using relative routes the browser will try to find the resource in the server. To be more clear, if the service endpoint is `https://52.23.234.23/8noiasdb238` and the resource is `/static/image.png` the browser will try to find the resource in `https://52.23.234.23/static/image.png` instead of `https://52.23.234.23/8noiasdb238/static/image.png` so to solve this, the tunneling server uses the referer header to make url resolution but this header is not required by the HTTP protocol so it can be missing in some cases. 

## License
Tunnel is licensed under the MIT license.

made with ❤️ by @noreplydev

