const request = require('supertest')
const server = require('../src/server')

describe('test', () => {
  let app
  let httpServer
  beforeAll((done) => {
    server.serve().then((result) => {
      app = result.app
      httpServer = result.server
      done()
    })
  })

  afterAll((done) => {
    httpServer.close(done)
  })

  test('starts correctly', () => request(app).get('/').expect(200))
})
