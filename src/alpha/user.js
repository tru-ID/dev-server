const jose = require('jose')
const { createLoginIdApi } = require('./login-id-api')

async function resolveUserId(jwt, jwks) {
  const { payload: claims } = await jose.jwtVerify(jwt, jwks)

  // the user ID is the sub claims in the JWT
  const { sub: userId } = claims

  if (!userId) {
    throw new Error('could not decode the login ID user ID from the given JWT')
  }

  return userId
}

async function deleteFidoUser(config) {
  const loginIdApi = await createLoginIdApi(config)
  const JWKS = jose.createRemoteJWKSet(
    new URL(`${config.loginId.baseUrl}/api/native/keys`),
  )

  return async (req, res) => {
    const { jwt } = req.body
    if (!jwt) {
      res.status(400).json({ error_message: 'jwt is required' })
      return
    }

    // validate jwt and extract username
    let userId
    try {
      userId = await resolveUserId(jwt, JWKS)
    } catch (error) {
      res.status(500).json({ error_message: error.message })
      return
    }

    try {
      await loginIdApi.deleteUser(userId)
    } catch (error) {
      res.status(500).json({ error_message: error.message })
      return
    }

    res.sendStatus(204)
  }
}

module.exports = {
  deleteFidoUser,
}
