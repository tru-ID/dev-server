require('dotenv').config()

console.log('Loading standard configuration')

const PORT = process.env.PORT ?? 8080
const DEBUG = process.env.DEBUG === undefined? true : process.env.DEBUG === 'true'
const API_BASE_URL = process.env.API_BASE_URL ?? 'https://eu.api.tru.id'
const CLIENT_ID = process.env.TRU_ID_CLIENT_ID
const CLIENT_SECRET = process.env.TRU_ID_CLIENT_SECRET
const LOCALTUNNEL_ENABLED = process.env.LOCALTUNNEL_ENABLED? process.env.LOCALTUNNEL_ENABLED === 'true' : false
const LOCALTUNNEL_SUBDOMAIN = process.env.LOCALTUNNEL_SUBDOMAIN

let projectConfig = null
if(!CLIENT_ID && !CLIENT_SECRET ) {
    console.log('Loading tru.json project configuration')
    projectConfig = require(process.env.CONFIG_PATH ?? `${__dirname}/../tru.json`)
}
else {
    console.log('Project configuration loaded from environment variables')
}

module.exports = {
    port: PORT,
    DEBUG: DEBUG,
    apiBaseUrl: API_BASE_URL,
    basicAuth: {
        username: process.env.USERNAME,
        password: process.env.PASSWORD
    },
    project: {
        client_id: CLIENT_ID || projectConfig.credentials[0].client_id,
        client_secret: CLIENT_SECRET || projectConfig.credentials[0].client_secret
    },
    localtunnel: {
        enabled: LOCALTUNNEL_ENABLED,
        subdomain: LOCALTUNNEL_SUBDOMAIN
    },
    log: function() {
        if(DEBUG) {
            console.debug.apply(null, arguments)
        }
    }
}