const path = require('path')
const express = require('express')
const cors = require('cors')
const createConfig = require('./config')

async function serve(customConfig) {
  const config = createConfig(customConfig)
  config.log('configuration:\n', config)
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // required for `req.ip` to be populated if behind a proxy i.e. ngrok
  app.set('trust proxy', true)

  // setup basic auth if credentials are in .env
  if (config.basicAuth.username && config.basicAuth.password) {
    const passwordProtected = require('express-password-protect')
    const authConfig = {
      username: config.basicAuth.username,
      password: config.basicAuth.password,
      maxAge: 60000 * 10, // 1 hour
    }
    app.use(passwordProtected(authConfig))
    app.post('/', (req, res) => {
      const referrer = req.get('referer')
      res.redirect(referrer || '/')
    })
  }
  app.use(express.static(path.join(__dirname, '..', 'public')))

  const routes = require('./routes')
  app.use(routes(config))

  app.listen(config.port, () => {
    console.log(`Example app listening at http://localhost:${config.port}`)
  })

  if (config.ngrok.enabled) {
    // https://github.com/bubenshchykov/ngrok
    console.log('Starting Ngrok')

    const ngrok = require('ngrok')

    const url = await ngrok.connect({
      proto: 'http', // http|tcp|tls, defaults to http
      addr: config.port, // port or network address, defaults to 80
      subdomain: config.ngrok.subdomain, // reserved tunnel name https://alex.ngrok.io
      authtoken: config.ngrok.authtoken, // your authtoken from ngrok.com
      region: 'us', // one of ngrok regions (us, eu, au, ap, sa, jp, in), defaults to us
      onStatusChange: status => {
        console.log(`ngrok status change: ${status}`)
      },
    });

    console.log(`ngrok: ${url}`)
  }

  if (config.localtunnel.enabled) {
    // https://github.com/localtunnel/localtunnel
    config.log('Starting localtunnel')
    const localtunnel = require('localtunnel')
    const tunnel = await localtunnel({
      port: config.port,
      subdomain: config.localtunnel.subdomain,
    })
    tunnel.on('request', (info) => {
      console.log(info)
    })
    tunnel.on('error', (error) => {
      console.error(error)
    })
    tunnel.on('close', () => {
      console.log('localtunnel closing')
    })
    console.log(`localtunnel: ${tunnel.url}`)
  }
}

module.exports = {
  serve,
}
