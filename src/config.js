require('dotenv').config()

const PORT = process.env.PORT ?? 8080
const DEBUG = process.env.DEBUG === undefined? true : process.env.DEBUG === 'true'
const API_BASE_URL = process.env.API_BASE_URL ?? 'https://eu.api.tru.id'

const projectConfig = require(process.env.CONFIG_PATH ?? `${__dirname}/../tru.json`)

module.exports = {
    PORT: PORT,
    DEBUG: DEBUG,
    API_BASE_URL: API_BASE_URL,
    PROJECT: projectConfig
}