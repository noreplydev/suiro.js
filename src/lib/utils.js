function getLogTime() {
  const date = Date.now();

  // generate a data format of HOUR::MINUTE::SECOND and return 
  return '(' + new Date(date).toLocaleTimeString('en-US', { hour12: false }) + ')'
}

module.exports = {
  getLogTime
}