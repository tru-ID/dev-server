/* eslint-disable no-underscore-dangle */
const axios = require('axios').default
const crypto = require('node:crypto')
const jose = require('jose')

// LoginID keys generated through the web app are Elliptic Curve keys
const DEFAULT_ALGORITHM = 'ES256'

class LoginIdApi {
  constructor(clientId, baseUrl, privateKey, algorithm) {
    this._clientId = clientId
    this._baseUrl = baseUrl
    this._privateKey = privateKey
    this._algorithm = algorithm
  }

  async deleteUser(userId) {
    const url = `${this._baseUrl}/manage/users/${userId}`

    const serviceToken = await this._generateServiceToken('users.delete', userId)
    const headers = {
      Authorization: `Bearer ${serviceToken}`,
      'X-Client-ID': this._clientId,
      'Content-Type': 'application/json',
    }

    try {
      await axios.delete(url, {headers});
    } catch (error) {
      throw new Error(`failed to delete user with id ${userId}: LoginID replied with ${error.response.status} - ${error.response.data.message}`);
    }
  }

  async _generateServiceToken(scope, userId) {
    const claims = {
      nonce: crypto.randomUUID(),
      user_id: userId,
      scope,
    }

    return new jose.SignJWT(claims)
      .setProtectedHeader({ alg: this._algorithm })
      .setIssuedAt()
      .sign(this._privateKey)
  }
}

async function createLoginIdApi(config) {
  const { clientId, baseUrl } = config.loginId
  const { pemKey, algorithm } = config.loginId.privateKey

  const keyAlg = algorithm ?? DEFAULT_ALGORITHM

  const privateKey = await jose.importPKCS8(pemKey, keyAlg)

  return new LoginIdApi(clientId, baseUrl, privateKey, keyAlg)
}

module.exports = {
  createLoginIdApi,
}
