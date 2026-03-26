import React from 'react'
import Link from 'next/link'
import ProductCard from './components/ProductCard'

export const metadata = {
  title: 'Stop Shop - Cardinal Couture',
  description: 'Premium fashion with international shipping. Fast, secure, and beautiful.',
  openGraph: {
    title: 'Stop Shop - Cardinal Couture',
    description: 'Premium fashion with international shipping.',
  },
};

// ProductCard component is now a client component located at web-app-next/app/components/ProductCard.jsx

export default async function Home({}) {
  // SSR-friendly data fetch from existing API
  const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/public/products')
  const products = await res.ok ? await res.json() : []

  // Pick a few products for grid
  const show = (products && products.length) ? products.slice(0, 8) : []

  return (
    <main className="container">
      <section className="hero" aria-label="Brand hero">
        <div style={{maxWidth:900, margin:'0 auto'}}>
          <h1 style={{fontSize:42, fontWeight:900, letterSpacing:'0.02em', marginBottom:12}}> Cardinal Couture</h1>
          <p style={{fontSize:18, color:'#fff', opacity:.95}}>Premium fashion with global shipping. Built for speed, trust, and delight.</p>
          <div style={{marginTop:20}}>
            <a href="#shop" className="btn" style={{background:'#ba1d3c'}}>Shop Trending</a>
          </div>
        </div>
      </section>

      <section id="shop" style={{padding:40}}>
        <h2 style={{fontSize:20, fontWeight:900, marginBottom:12}}>Shop the Cardial Collection</h2>
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))'}}>
          {show.map(p => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>
    </main>
  )
}
