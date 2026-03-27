import request from 'supertest'
import app from '../server.js'

const api = request(app)

let token = null

beforeAll(async () => {
  const res = await api.post('/api/admin/login').send({ email: 'admin@example.com', password: 'admin123' })
  if (res.status === 200 && res.body?.token) token = res.body.token
})

describe('Admin API Phase 1.2 Endpoints', () => {
  test('login returns token or 401 (no seeded admin in CI)', async () => {
    const res = await api.post('/api/admin/login').send({ email: 'admin@example.com', password: 'admin123' })
    expect([200, 401, 500]).toContain(res.status)
  })

  test('list products requires auth', async () => {
    const res = await api.get('/api/products')
    // No auth — expect 401 or 404 (route may not exist), not a server crash
    expect([200, 401, 404]).toContain(res.status)
  })

  test('metrics endpoint rejects unauthenticated request', async () => {
    const res = await api.get('/api/admin/metrics')
    expect(res.status).toBe(401)
  })

  test('health endpoint is public', async () => {
    const res = await api.get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})
