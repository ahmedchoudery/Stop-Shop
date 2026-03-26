import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import bodyParser from 'body-parser'

const app = express()
const port = process.env.PORT || 5000

app.use(cors({ origin: true }))
app.use(express.json())
app.use(bodyParser.json())

// In-memory stores (swap with DB later)
const carts = new Map() // cartId -> { items: [] }
const orders = []

function ensureCart(cartId) {
  if (!carts.has(cartId)) carts.set(cartId, { items: [] })
  return carts.get(cartId)
}

function findItem(items, target) {
  return items.find(i => i.id === target.id && i.activeColor === target.activeColor && i.selectedSize === target.selectedSize)
}

// Add to cart
app.post('/cart/add', (req, res) => {
  const { cartId, item } = req.body
  const id = cartId || (uuidv4())
  const cart = ensureCart(id)
  const existingIndex = cart.items.findIndex(it => it.id === item.id && it.activeColor === item.activeColor && it.selectedSize === item.selectedSize)
  if (existingIndex > -1) {
    cart.items[existingIndex].quantity = (cart.items[existingIndex].quantity || 1) + (item.quantity || 1)
  } else {
    cart.items.push({ ...item, cartId: item.cartId || id, quantity: item.quantity || 1 })
  }
  res.json({ cartId: id, items: cart.items })
})

// Get cart
app.get('/cart/:cartId', (req, res) => {
  const { cartId } = req.params
  const cart = carts.get(cartId) || { items: [] }
  res.json({ cartId, items: cart.items })
})

// Update cart item (quantity or meta)
app.post('/cart/update', (req, res) => {
  const { cartId, cartItemId, delta, updatedSize, updatedColor } = req.body
  const cart = ensureCart(cartId)
  const idx = cart.items.findIndex((it) => (it.cartId === cartItemId) || (it.id === cartItemId))
  if (idx > -1) {
    const it = cart.items[idx]
    const newSize = updatedSize ?? it.selectedSize
    const newColor = updatedColor ?? it.activeColor
    const newQty = (it.quantity || 1) + (delta || 0)
    if (newQty <= 0) cart.items.splice(idx, 1)
    else cart.items[idx] = { ...it, quantity: newQty, selectedSize: newSize, activeColor: newColor }
  }
  res.json({ cartId, items: cart.items })
})

// Delete item
app.delete('/cart/:cartId/:cartItemId', (req, res) => {
  const { cartId, cartItemId } = req.params
  const cart = ensureCart(cartId)
  cart.items = cart.items.filter(i => i.cartId !== cartItemId && i.id !== cartItemId)
  res.json({ cartId, items: cart.items })
})

// Checkout (mock)
app.post('/checkout', (req, res) => {
  const { customer, items, total, paymentMethod } = req.body
  const orderId = 'ORD-' + uuidv4().slice(0, 8).toUpperCase()
  const order = { orderId, customer, items, total, paymentMethod, createdAt: new Date() }
  orders.push(order)
  res.json({ orderId, status: 'created' })
})

app.listen(port, () => {
  console.log(`Cart API running on http://localhost:${port}`)
})
