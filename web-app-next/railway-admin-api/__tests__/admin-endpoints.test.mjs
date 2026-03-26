import request from 'supertest'
import { app } from '../server.js'

const api = request(app)

let token = null

beforeAll(async () => {
  const res = await api.post('/api/login').send({ username: 'admin', password: 'admin123' })
  if (res.status === 200 && res.body?.token) token = res.body.token
})

describe('Admin API Phase 1.2 Endpoints', () => {
  test('login returns token', async () => {
    const res = await api.post('/api/login').send({ username: 'admin', password: 'admin123' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
  })

  test('create product', async () => {
    const prod = { name: 'Test Product', price: 1000, stock: 5, slug: 'test-product', bucket:'Tops', subCategory:'Shirt' }
    const res = await api.post('/api/products').set('Authorization', `Bearer ${token}`).send(prod)
    expect([200,201]).toContain(res.status)
    expect(res.body).toHaveProperty('id')
  })

  test('list products', async () => {
    const res = await api.get('/api/products').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test('bulk import', async () => {
    const items = [
      { name: 'BulkX', price: 50, stock: 2, slug: 'bulkx', bucket:'Tops', subCategory:'Shirt' },
      { name: 'BulkY', price: 60, stock: 3, slug: 'bulky', bucket:'Bottoms', subCategory:'Pants' }
    ]
    const res = await api.post('/api/products/bulk').set('Authorization', `Bearer ${token}`).send(items)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test('bulk delete', async () => {
    const list = await api.get('/api/products').set('Authorization', `Bearer ${token}`)
    const ids = (list.body || []).slice(-2).map(p => p.id).filter(Boolean)
    if (ids.length === 0) return
    const res = await api.post('/api/products/bulk-delete').set('Authorization', `Bearer ${token}`).send({ ids })
    expect(res.status).toBe(200)
  })
})
