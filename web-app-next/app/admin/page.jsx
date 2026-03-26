"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from './components/AdminLayout'
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

const loadProducts = () => {
  const raw = localStorage.getItem('stopshop-admin-products');
  if (raw) return JSON.parse(raw);
  const seed = [
    { id: 'p1', name: 'Classic Red Polo', price: 3499, stock: 12, image: '', slug: 'classic-red-polo' },
    { id: 'p2', name: 'Polo Tee Navy', price: 2499, stock: 25, image: '', slug: 'polo-tee-navy' },
  ];
  localStorage.setItem('stopshop-admin-products', JSON.stringify(seed));
  return seed;
};

const AdminPanel = () => {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    const prods = loadProducts();
    setProducts(prods);
  }, []);
  // Phase 1.2: fetch admin products when authenticated
  useEffect(() => {
    const fetchAdminProducts = async () => {
      try {
        const token = localStorage.getItem('admin-token')
        if (!token) return
        const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE || 'http://localhost:5001'
        const res = await fetch(`${ADMIN_API_BASE}/api/products`, { headers: { 'Authorization': `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) setProducts(data)
        }
      } catch (e) {
        // ignore
      }
    };
    if (auth) fetchAdminProducts();
  }, [auth]);

  const addProduct = async () => {
    if (!name) return;
    const p = {
      name,
      price: Number(price) || 0,
      stock: Number(stock) || 0,
      image: image,
      slug: (name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')),
    }
    // Attempt to save to backend
    try {
      const res = await fetch(`${ADMIN_API_BASE}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(p),
      });
      if (res.ok) {
        // refresh list from backend
        const r = await fetch(`${ADMIN_API_BASE}/api/products`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data)) setProducts(data);
        } else {
          // fallback to local if backend read fails
          const next = [...products, p];
          setProducts(next);
          localStorage.setItem('stopshop-admin-products', JSON.stringify(next));
        }
      } else {
        throw new Error('Add failed');
      }
    } catch {
      // fallback to local if backend unavailable
      const next = [...products, p];
      setProducts(next);
      localStorage.setItem('stopshop-admin-products', JSON.stringify(next));
    }
    setName(''); setPrice(''); setStock(''); setImage('');
  };

  const removeProduct = async (idx) => {
    const next = products.slice();
    next.splice(idx, 1);
    // attempt backend delete
    const toDelete = products[idx];
    if (toDelete && toDelete.id) {
      try {
        const res = await fetch(`${ADMIN_API_BASE}/api/products/${toDelete.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const r = await fetch(`${ADMIN_API_BASE}/api/products`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (r.ok) {
            const data = await r.json();
            if (Array.isArray(data)) setProducts(data);
          } else {
            setProducts(next);
            localStorage.setItem('stopshop-admin-products', JSON.stringify(next));
          }
        } else {
          setProducts(next);
          localStorage.setItem('stopshop-admin-products', JSON.stringify(next));
        }
      } catch {
        setProducts(next);
        localStorage.setItem('stopshop-admin-products', JSON.stringify(next));
      }
    } else {
      setProducts(next);
      localStorage.setItem('stopshop-admin-products', JSON.stringify(next));
    }
  };

  // Simple auth gating against backend
  const [auth, setAuth] = useState(false);
  const [sizeStockDraft, setSizeStockDraft] = useState({});
  const [token, setToken] = useState(null);
  useEffect(() => {
    const t = localStorage.getItem('admin-token');
    if (t) { setToken(t); setAuth(true); }
  }, []);
  const [passwordInput, setPasswordInput] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editImage, setEditImage] = useState('');
  const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE || 'http://localhost:5001'
  // Phase 1.2: additional admin capabilities
  const [orders, setOrders] = useState([]);
  const [bulkImportStatus, setBulkImportStatus] = useState('');
  const [bulkSelected, setBulkSelected] = useState(new Set());
  // editingIndex already declared above
  
  const login = async (e) => {
    e.preventDefault();
    if (name === ADMIN_USERNAME && passwordInput === ADMIN_PASSWORD) {
      // request token from backend
      try {
        const res = await fetch(`${ADMIN_API_BASE}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: name, password: passwordInput }) })
        if (res.ok) {
          const data = await res.json()
          const t = data.token || 'SECRET'
          localStorage.setItem('admin-token', t)
          setToken(t)
          setAuth(true)
        } else {
          alert('Invalid credentials');
        }
      } catch {
        alert('Backend login failed in MVP');
      }
    } else {
      alert('Invalid credentials');
    }
  };

  // Orders panel helpers
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${ADMIN_API_BASE}/api/orders`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setOrders(data)
      }
    } catch {}
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${ADMIN_API_BASE}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        fetchOrders()
      }
    } catch {}
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (!lines.length) return []
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim())
      const obj = {}
      headers.forEach((h,i) => { obj[h] = vals[i] })
      if (obj.price) obj.price = Number(obj.price) || 0
      if (obj.stock) obj.stock = Number(obj.stock) || 0
      if (obj.sizes) {
        try { obj.sizes = JSON.parse(obj.sizes) } catch { obj.sizes = obj.sizes ? obj.sizes.split(';').map(s => s.trim()) : [] }
      }
      if (obj.colors) {
        try { obj.colors = JSON.parse(obj.colors) } catch { obj.colors = obj.colors ? obj.colors.split(';').map(s => s.trim()) : [] }
      }
      return obj
    })
    return rows
  };

  const handleBulkImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const text = String(reader.result)
      const items = parseCSV(text)
      if (!items.length) { setBulkImportStatus('No valid items') ; return }
      try {
        const res = await fetch(`${ADMIN_API_BASE}/api/products/bulk`, {
          method:'POST',
          headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(items)
        })
        if (res.ok) {
          const r = await fetch(`${ADMIN_API_BASE}/api/products`, { headers: { 'Authorization': `Bearer ${token}` } })
          if (r.ok) {
            const data = await r.json(); if (Array.isArray(data)) setProducts(data)
            setBulkImportStatus(`Imported ${items.length} products`)
          } else {
            setBulkImportStatus('Bulk import succeeded but failed to refresh list')
          }
        } else {
          setBulkImportStatus('Bulk import failed')
        }
      } catch {
        setBulkImportStatus('Bulk import error')
      }
    }
    reader.readAsText(file)
  };


  const handleBulkDeleteSelected = async () => {
    if (!bulkSelected || bulkSelected.size === 0) return
    const ids = Array.from(bulkSelected)
    try {
      const res = await fetch(`${ADMIN_API_BASE}/api/products/bulk-delete`, {
        method:'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ ids })
      })
      if (res.ok) {
        const r = await fetch(`${ADMIN_API_BASE}/api/products`, { headers: { 'Authorization': `Bearer ${token}` } })
        if (r.ok) {
          const data = await r.json(); if (Array.isArray(data)) setProducts(data)
        }
        setBulkSelected(new Set())
      }
    } catch { /* ignore */ }
  };

  if (!auth) {
    return (
      <div className="container" style={{maxWidth:600, marginTop:40}}>
        <h2>Admin Login</h2>
        <form onSubmit={login} style={{display:'grid', gap:12}}>
          <input placeholder="Username" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Password" type="password" onChange={e=>setPasswordInput(e.target.value)} />
          <button className="btn" type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="container" style={{paddingTop:20}}>
        {/* Phase 1.3: Admin Overview Dashboard */}
        <section style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12, marginBottom:16}} aria-label="Admin overview">
          <div className="card" style={{padding:12}}>
            <div style={{fontSize:12, textTransform:'uppercase', fontWeight:700, color:'#777'}}>Total Products</div>
            <div style={{fontSize:20, fontWeight:900}}>{products.length}</div>
          </div>
          <div className="card" style={{padding:12}}>
            <div style={{fontSize:12, textTransform:'uppercase', fontWeight:700, color:'#777'}}>Total Orders</div>
            <div style={{fontSize:20, fontWeight:900}}>{orders.length}</div>
          </div>
        </section>
        <h1>Admin Panel</h1>
        <Link href="/admin" className="btn" style={{marginRight:8}}>Refresh</Link>
        <button className="btn" onClick={()=>{ localStorage.removeItem('stopshop-admin-auth'); setAuth(false); }}>Logout</button>

        <section style={{marginTop:20}}>
        <h2>Products</h2>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
          {products.map((p, idx)=> {
            const isEditing = editingIndex === idx
            const handleCheckbox = (e) => {
              const s = new Set(bulkSelected)
              if (e.target.checked) s.add(p.id) else s.delete(p.id)
              setBulkSelected(s)
            }
            const startEdit = () => {
              setEditingIndex(idx)
              setEditName(p.name)
              setEditPrice(String(p.price))
              setEditStock(String(p.stock))
              setEditImage(p.image || '')
            }
            return (
              <div key={p.id} className="card" style={{padding:12}}>
                <input type="checkbox" onChange={handleCheckbox} style={{ marginBottom: 6 }} />
                {isEditing ? (
                  <div style={{display:'grid', gap:6}}>
                    <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Name" />
                    <input value={editPrice} onChange={e=>setEditPrice(e.target.value)} placeholder="Price" />
                    <input value={editStock} onChange={e=>setEditStock(e.target.value)} placeholder="Stock" />
                    <input value={editImage} onChange={e=>setEditImage(e.target.value)} placeholder="Image URL" />
                    <div style={{display:'flex', gap:6}}>
                      <button className="btn" onClick={async ()=>{
                        try {
                          const updated = { name: editName, price: Number(editPrice) || p.price, stock: Number(editStock) || p.stock, image: editImage, slug: p.slug }
                          const res = await fetch(`${ADMIN_API_BASE}/api/products/${p.id}`, {
                            method:'PUT', headers:{'Content-Type':'application/json','Authorization': `Bearer ${token}`}, body: JSON.stringify(updated)
                          })
                          if (res.ok) {
                            const r = await fetch(`${ADMIN_API_BASE}/api/products`, { headers: { 'Authorization': `Bearer ${token}` } })
                            if (r.ok) {
                              const data = await r.json()
                              setProducts(Array.isArray(data) ? data : products)
                            }
                          }
                          setEditingIndex(null)
                        } catch {
                          alert('Update failed')
                        }
                      }}>Save</button>
                      <button className="btn" onClick={()=>setEditingIndex(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{fontWeight:700}}>{p.name}</div>
                    <div>PKR {p.price?.toLocaleString?.() ?? 0}</div>
                    <div>Stock: {p.stock}</div>
                    <button className="btn" onClick={startEdit}>Edit</button>
                    <button className="btn" onClick={()=>removeProduct(idx)}>Delete</button>
                    <div style={{marginTop:6}} className="size-stock-editor">
                      <div style={{fontSize:12, fontWeight:700, marginBottom:4}}>Size Stock Editor</div>
                      <div style={{display:'flex', gap:6, alignItems:'center'}}>
                        <input placeholder="Size" value={sizeStockDraft[p.id]?.size ?? ''} onChange={e => setSizeStockDraft({ ...sizeStockDraft, [p.id]: { ...(sizeStockDraft[p.id] || {}), size: e.target.value } })} />
                        <input placeholder="Stock" type="number" value={sizeStockDraft[p.id]?.stock ?? ''} onChange={e => setSizeStockDraft({ ...sizeStockDraft, [p.id]: { ...(sizeStockDraft[p.id] || {}), stock: e.target.value } })} />
                        <button className="btn" onClick={async ()=>{ const payload = sizeStockDraft[p.id] || {}; if (!payload?.size) return; try { const res = await fetch(`${ADMIN_API_BASE}/api/products/${p.id}/sizeStock`, { method:'PUT', headers:{'Content-Type':'application/json','Authorization': `Bearer ${token}`}, body: JSON.stringify({ size: payload.size, stock: Number(payload.stock) || 0 }) }); if (res.ok) { const r = await fetch(`${ADMIN_API_BASE}/api/products`, { headers: { 'Authorization': `Bearer ${token}` } }); if (r.ok) { const data = await r.json(); if (Array.isArray(data)) setProducts(data); } setSizeStockDraft(prev => ({ ...prev, [p.id]: {} })) } } catch { alert('Failed to update size stock') } }}>Save</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </section>
      {/* Orders, Bulk Import, Bulk Delete Panels (Phase 1.2) */}
      <section style={{marginTop:20}}>
        <h2>View Orders</h2>
        <button className="btn" onClick={fetchOrders}>Refresh</button>
        <div style={{marginTop:8}}>
          {orders.map((o) => (
            <div key={o.id} className="card" style={{marginBottom:8, padding:8}}>
              <div><strong>Order:</strong> {o.id}</div>
              <div><strong>Customer:</strong> {o.customer?.name || ''}</div>
              <div><strong>Total:</strong> PKR {Number(o.total || 0).toLocaleString()}</div>
              <div>
                <select defaultValue={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section style={{marginTop:20}}>
        <h2>Bulk Import</h2>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <input type="file" accept=".csv" onChange={handleBulkImportFile} />
          <span style={{fontSize:12, color:'#666'}}>{bulkImportStatus}</span>
        </div>
      </section>
      <section style={{marginTop:20}}>
        <h2>Bulk Actions</h2>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <button className="btn" onClick={handleBulkDeleteSelected}>Delete Selected</button>
        </div>
        <div style={{marginTop:6, fontSize:12, color:'#666'}}>Tip: Use the checkboxes next to products to select for bulk delete.</div>
      </section>

      <section style={{marginTop:20}}>
        <h2>Add Product</h2>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Price" value={price} onChange={e=>setPrice(e.target.value)} />
          <input placeholder="Stock" value={stock} onChange={e=>setStock(e.target.value)} />
          <input placeholder="Image URL" value={image} onChange={e=>setImage(e.target.value)} />
        </div>
        <button className="btn" onClick={addProduct} style={{marginTop:8}}>Add Product</button>
      </section>
    </div>
  );
};

export default AdminPanel
