const { Router } = require('express')
const router = Router()
const jwksClient = require('jwks-rsa')
const httpSignature = require('http-signature')
const util = require('util')
const api = require('./tru-api')

let config = null

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
        config.log('error in /check')
        config.log(error.toString(), error.data)

        res.send('Whoops!').status(500)
    }

}

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
        config.log('error in getting PhoneCheck status')
        config.log(error.toString(), error.data)

        res.send('Whoops!').status(500)
    }

}

/**
 * Handles a callback from the tru.ID platform indicating that a Phone Check has reached an end state.
 */
async function phoneCheckCallback(req, res) {
    config.log('PhoneCheck received callback',
        req.headers,
        req.body)

    const parsed = httpSignature.parseRequest(req)
    const keyId = parsed.keyId

    const keyClient = jwksClient({
        jwksUri: `${config.API_BASE_URL}/.well-known/jwks.json`
    })
    const getSigningKey = util.promisify(keyClient.getSigningKey)

    const jwk = await getSigningKey(keyId)

    const verified = httpSignature.verifySignature(parsed, jwk.getPublicKey())
    if (!verified) {
        res.sendStatus(400)
        return
    }
    res.sendStatus(200)
}
router.post('/callback', phoneCheckCallback)
router.post('/phone-check/callback', phoneCheckCallback)

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
        config.log(simCheck)

        // Select data to send to client
        res.json({
            no_sim_change: simCheck.no_sim_change,
            last_sim_change_at: simCheck.last_sim_change_at
        })
    }
    catch(error) {
        config.log('error in creating SIMCheck')
        config.log(error.toString(), error.data)

        res.send('Whoops!').status(500)
    }
}

// Country

async function CountryCoverage(req, res) {
    const countryCode = req.query.country_code

    if(!countryCode) {
        res.json({'error_message': 'country_code parameter is required'}).status(400)
        return
    }

    try {
        const countryCoverage = await api.getCountryCoverage(countryCode)
        config.log(countryCoverage)

        // Select data to send to client
        res.json(countryCoverage)
    }
    catch(error) {
        config.log('error getting country coverage')
        config.log(error.toString(), error.data)

        res.send('Whoops!').status(500)
    }
}


// Device

async function DeviceCoverage(req, res) {
    const ipAddress = req.query.id_address || req.ip

    if(!ipAddress) {
        res.json({'error_message': 'id_address parameter is required'}).status(400)
        return
    }

    try {
        const deviceCoverage = await api.getDeviceCoverage(ipAddress)
        config.log(deviceCoverage)

        res.status(deviceCoverage.status ?? 200).json(deviceCoverage)
    }
    catch(error) {
        config.log('error getting device coverage')
        config.log(error.toString(), error.data)

        res.send('Whoops!').status(500)
    }
}

function routes(_config) {
    config = _config

    router.post('/check', phoneCheck)
    router.post('/phone-check', phoneCheck)
    router.get('/check_status', phoneCheckStatus)
    router.get('/phone-check', phoneCheckStatus)

    router.post('/sim-check', SimCheck)

    router.get('/country', CountryCoverage)
    router.get('/device', DeviceCoverage)

    return router
}

module.exports = routes