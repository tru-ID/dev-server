const logger = require('pino')({
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: true,
    },
  },
})
const expressPino = require('express-pino-logger')({
  logger,
})

module.exports = {
  logger,
  expressPino,
}
