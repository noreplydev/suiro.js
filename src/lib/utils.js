function getLogTime() {
  const date = Date.now();

  // generate a data format of HOUR::MINUTE::SECOND and return 
  return '(' + new Date(date).toLocaleTimeString('en-US', { hour12: false }) + ')'
}

function toTitleCase(str) {
  return str.replace(/[a-z]*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}

module.exports = {
  getLogTime,
  toTitleCase
}