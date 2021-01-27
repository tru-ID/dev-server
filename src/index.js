const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const jwksClient = require('jwks-rsa')
const httpSignature = require('http-signature')
const util = require('util')

const config = require('./config')

log('configuration:\n', config)

const keyClient = jwksClient({
    jwksUri: `${config.API_BASE_URL}/.well-known/jwks.json`
})

const getSigningKey = util.promisify(keyClient.getSigningKey)

const api = require('./api')

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
        const phoneCheck = await api.createPhoneCheck(req.body.phone_number)

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
        const phoneCheck = await api.getPhoneCheck(req.query.check_id)
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
        const simCheck = await api.createSimCheck(phoneNumber)
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

// Country

async function CountryCoverage(req, res) {
    const countryCode = req.query.country_code

    if(!countryCode) {
        res.json({'error_message': 'country_code parameter is required'}).status(400)
        return
    }

    try {
        const countryCoverage = await api.getCountryCoverage(countryCode)
        log(countryCoverage)

        // Select data to send to client
        res.json(countryCoverage)
    }
    catch(error) {
        log('error getting country coverage')
        log(error.toString(), error.data)

        res.send('Whoops!').status(500)
    }
}
app.get('/country', CountryCoverage)

function log() {
    if(config.DEBUG) {
        console.debug.apply(null, arguments)
    }
}

app.listen(config.PORT, () => {
    console.log(`Example app listening at http://localhost:${config.PORT}`)
})