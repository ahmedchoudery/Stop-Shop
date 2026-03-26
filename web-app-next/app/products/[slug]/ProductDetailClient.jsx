"use client";
import React, { useMemo, useState } from 'react';

// Utility: derive preset sizes based on product bucket/subCategory (mirror of existing app logic)
const getPresetSizes = (product) => {
  const bucket = (product?.bucket || '').toLowerCase();
  const subCategory = (product?.subCategory || '').toLowerCase();
  if (bucket === 'accessories') return [];
  if (bucket === 'footwear') return ['7', '8', '9', '10', '11'];
  if (bucket === 'bottoms') {
    if (subCategory === 'jeans') return ['28', '30', '32', '34', '36', '38'];
    if (subCategory === 'trousers' || subCategory === 'shorts') return ['S', 'M', 'L'];
    return ['S', 'M', 'L'];
  }
  if (bucket === 'tops') return ['S', 'M', 'L', 'XL'];
  return ['S', 'M', 'L', 'XL'];
};

const ProductDetailClient = ({ product }) => {
  const sizesFromProduct = (product?.sizes && product.sizes.length > 0) ? product.sizes : getPresetSizes(product);
  const [selectedSize, setSelectedSize] = useState(sizesFromProduct[0] || null);

  const productImage = product?.image || '';
  const addToCart = () => {
    if (!selectedSize) { alert('Please select a size.'); return; }
    const cartItem = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: productImage,
      selectedSize,
      quantity: 1
    };
    const cart = JSON.parse(localStorage.getItem('stopshop-cart') || '[]');
    const idx = cart.findIndex(i => i.id === cartItem.id && i.selectedSize === cartItem.selectedSize);
    if (idx > -1) cart[idx].quantity = (cart[idx].quantity || 1) + 1; else cart.push(cartItem);
    localStorage.setItem('stopshop-cart', JSON.stringify(cart));
    alert('Added to cart (demo)');
  };

  return (
    <div className="product-detail" style={{display:'flex', flexDirection:'column', gap:12}}>
      {productImage && <img src={productImage} alt={product.name} style={{width:'100%', height:'auto', borderRadius:8}} />}
      <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
        {sizesFromProduct.map((s) => (
          <button key={s} onClick={() => setSelectedSize(s)} className={`size-btn ${selectedSize === s ? 'active' : ''}`} style={{padding:'6px 10px', border:'1px solid #ccc', borderRadius:4}}>
            {s}
          </button>
        ))}
      </div>
      <button onClick={addToCart} className="btn" style={{width:'fit-content', alignSelf:'flex-start'}}>Add to Cart</button>
      <p style={{fontSize:12, color:'#666'}}>Selected Size: {selectedSize || 'None'}</p>
      <section>
        <h2 style={{fontSize:18, marginTop:6}}>About this product</h2>
        <p style={{fontSize:14, lineHeight:1.6}}>{product?.description ?? 'No description available.'}</p>
      </section>
    </div>
  );
};

export default ProductDetailClient
