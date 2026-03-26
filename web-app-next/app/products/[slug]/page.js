// Server component for product detail (SSR) in Next.js App Router
import React from 'react'
import ProductDetailClient from './ProductDetailClient'

// This page SSR fetches all products and selects the one with the matching slug
export default async function ProductDetailPage({ params }) {
  const { slug } = params
  const host = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  let product = null
  try {
    const res = await fetch(`${host}/api/public/products`)
    if (res.ok) {
      const products = await res.json()
      product = (products || []).find(p => (p.slug || p.id) === slug)
    }
  } catch (e) {
    // ignore and render not found fallback
  }

  if (!product) {
    return (
      <main className="container" style={{padding:20}}>
        <h1>Product not found</h1>
      </main>
    )
  }

  // Simple price display helper
  const price = product.price ?? 0
  const priceStr = `PKR ${price.toLocaleString()}`

  // Lightweight layout; interactive parts handled by client component
  return (
    <main className="container" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, padding:20}}>
      <div>
        {product.image && (
          <img src={product.image} alt={product.name} style={{width:'100%', height:'auto', borderRadius:8}} />
        )}
        {product.gallery && product.gallery.length > 0 && (
          <div style={{display:'flex', gap:8, marginTop:8}}>
            {product.gallery.map((src, idx) => (
              src && <img key={idx} src={src} alt={`${product.name} ${idx+1}`} style={{width:72, height:72, objectFit:'cover', borderRadius:6}} />
            ))}
          </div>
        )}
      </div>
      <section>
        <h1 style={{fontSize:28, fontWeight:900, marginBottom:8}}>{product.name}</h1>
        <p style={{color:'#ba1f3d', fontWeight:900, fontSize:18}}>PKR {price.toLocaleString()}</p>
        {product.subCategory && <p style={{color:'#666', fontSize:12}}>Category: {product.bucket} / {product.subCategory}</p>}
        {product.sizes && product.sizes.length > 0 && (
          <p style={{fontSize:12, color:'#555'}}>Available sizes: {product.sizes.join(', ')}</p>
        )}
        {product.colors && product.colors.length > 0 && (
          <div style={{marginTop:6}}>
            <span style={{fontWeight:900, fontSize:12}}>Colors:</span>
            <div style={{display:'flex', gap:6, marginTop:6}}>
              {product.colors.map((c, i) => (
                <span key={i} style={{width:20, height:20, borderRadius:4, background: c}} />
              ))}
            </div>
          </div>
        )}
        <p style={{marginTop:12, lineHeight:1.6}}>{product.description || 'Product description coming soon.'}</p>

        <ProductDetailClient product={product} />
      </section>
    </main>
  )
}
