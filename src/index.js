const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const axios = require('axios')
const qs = require('querystring')
const jwksClient = require('jwks-rsa')
const httpSignature = require('http-signature')
const util = require('util')

require('dotenv').config()

const port = process.env.PORT ?? 8080
const DEBUG = process.env.DEBUG === undefined? true : process.env.DEBUG === 'true'
const API_BASE_URL = process.env.API_BASE_URL ?? 'https://eu.api.tru.id'

const config = require(process.env.CONFIG_PATH ?? `${__dirname}/../tru.json`)
log('configuration:\n', config)

const keyClient = jwksClient({
    jwksUri: `${API_BASE_URL}/.well-known/jwks.json`
})

const getSigningKey = util.promisify(keyClient.getSigningKey)

app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

// Routes

// PhoneCheck

/**
 * Handles a request to create a PhoneCheck for the phone number within `req.body.phone_number`.
 */
async function phoneCheck(req, res) {

    if(!req.body.phone_number) {
        res.json({'error_message': 'phone_number parameter is required'}).status(400)
        return
    }

    try {
        const phoneCheck = await createPhoneCheck(req.body.phone_number)

        // Select data to send to client
        res.json({
            check_id: phoneCheck.check_id,
            check_url: phoneCheck._links.check_url.href
        })
    }
    catch(error) {
        log('error in /check')
        log(error.toString(), error.data)

        res.send('Whoops!').status(500)
    }

}
app.post('/check', phoneCheck)
app.post('/phone-check', phoneCheck)

/**
 * Handle the request to check the state of a Phone Check. `req.query.check_id` must contain a valid Phone Check ID.
 */
async function phoneCheckStatus(req, res) {
    if(!req.query.check_id) {
        res.json({'error_message': 'check_id parameter is required'}).status(400)
        return
    }

    try {
        const phoneCheck = await getPhoneCheck(req.query.check_id)
        res.json({
            match: phoneCheck.match,
            check_id: phoneCheck.check_id        
        })
    }
    catch(error) {
        log('error in getting PhoneCheck status')
        log(error.toString(), error.data)

        res.send('Whoops!').status(500)
    }

}
app.get('/check_status', phoneCheckStatus)
app.get('/phone-check', phoneCheckStatus)

/**
 * Handles a callback from the tru.ID platform indicating that a Phone Check has reached an end state.
 */
async function phoneCheckCallback(req, res) {
    log('PhoneCheck received callback',
        req.headers,
        req.body)

    const parsed = httpSignature.parseRequest(req)
    const keyId = parsed.keyId

    const jwk = await getSigningKey(keyId)

    const verified = httpSignature.verifySignature(parsed, jwk.getPublicKey())
    if (!verified) {
        res.sendStatus(400)
        return
    }
    res.sendStatus(200)
}
app.post('/callback', phoneCheckCallback)
app.post('/phone-check/callback', phoneCheckCallback)

// SIMCheck

async function SimCheck(req, res) {
    const phoneNumber = req.body.phone_number || // application/json
                        req.form.phone_number    // application/x-www-form-urlencoded
    if(!phoneNumber) {
        res.json({'error_message': 'phone_number parameter is required'}).status(400)
        return
    }

    try {
        const simCheck = await createSimCheck(req.body.phone_number)
        log(simCheck)

        // Select data to send to client
        res.json({
            no_sim_change: simCheck.no_sim_change,
            last_sim_change_at: simCheck.last_sim_change_at
        })
    }
    catch(error) {
        log('error in creating SIMCheck')
        log(error.toString(), error.data)

        res.send('Whoops!').status(500)
    }
}
app.post('/sim-check', SimCheck)

// Resource Functions

// PhoneCheck

/**
 * Creates a PhoneCheck for the given `phoneNumber`.
 * 
 * @param {String} phoneNumber - The phone number to create a Phone Check for.
 */
async function createPhoneCheck(phoneNumber) {
    log('createPhoneCheck')

    const url = `${API_BASE_URL}/phone_check/v0.1/checks`
    const params = {
        phone_number: phoneNumber,
    }

    const auth = (await getAccessToken()).access_token
    const requestHeaders = {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json'
    }

    log('url', url)
    log('params', params)
    log('requestHeaders', requestHeaders)

    const phoneCheckCreationResult = await axios.post(url, params, {
        headers: requestHeaders
    })

    log('phoneCheckCreationResult.data', phoneCheckCreationResult.data)

    return phoneCheckCreationResult.data
}

/**
 * Retrieves a PhoneCheck with the given `check_id`
 * 
 * @param {String} checkId The ID of the PhoneCheck to retrieve.
 */
async function getPhoneCheck(checkId) {
    log('getPhoneCheck')

    const url = `${API_BASE_URL}/phone_check/v0.1/checks/${checkId}`
    const params = {}

    const auth = (await getAccessToken()).access_token
    const requestHeaders = {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json'
    }

    log('url', url)
    log('params', params)
    log('requestHeaders', requestHeaders)

    const getPhoneCheckResult = await axios.get(url, {
        params: params,
        headers: requestHeaders
    })

    log('getPhoneCheckResult.data', getPhoneCheckResult.data)

    return getPhoneCheckResult.data
}

// SIMCheck

async function createSimCheck(phoneNumber) {
    log('createSimCheck')

    const url = `${API_BASE_URL}/sim_check/v0.1/checks`
    const params = {
        phone_number: phoneNumber,
    }

    const auth = (await getAccessToken()).access_token
    const requestHeaders = {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json'
    }

    log('url', url)
    log('params', params)
    log('requestHeaders', requestHeaders)

    const simCheckCreationResult = await axios.post(url, params, {
        headers: requestHeaders
    })

    log('simCheckCreationResult.data', simCheckCreationResult.data)

    return simCheckCreationResult.data
}

// Tokens

/**
 * Creates an Access Token withon `phone_check` scope.
 */
async function getAccessToken() {
    log('getAccessToken')

    const url = `${API_BASE_URL}/oauth2/v1/token`
    const params = qs.stringify({
        grant_type: 'client_credentials',

        // scope to use depends on product
        scope: ['phone_check sim_check']
    })

    const toEncode = `${config.credentials[0].client_id}:${config.credentials[0].client_secret}`
    const auth = Buffer.from(toEncode).toString('base64')
    const requestHeaders = {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    log('url', url)
    log('params', params)
    log('requestHeaders', requestHeaders)

    const accessTokenResult = await axios.post(url, params, {
        headers: requestHeaders
    })

    log('accessTokenResult.data', accessTokenResult.data)

    return accessTokenResult.data
}

function log() {
    if(DEBUG) {
        console.debug.apply(null, arguments)
    }
}

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})