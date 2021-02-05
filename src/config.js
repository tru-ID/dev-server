const path = require('path')
require('dotenv').config()

console.log('Loading standard configuration')

const PORT = process.env.PORT ?? 8080
const DEBUG = process.env.DEBUG === undefined? true : process.env.DEBUG === 'true'
const API_BASE_URL = process.env.API_BASE_URL ?? 'https://eu.api.tru.id'
const CLIENT_ID = process.env.TRU_ID_CLIENT_ID
const CLIENT_SECRET = process.env.TRU_ID_CLIENT_SECRET
const LOCALTUNNEL_ENABLED = process.env.LOCALTUNNEL_ENABLED? process.env.LOCALTUNNEL_ENABLED === 'true' : false
const LOCALTUNNEL_SUBDOMAIN = process.env.LOCALTUNNEL_SUBDOMAIN

function configure(params) {
    const processConfig = {
        port: PORT,
        DEBUG: DEBUG,
        apiBaseUrl: API_BASE_URL,
        basicAuth: {
            username: process.env.USERNAME,
            password: process.env.PASSWORD
        },
        project: {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
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

    // Override config from process.env with those passed as parameters
    const config = {...processConfig, ...params}

    if(!config.project) {
        const defaultProjectLocation = path(__dirname, '..', 'tru.json')
        console.log(`Loading tru.json project configuration from default location: "${defaultProjectLocation}"`)
        config.project = require(process.env.PROJECT_PATH ?? defaultProjectLocation)
    }

    return config
}

module.exports = configure