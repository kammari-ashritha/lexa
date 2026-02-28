// Simple logger for Lexa backend
const log = (level, message, data = '') => {
  const time = new Date().toISOString()
  const dataStr = data ? ` | ${typeof data === 'object' ? JSON.stringify(data) : data}` : ''
  console.log(`[${time}] [${level}] ${message}${dataStr}`)
}

module.exports = {
  info:  (msg, data) => log('INFO ', msg, data),
  error: (msg, data) => log('ERROR', msg, data),
  warn:  (msg, data) => log('WARN ', msg, data),
  debug: (msg, data) => log('DEBUG', msg, data),
}