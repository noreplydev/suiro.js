const flagsDeclaration = [
  {
    name: 'port',
    alias: 'p',
    type: Number,
    description: 'Local service exposed port',
    typeLabel: '<port>',
  },
  {
    name: 'host',
    alias: 's',
    type: String,
    description: 'Tunneling server host',
    typeLabel: '<host:port>',
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Usage instructions',
  }
]


module.exports = {
  flagsDeclaration
}