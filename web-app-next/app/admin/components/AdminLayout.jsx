"use client";
import React from 'react'
import Link from 'next/link'

export default function AdminLayout({ children }) {
  const AdminHeader = () => (
    <header aria-label="Admin header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid #eee', background:'#fff'}}>
      <div style={{display:'flex', alignItems:'center', gap:12}}>
        <span style={{fontWeight:900, color:'var(--cardinal)', fontSize:16}}>Stop Shop Admin</span>
        <span style={{color:'#666', fontSize:12, textTransform:'uppercase', letterSpacing:'0.2em'}}>Phase 1.3</span>
      </div>
      <nav style={{display:'flex', gap:8}} aria-label="Admin quick links">
        <a href="#">Dashboard</a>
        <a href="#">Products</a>
        <a href="#">Orders</a>
        <a href="#">Bulk Import</a>
      </nav>
    </header>
  )
  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="admin-sidebar" aria-label="Admin navigation" style={{ width: 260, borderRight: '1px solid #eee', padding: 16, background: '#fff' }}>
        <nav className="admin-nav" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href="/admin" className="active" style={{ padding: 8, borderRadius: 6 }}>Dashboard</Link>
          <Link href="/admin?tab=products" style={{ padding: 8, borderRadius: 6 }}>Products</Link>
          <Link href="/admin?tab=orders" style={{ padding: 8, borderRadius: 6 }}>Orders</Link>
          <Link href="/admin?tab=import" style={{ padding: 8, borderRadius: 6 }}>Bulk Import</Link>
          <Link href="/admin/audits" style={{ padding: 8, borderRadius: 6 }}>Audits</Link>
        </nav>
      </aside>
      <main className="admin-main" style={{ flex: 1, padding: 20 }}>
        <AdminHeader />
        {children}
      </main>
    </div>
  );
}
