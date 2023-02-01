const axios = require('axios')
const { Router } = require('express')
const jwksClient = require('jwks-rsa')
const httpSignature = require('http-signature')
const util = require('util')
const createApi = require('./tru-api')

const router = Router()
let api = null
let config = null

// PhoneCheck

/**
 * Handles a request to create a PhoneCheck for the phone number within `req.body.phone_number`.
 */
async function createPhoneCheck(req, res) {
  if (!req.body.phone_number) {
    res
      .status(400)
      .json({ error_message: 'phone_number parameter is required' })
    return
  }

  try {
    const phoneCheckRes = await api.createPhoneCheck(req.body.phone_number)

    // Select data to send to client
    res.json({
      check_id: phoneCheckRes.check_id,
      check_url: phoneCheckRes._links.check_url.href,
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).send(error.response.data)
        return
      }
    }
    res.sendStatus(500)
  }
}

async function createPhoneCheckV2(req, res) {
  const { phone_number, redirect_url } = req.body
  if (!phone_number) {
    res
      .status(400)
      .json({ error_message: 'phone_number parameter is required' })
    return
  }

  try {
    const phoneCheckRes = await api.createPhoneCheckV2(
      phone_number,
      redirect_url,
    )

    // Select data to send to client
    res.json({
      check_id: phoneCheckRes.check_id,
      check_url: phoneCheckRes._links.check_url.href,
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).send(error.response.data)
        return
      }
    }
    res.sendStatus(500)
  }
}

/**
 * Handle the request to check the state of a Phone Check. `req.query.check_id` must contain a valid Phone Check ID.
 */
async function getPhoneCheckStatus(req, res) {
  if (!req.query.check_id) {
    res.status(400).json({ error_message: 'check_id parameter is required' })
    return
  }

  try {
    const phoneCheckRes = await api.getPhoneCheck(req.query.check_id)
    res.json({
      match: phoneCheckRes.match,
      check_id: phoneCheckRes.check_id,
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).send(error.response.data)
        return
      }
    }
    res.sendStatus(500)
  }
}

async function getPhoneCheckStatusV2(req, res) {
  if (!req.query.check_id) {
    res.status(400).json({ error_message: 'check_id parameter is required' })
    return
  }

  try {
    const phoneCheckRes = await api.getPhoneCheckV2(req.query.check_id)
    res.json({
      match: phoneCheckRes.match,
      check_id: phoneCheckRes.check_id,
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).send(error.response.data)
        return
      }
    }
    res.sendStatus(500)
  }
}

async function phoneCheckCodeExchangeV2(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).end()
    return
  }

  let code
  let check_id
  let reference_id

  if (req.method === 'GET') {
    // GET is used when the phone check is created with a redirect back to the server
    // so device browser/sdk will follow the url that contains the params in the query
    code = req.query.code
    check_id = req.query.check_id
    reference_id = req.query.reference_id
  } else if (req.method === 'POST') {
    // POST is used when the phone check is created with a redirect back to the device
    // so the device will have to make a POST with body that contains the params
    code = req.body.code
    check_id = req.body.check_id
    reference_id = req.body.reference_id
  }

  if (!code) {
    res.status(400).json({ error_message: 'code parameter is required' })
    return
  }
  if (!check_id) {
    res.status(400).json({ error_message: 'check_id parameter is required' })
    return
  }

  try {
    const phoneCheckRes = await api.patchPhoneCheckV2(
      check_id,
      code,
      reference_id,
    )

    // Select data to send to client
    res.json({
      check_id: phoneCheckRes.check_id,
      match: phoneCheckRes.match,
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).send(error.response.data)
        return
      }
    }
    res.sendStatus(500)
  }
}

/**
 * Handles a callback from the tru.ID platform indicating that a Phone Check has reached an end state.
 */
async function phoneCheckCallback(req, res) {
  req.log.info('PhoneCheck received callback')
  req.log.info({ headers: req.headers, body: req.body })

  const parsed = httpSignature.parseRequest(req)
  const { keyId } = parsed

  const keyClient = jwksClient({
    jwksUri: `${config.apiBaseUrl}/.well-known/jwks.json`,
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

// SubscriberCheck

/**
 * Handles a request to create a SubscriberCheck for the phone number within `req.body.phone_number`.
 */
async function createSubscriberCheck(req, res) {
  if (!req.body.phone_number) {
    res
      .status(400)
      .json({ error_message: 'phone_number parameter is required' })
    return
  }

  try {
    const subscriberCheckRes = await api.createSubscriberCheck(
      req.body.phone_number,
    )

    // Select data to send to client
    res.json({
      check_id: subscriberCheckRes.check_id,
      check_url: subscriberCheckRes._links.check_url.href,
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).send(error.response.data)
        return
      }
    }
    res.sendStatus(500)
  }
}

async function createSubscriberCheckV2(req, res) {
  const { phone_number, redirect_url } = req.body
  if (!phone_number) {
    res
      .status(400)
      .json({ error_message: 'phone_number parameter is required' })
    return
  }

  try {
    const SubscriberCheckRes = await api.createSubscriberCheckV2(
      phone_number,
      redirect_url,
    )

    // Select data to send to client
    res.json({
      check_id: SubscriberCheckRes.check_id,
      check_url: SubscriberCheckRes._links.check_url.href,
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).send(error.response.data)
        return
      }
    }
    res.sendStatus(500)
  }
}

/**
 * Handle the request to check the state of a SubscriberCheck. `req.params.check_id` must contain a valid SubscriberCheck ID.
 */
async function getSubscriberCheckStatus(req, res) {
  const checkId = req.query.check_id

  if (!checkId) {
    res.status(400).json({ error_message: 'check_id parameter is required' })
    return
  }

  try {
    const subscriberCheckRes = await api.getSubscriberCheck(checkId)
    res.json({
      match: subscriberCheckRes.match,
      check_id: subscriberCheckRes.check_id,
      no_sim_change: subscriberCheckRes.no_sim_change,
      last_sim_change_at: subscriberCheckRes.last_sim_change_at,
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).send(error.response.data)
        return
      }
    }
    res.sendStatus(500)
  }
}

async function getSubscriberCheckStatusV2(req, res) {
  if (!req.query.check_id) {
    res.status(400).json({ error_message: 'check_id parameter is required' })
    return
  }

  try {
    const subscriberCheckRes = await api.getSubscriberCheckV2(req.query.check_id)
    res.json({
      match: subscriberCheckRes.match,
      check_id: subscriberCheckRes.check_id,
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).send(error.response.data)
        return
      }
    }
    res.sendStatus(500)
  }
}

async function subscriberCheckCodeExchangeV2(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).end()
    return
  }

  let code
  let check_id
  let reference_id

  if (req.method === 'GET') {
    // GET is used when the subscriber check is created with a redirect back to the server
    // so device browser/sdk will follow the url that contains the params in the query
    code = req.query.code
    check_id = req.query.check_id
    reference_id = req.query.reference_id
  } else if (req.method === 'POST') {
    // POST is used when the subscriber check is created with a redirect back to the device
    // so the device will have to make a POST with body that contains the params
    code = req.body.code
    check_id = req.body.check_id
    reference_id = req.body.reference_id
  }

  if (!code) {
    res.status(400).json({ error_message: 'code parameter is required' })
    return
  }
  if (!check_id) {
    res.status(400).json({ error_message: 'check_id parameter is required' })
    return
  }

  try {
    const subscriberCheckRes = await api.patchSubscriberCheckV2(
      check_id,
      code,
      reference_id,
    )

    // Select data to send to client
    res.json({
      check_id: subscriberCheckRes.check_id,
      match: subscriberCheckRes.match,
      no_sim_change: subscriberCheckRes.no_sim_change
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).send(error.response.data)
        return
      }
    }
    res.sendStatus(500)
  }
}

// SIMCheck

async function createSimCheck(req, res) {
  console.log(req.body)
  const phoneNumber = req.body.phone_number

  if (!phoneNumber) {
    res
      .status(400)
      .json({ error_message: 'phone_number parameter is required' })
    return
  }

  try {
    const simCheck = await api.createSimCheck(phoneNumber)
    req.log.info(simCheck)

    // Select data to send to client
    res.json({
      no_sim_change: simCheck.no_sim_change,
      last_sim_change_at: simCheck.last_sim_change_at,
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).send(error.response.data)
        return
      }
    }
    res.sendStatus(500)
  }
}

// Coverage Access Token
async function getCoverageAccessToken(req, res) {
  const accessToken = await api.getCoverageAccessToken()

  if (accessToken === 'undefined') {
    return res.status(400).json({ error_message: 'Unable to create Coverage access token' })
  }

  return res.status(200).json({ token: accessToken })
}

// Country

async function getCountryCoverage(req, res) {
  const countryCode = req.query.country_code

  if (!countryCode) {
    res
      .status(400)
      .json({ error_message: 'country_code parameter is required' })
    return
  }

  try {
    const countryCoverage = await api.getCountryCoverage(countryCode)
    req.log.info(countryCoverage)

    // Select data to send to client
    res.json(countryCoverage)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).send(error.response.data)
        return
      }
    }
    res.sendStatus(500)
  }
}

// Device

async function getDeviceCoverage(req, res) {
  const ipAddress = req.query.id_address || req.ip

  if (!ipAddress) {
    res.status(400).json({ error_message: 'id_address parameter is required' })
    return
  }

  try {
    const deviceCoverage = await api.getDeviceCoverage(ipAddress)
    req.log.info(deviceCoverage)

    res.status(deviceCoverage.status ?? 200).json(deviceCoverage)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).send(error.response.data)
        return
      }
    }
    res.sendStatus(500)
  }
}

async function traces(req, res) {
  req.log.info(req.body)
  res.sendStatus(200)
}

function routes(_config) {
  config = _config

  api = createApi(config)

  // old routes (backwards compatibility)
  router.post('/check', createPhoneCheck)
  router.post('/phone-check', createPhoneCheck)
  router.get('/check_status', getPhoneCheckStatus)
  router.get('/phone-check', getPhoneCheckStatus)
  router.post('/callback', phoneCheckCallback)
  router.post('/phone-check/callback', phoneCheckCallback)

  router.post('/subscriber-check', createSubscriberCheck)
  router.get('/subscriber-check/:check_id', getSubscriberCheckStatus)

  router.post('/sim-check', createSimCheck)

  router.get('/coverage-access-token', getCoverageAccessToken)
  router.get('/country', getCountryCoverage)
  router.get('/device', getDeviceCoverage)

  router.post('/traces', traces)
  router.post('/v0.1/traces', traces)
  router.post('/v0.2/traces', traces)

  // old routes prefixed
  router.post('/v0.1/phone-check', createPhoneCheck)
  router.get('/v0.1/phone-check', getPhoneCheckStatus)
  router.post('/v0.1/phone-check/callback', phoneCheckCallback)

  router.post('/v0.1/subscriber-check', createSubscriberCheck)
  router.get('/v0.1/subscriber-check', getSubscriberCheckStatus)

  router.post('/v0.1/sim-check', createSimCheck)

  // new prefixed routes
  router.post('/v0.2/phone-check', createPhoneCheckV2)
  router.get('/v0.2/phone-check', getPhoneCheckStatusV2)
  router.use('/v0.2/phone-check/exchange-code', phoneCheckCodeExchangeV2)

  router.post('/v0.2/subscriber-check', createSubscriberCheckV2)
  router.get('/v0.2/subscriber-check', getSubscriberCheckStatusV2)
  router.use('/v0.2/subscriber-check/exchange-code', subscriberCheckCodeExchangeV2)

  return router
}

module.exports = routes
