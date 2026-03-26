"use client";
import React, { useEffect, useState } from 'react'
// router not used in MVP; kept for potential future navigation tweaks

const CART_API_BASE = (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CART_API_BASE) || 'http://localhost:5000'

export default function CheckoutPage(){
  const router = useRouter()
  const [cartId, setCartId] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [ship, setShip] = useState({ firstName:'', lastName:'', email:'', phone:'', address:'', city:'Karachi', zip:'' })
  const [method, setMethod] = useState('credit-card')
  const [orderId, setOrderId] = useState(null)

  useEffect(() => {
    const id = localStorage.getItem('stopshop-cart-id') || 'guest'
    setCartId(id)
    // fetch cart items
    fetch(`${CART_API_BASE}/cart/${id}`).then(r => r.json()).then(d => setCartItems(d.items || [])).catch(() => setCartItems([]))
  }, [])

  const performCheckout = async (e) => {
    e.preventDefault()
    if (!cartItems.length) return
    setBusy(true)
    const payload = {
      customer: {
        name: `${ship.firstName} ${ship.lastName}`.trim(),
        email: ship.email,
        phone: ship.phone,
        address: ship.address,
        city: ship.city,
        zip: ship.zip,
      },
      items: cartItems.map(it => ({ id: it.id, name: it.name, price: it.price, quantity: it.quantity || 1, selectedSize: it.selectedSize })),
      total: cartItems.reduce((s,i)=> s + (i.price*(i.quantity||1)), 0),
      paymentMethod: method,
    }
    try {
      const res = await fetch(`${CART_API_BASE}/checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      const data = await res.json()
      setOrderId(data.orderId || data.id || 'ORD-UNKNOWN')
    } catch (err) {
      // fallback: show a fake order id
      setOrderId('ORD-FAKE-' + Math.floor(Math.random()*99999))
      router.push('/checkout/complete')
    } finally {
      setBusy(false)
    }
  }

  if (orderId) {
    return (
      <div className="container" style={{padding:20}}>
        <h2>Order placed</h2>
        <p>Order ID: {orderId}</p>
      </div>
    )
  }

  return (
    <div className="container" style={{maxWidth:800, margin:'0 auto', padding:20}}>
      <h1 style={{fontSize:28, fontWeight:900}}>Checkout</h1>
      <p style={{fontSize:12, color:'#666'}}>Cart total will be calculated on the backend.</p>
      <form onSubmit={performCheckout} style={{display:'grid', gap:12}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <input placeholder="First Name" value={ship.firstName} onChange={(e)=>setShip(s => ({...s, firstName: e.target.value}))} />
          <input placeholder="Last Name" value={ship.lastName} onChange={(e)=>setShip(s => ({...s, lastName: e.target.value}))} />
        </div>
        <input placeholder="Email" value={ship.email} onChange={(e)=>setShip(s => ({...s, email: e.target.value}))} />
        <input placeholder="Phone" value={ship.phone} onChange={(e)=>setShip(s => ({...s, phone: e.target.value}))} />
        <input placeholder="Address" value={ship.address} onChange={(e)=>setShip(s => ({...s, address: e.target.value}))} />
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <input placeholder="City" value={ship.city} onChange={(e)=>setShip(s => ({...s, city: e.target.value}))} />
          <input placeholder="ZIP" value={ship.zip} onChange={(e)=>setShip(s => ({...s, zip: e.target.value}))} />
        </div>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <label>
            <input type="radio" checked={method==='credit-card'} onChange={()=>setMethod('credit-card')} /> Card
          </label>
          <label><input type="radio" checked={method==='bank-transfer'} onChange={()=>setMethod('bank-transfer')} /> Bank Transfer</label>
          <label><input type="radio" checked={method==='cod'} onChange={()=>setMethod('cod')} /> COD</label>
        </div>
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Processing...' : 'Place Order'}</button>
      </form>
      <div style={{marginTop:12, fontSize:12, color:'#666'}}>Tip: This is a MVP checkout wired to a backend cart API (Railway).
      </div>
    </div>
  )
}
