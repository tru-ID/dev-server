const logger = require('pino')({
  transport: {
    target: 'pino-pretty',
  },
})
const expressPino = require('express-pino-logger')({
  logger,
})

module.exports = {
  logger,
  expressPino,
}
