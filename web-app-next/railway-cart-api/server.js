import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 5001

app.use(cors({ origin: true }))
app.use(express.json())
app.use(bodyParser.json())

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/stopshop')
  .then(() => console.log('Cart API connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err))

// Schemas
const cartSchema = new mongoose.Schema({
  cartId: { type: String, required: true, unique: true },
  items: [mongoose.Schema.Types.Mixed],
  updatedAt: { type: Date, default: Date.now }
})

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customer: mongoose.Schema.Types.Mixed,
  items: [mongoose.Schema.Types.Mixed],
  total: Number,
  currency: { type: String, default: 'PKR' },
  paymentMethod: String,
  createdAt: { type: Date, default: Date.now }
})

const Cart = mongoose.model('Cart', cartSchema)
const Order = mongoose.model('Order', orderSchema)

function findItem(items, target) {
  return items.find(i => i.id === target.id && i.activeColor === target.activeColor && i.selectedSize === target.selectedSize)
}

// Add to cart
app.post('/cart/add', async (req, res) => {
  const { cartId, item } = req.body
  const id = cartId || (uuidv4())
  
  try {
    let cart = await Cart.findOne({ cartId: id })
    if (!cart) {
      cart = new Cart({ cartId: id, items: [] })
    }

    const existingIndex = cart.items.findIndex(it => 
      it.id === item.id && 
      it.activeColor === item.activeColor && 
      it.selectedSize === item.selectedSize
    )

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = (cart.items[existingIndex].quantity || 1) + (item.quantity || 1)
    } else {
      cart.items.push({ ...item, cartId: item.cartId || id, quantity: item.quantity || 1 })
    }

    cart.markModified('items')
    cart.updatedAt = Date.now()
    await cart.save()
    
    res.json({ cartId: id, items: cart.items })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get cart
app.get('/cart/:cartId', async (req, res) => {
  const { cartId } = req.params
  try {
    const cart = await Cart.findOne({ cartId })
    res.json({ cartId, items: cart ? cart.items : [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update cart item (quantity or meta)
app.post('/cart/update', async (req, res) => {
  const { cartId, cartItemId, delta, updatedSize, updatedColor } = req.body
  try {
    const cart = await Cart.findOne({ cartId })
    if (!cart) return res.status(404).json({ error: 'Cart not found' })

    const idx = cart.items.findIndex((it) => (it.cartId === cartItemId) || (it.id === cartItemId))
    if (idx > -1) {
      const it = cart.items[idx]
      const newSize = updatedSize ?? it.selectedSize
      const newColor = updatedColor ?? it.activeColor
      const newQty = (it.quantity || 1) + (delta || 0)
      
      if (newQty <= 0) {
        cart.items.splice(idx, 1)
      } else {
        cart.items[idx] = { ...it, quantity: newQty, selectedSize: newSize, activeColor: newColor }
      }
      
      cart.markModified('items')
      cart.updatedAt = Date.now()
      await cart.save()
    }
    res.json({ cartId, items: cart.items })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete item
app.delete('/cart/:cartId/:cartItemId', async (req, res) => {
  const { cartId, cartItemId } = req.params
  try {
    const cart = await Cart.findOne({ cartId })
    if (cart) {
      cart.items = cart.items.filter(i => i.cartId !== cartItemId && i.id !== cartItemId)
      cart.markModified('items')
      cart.updatedAt = Date.now()
      await cart.save()
    }
    res.json({ cartId, items: cart ? cart.items : [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Checkout (DB Persistence)
app.post('/checkout', async (req, res) => {
  const { customer, items, total, currency, paymentMethod } = req.body
  try {
    const orderId = 'ORD-' + uuidv4().slice(0, 8).toUpperCase()
    const order = new Order({ 
      orderId, 
      customer, 
      items, 
      total, 
      currency: currency || 'PKR',
      paymentMethod, 
      createdAt: new Date() 
    })
    await order.save()
    res.json({ orderId, status: 'created' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(port, () => {
  console.log(`Cart API running on http://localhost:${port}`)
})
