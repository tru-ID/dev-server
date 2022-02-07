const axios = require('axios')
const moment = require('moment')
const qs = require('querystring')
const { logger } = require('./logger')

const DEFAULT_SCOPES = ['phone_check sim_check subscriber_check coverage']

// token cache in memory
const TOKEN = {
  accessToken: undefined,
  expiresAt: undefined,
}

// Check
const CHECK_TYPES = {
  PHONE: 'phone',
  SIM: 'sim',
  SUBSCRIBER: 'subscriber',
}

// TODO this smells, fix it later
let config

// Tokens

/**
 * Creates an Access Token withon `phone_check` scope.
 *
 * @param scopes {Object} Optional. Array of scopes for the created access token. Defaults to `['phone_check sim_check coverage']`.
 */
async function getAccessToken(scopes = DEFAULT_SCOPES) {
  logger.info('getAccessToken')

  if (TOKEN.accessToken !== undefined && TOKEN.expiresAt !== undefined) {
    // we already have an access token let's check if it's not expired
    // I'm removing 1 minute just in case it's about to expire better refresh it anyway
    if (
      moment()
        .add(1, 'minute')
        .isBefore(moment(new Date(TOKEN.expiresAt)))
    ) {
      // token not expired
      return TOKEN.accessToken
    }
  }

  // we don't have an access token or it's expired

  const url = `${config.apiBaseUrl}/oauth2/v1/token`
  const params = qs.stringify({
    grant_type: 'client_credentials',

    // scope to use depends on product
    scope: scopes,
  })

  const toEncode = `${config.project.client_id}:${config.project.client_secret}`
  const auth = Buffer.from(toEncode).toString('base64')
  const requestHeaders = {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  logger.info({ url, params, requestHeaders })

  const accessTokenResult = await axios.post(url, params, {
    headers: requestHeaders,
  })

  logger.info(accessTokenResult.data)

  // update token cache in memory
  TOKEN.accessToken = accessTokenResult.data.access_token
  TOKEN.expiresAt = moment()
    .add(accessTokenResult.data.expires_in, 'seconds')
    .toString()

  return accessTokenResult.data.access_token
}

/**
 * Creates a Check of a type for the given `phoneNumber`.
 *
 * @param {String} type - `phone`, `sim` or `subscriber` via `CHECK_TYPES`
 * @param {String} phoneNumber - The phone number to create a Phone Check for.
 */
async function createCheck(type, phoneNumber) {
  logger.info('createCheck')

  const url = `${config.apiBaseUrl}/${type}_check/v0.1/checks`
  const params = {
    phone_number: phoneNumber,
  }

  const token = await getAccessToken()
  const requestHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  logger.info({ url, params, requestHeaders })

  const checkCreationResult = await axios.post(url, params, {
    headers: requestHeaders,
  })

  logger.info('checkCreationResult.data', checkCreationResult.data)

  return checkCreationResult.data
}
async function createCheckV2(type, phoneNumber, redirectUrl) {
  logger.info('createCheck')

  const url = `${config.apiBaseUrl}/${type}_check/v0.2/checks`
  const params = {
    phone_number: phoneNumber,
    redirect_url: redirectUrl,
  }

  const token = await getAccessToken()
  const requestHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  logger.info({ url, params, requestHeaders })

  const checkCreationResult = await axios.post(url, params, {
    headers: requestHeaders,
  })

  logger.info('checkCreationResult.data', checkCreationResult.data)

  return checkCreationResult.data
}

/**
 * Creates a Check of a type for the given `phoneNumber`.
 *
 * @param {String} type - `phone`, `sim` or `subscriber` via `CHECK_TYPES`
 * @param {String} id - The check ID.
 * @param {String} code - The code to be exchanged in order to complete the check.
 */
async function patchCheckV2(type, check_id, code, reference_id) {
  logger.info('patchCheck', type, check_id, code, reference_id)

  const url = `${config.apiBaseUrl}/${type}_check/v0.2/checks/${check_id}`
  const body = [{ op: 'add', path: '/code', value: code }]

  const token = await getAccessToken()
  const requestHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json-patch+json',
  }

  logger.info({ url, body, requestHeaders })

  const checkPatchResult = await axios.patch(url, body, {
    headers: requestHeaders,
  })

  logger.info('checkPatchResult.data', checkPatchResult.data)

  return checkPatchResult.data
}

/**
 * Retrieves a Check of a provided `type` with the given `check_id`
 *
 * @param {String} type - Either `phone` or `subscriber`
 * @param {String} checkId The ID of the PhoneCheck to retrieve.
 */
async function getCheck(type, checkId) {
  const url = `${config.apiBaseUrl}/${type}_check/v0.1/checks/${checkId}`
  const params = {}

  const token = await getAccessToken()
  const requestHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  logger.info({ url, params, requestHeaders })

  const getCheckResult = await axios.get(url, {
    params,
    headers: requestHeaders,
  })

  logger.info(getCheckResult.data)

  return getCheckResult.data
}

// PhoneCheck

/**
 * Creates a PhoneCheck for the given `phoneNumber`.
 *
 * @param {String} phoneNumber - The phone number to create a Phone Check for.
 */
async function createPhoneCheck(phoneNumber) {
  return createCheck(CHECK_TYPES.PHONE, phoneNumber)
}
async function createPhoneCheckV2(phoneNumber, redirectUrl) {
  return createCheckV2(CHECK_TYPES.PHONE, phoneNumber, redirectUrl)
}

/**
 * Retrieves a PhoneCheck with the given `check_id`
 *
 * @param {String} checkId The ID of the PhoneCheck to retrieve.
 */
async function getPhoneCheck(checkId) {
  return getCheck(CHECK_TYPES.PHONE, checkId)
}

/**
 * Patches a PhoneCheck with a code.
 *
 * @param {String} check_id - The check ID.
 * @param {String} code - The code used to complete the Phone Check flow.
 * @param {String} reference_id - Optional.
 */
async function patchPhoneCheckV2(check_id, code, reference_id) {
  return patchCheckV2(CHECK_TYPES.PHONE, check_id, code, reference_id)
}

// SubscriberCheck

/**
 * Creates a SubscriberCheck for the given `phoneNumber`.
 *
 * @param {String} phoneNumber - The phone number to create a SubscriberCheck for.
 */
async function createSubscriberCheck(phoneNumber) {
  return createCheck(CHECK_TYPES.SUBSCRIBER, phoneNumber)
}

/**
 * Retrieves a SubscriberCheck with the given `check_id`
 *
 * @param {String} checkId The ID of the SubscriberCheck to retrieve.
 */
async function getSubscriberCheck(checkId) {
  return getCheck(CHECK_TYPES.SUBSCRIBER, checkId)
}

// SIMCheck

async function createSimCheck(phoneNumber) {
  return createCheck(CHECK_TYPES.SIM, phoneNumber)
}

// Coverage / Countries

/**
 * Get product and network coverage by country code (e.g. GB) or phone number country prefix (e.g. 44).
 *
 * @param {string} countryCode
 */
async function getCountryCoverage(countryCode) {
  const url = `${config.apiBaseUrl}/coverage/v0.1/countries/${countryCode}`
  const token = await getAccessToken()
  const requestHeaders = {
    Authorization: `Bearer ${token}`,
  }

  logger.info({ url, requestHeaders })

  const countryCoverageResult = await axios.get(url, {
    headers: requestHeaders,
  })

  logger.info(countryCoverageResult.data)

  return countryCoverageResult.data
}

// Coverage / Device

/**
 * Get product and network coverage by IP address.
 *
 * @param {string} ipAddress the IP address of the device for which coverage is being queried
 */
async function getDeviceCoverage(ipAddress) {
  const url = `${config.apiBaseUrl}/coverage/v0.1/device_ips/${ipAddress}`
  const token = await getAccessToken()
  const requestHeaders = {
    Authorization: `Bearer ${token}`,
  }

  logger.info({ url, requestHeaders })

  const deviceCoverageResult = await axios.get(url, {
    headers: requestHeaders,
    validateStatus: (status) => status >= 200 && status <= 412,
  })

  logger.info(deviceCoverageResult.data)

  return deviceCoverageResult.data
}

const api = {
  createPhoneCheck,
  createPhoneCheckV2,
  getPhoneCheck,
  patchPhoneCheckV2,
  createSubscriberCheck,
  getSubscriberCheck,
  createSimCheck,
  getCountryCoverage,
  getAccessToken,
  getDeviceCoverage,
}

module.exports = function (_config) {
  config = _config
  return api
}
