const express = require('express')
const app = express()
const axios = require('axios')
const qs = require('querystring')

const port = process.env.PORT ?? 4040
const DEBUG = process.env.DEBUG === undefined? true : process.env.DEBUG === 'true'

const config = require(process.env.CONFIG_PATH ?? `${__dirname}/../4auth.json`)
log(config)

app.get('/check', async (req, res) => {

    if(!req.query.phone_number) {
        res.json({'error_message': 'phone_number parameter is required'}).status(400)
        return
    }

    try {
        const phoneCheck = await createPhoneCheck(req.query.phone_number)
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

})

app.get('/check_status', async (req, res) => {
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
        log('error in /check_status')
        log(error.toString(), error.data)

        res.send('Whoops!').status(500)
    }

    
})

async function createPhoneCheck(phoneNumber) {
    log('createPhoneCheck')

    const url = 'https://eu.api.4auth.io/phone_check/v0.1/checks'
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

async function getPhoneCheck(checkId) {
    log('getPhoneCheck')

    const url = `https://eu.api.4auth.io/phone_check/v0.1/checks/${checkId}`
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

async function getAccessToken() {
    log('getAccessToken')

    const url = 'https://eu.api.4auth.io/oauth2/v1/token'
    const params = qs.stringify({
        grant_type: 'client_credentials',
        scope: ['phone_check']
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