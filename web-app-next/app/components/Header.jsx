"use client";
import React from 'react'
import Link from 'next/link'
import { useCurrency } from '../context/CurrencyContext'

const Header = () => {
  const { currency, setCurrency } = useCurrency()

  const formatPrice = (pricePKR) => {
    // rough conversion rates (demo only)
    const rates = { PKR: 1, USD: 0.0036, EUR: 0.0032, GBP: 0.0031 }
    if (currency === 'PKR') return `PKR ${pricePKR.toLocaleString()}`
    const converted = pricePKR * (rates[currency] || 1)
    const symbol = currency
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: symbol }).format(converted)
  }

  const currencyOptions = ['PKR', 'USD', 'EUR', 'GBP']

  return (
    <header style={{position:'sticky', top:0, zIndex:50, borderBottom:'1px solid #eee', background:'#fff'}}>
      <div className="container" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px'}}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <Link href="/" style={{fontWeight:900, color:'var(--cardinal)', fontSize:20, textDecoration:'none'}}>Cardinal Couture</Link>
        </div>
        <nav style={{display:'flex', alignItems:'center', gap:20}} aria-label="Main navigation">
          <Link href="/">Home</Link>
          <Link href="/">Shop</Link>
          <Link href="/admin">Admin</Link>
          <select
            aria-label="Currency switcher"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{border:'1px solid #eee', padding:'6px 8px', borderRadius:6, background:'#fff', fontWeight:900}}
          >
            {currencyOptions.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
        </nav>
      </div>
    </header>
  )
}

export default Header
