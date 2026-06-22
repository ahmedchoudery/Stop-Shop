/**
 * @fileoverview ProductTable.jsx
 * Renders the products list table with Edit and Delete action buttons.
 * Delete triggers a confirmation modal in AdminProducts.
 * Edit opens the product form pre-filled.
 */

import React, { memo } from 'react';
import { Edit3, Trash2, AlertTriangle } from 'lucide-react';
import MediaRenderer from './MediaRenderer.jsx';

const getBackgroundStyle = (color) => {
  if (!color) return {};
  if (color.includes('|')) {
    const parts = color.split('|');
    const part0 = parts[0].trim();
    const part1 = parts[1].trim();
    const isHex = (str) => /^#([0-9A-F]{3}){1,2}$/i.test(str);
    if (isHex(part0) && !isHex(part1)) {
      return { backgroundColor: part0 };
    } else {
      return { background: `linear-gradient(135deg, ${part0} 50%, ${part1} 50%)` };
    }
  }
  return { backgroundColor: color };
};

const getColorName = (color) => {
  if (!color) return '';
  if (color.includes('|')) {
    const parts = color.split('|');
    const part0 = parts[0].trim();
    const part1 = parts[1].trim();
    const isHex = (str) => /^#([0-9A-F]{3}){1,2}$/i.test(str);
    if (isHex(part0) && !isHex(part1)) {
      return part1;
    } else {
      return parts.join(' / ');
    }
  }
  return color;
};

const StockBadge = ({ qty }) => {
  if (qty === 0) {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-[4px] text-[8px] font-black uppercase tracking-widest bg-black text-white">
        <span>Sold Out</span>
      </span>
    );
  }
  if (qty < 5) {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-[4px] text-[8px] font-black uppercase tracking-widest bg-orange-50 border border-orange-150 text-orange-700">
        <AlertTriangle size={8} />
        <span>Low · {qty}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex px-2.5 py-1 rounded-[4px] text-[8px] font-black uppercase tracking-widest bg-green-50 border border-green-150 text-green-700">
      In Stock · {qty}
    </span>
  );
};

const ProductTable = memo(({ products = [], onEdit, onDelete }) => {
  if (!products.length) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Product', 'SKU / ID', 'Category', 'Price', 'Stock', 'Rating', 'Actions'].map(col => (
              <th
                key={col}
                className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-50">
          {products.map(product => {
            const hasMatrix = product.variantMatrix && (
              product.variantMatrix instanceof Map 
                ? product.variantMatrix.size > 0 
                : Object.keys(product.variantMatrix).length > 0
            );
            const hasColors = product.colors && product.colors.length > 0;
            const hasSizes = product.sizes && product.sizes.length > 0;

            return (
              <tr
                key={product.id ?? product._id}
                className="group hover:bg-gray-50/60 transition-colors duration-150"
              >
                {/* Product image + name + description snippet */}
                <td className="px-5 py-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 rounded-[4px] overflow-hidden bg-gray-50 border border-gray-150 flex-shrink-0 mt-0.5">
                      {product.image ? (
                        <MediaRenderer
                          src={product.mediaType === 'embed' ? null : product.image}
                          embedCode={product.mediaType === 'embed' ? product.embedCode : undefined}
                          mediaType={product.mediaType}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-300 text-[8px] font-black uppercase">No img</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-tight text-gray-900 group-hover:text-black transition-colors">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-0.5 font-mono">
                        {product.bucket || 'General'}
                      </p>
                      <p className="text-[9px] text-gray-400 font-medium line-clamp-2 max-w-[220px] mt-1 normal-case leading-normal">
                        {product.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>
                </td>

                {/* SKU */}
                <td className="px-5 py-4 align-top">
                  <span className="font-mono text-[9px] font-bold text-gray-400">
                    #{product.id ?? product._id?.toString()?.slice(-8).toUpperCase()}
                  </span>
                </td>

                {/* Category Breadcrumbs */}
                <td className="px-5 py-4 align-top">
                  <div>
                    <div className="flex items-center space-x-1.5 text-[9px] font-black text-gray-900 uppercase tracking-widest">
                      <span>{product.bucket || 'Tops'}</span>
                      <span className="text-gray-300 font-normal">/</span>
                      <span className="text-gray-500">{product.subCategory || 'Shirts'}</span>
                    </div>
                    {product.sectionName && (
                      <div className="mt-2">
                        <span className="inline-block text-[7px] font-black tracking-widest bg-gray-100 border border-gray-150 text-gray-500 px-1.5 py-0.5 rounded-[2px] uppercase">
                          {product.sectionName}
                        </span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Price (Standard or Discounted) */}
                <td className="px-5 py-4 align-top">
                  <div className="flex flex-col">
                    {product.discount > 0 ? (
                      <>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-gray-900 font-mono">
                            Rs. {Number(product.price * (1 - product.discount / 100)).toLocaleString('en-PK')}
                          </span>
                          <span className="text-[7px] font-black bg-[#FDEBEC] border border-[#F9CFCF] text-[#9F2F2D] px-1 py-0.5 rounded-[2px] tracking-wider uppercase">
                            -{product.discount}%
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 line-through font-mono mt-0.5">
                          Rs. {Number(product.price ?? 0).toLocaleString('en-PK')}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-black text-gray-900 font-mono">
                        Rs. {Number(product.price ?? 0).toLocaleString('en-PK')}
                      </span>
                    )}
                  </div>
                </td>

                {/* Stock Breakdown (S, M, L, XL of each color) */}
                <td className="px-5 py-4 align-top">
                  <div className="space-y-2">
                    <StockBadge qty={product.quantity ?? 0} />
                    
                    {/* Matrix View: Both colors AND sizes exist */}
                    {hasMatrix && hasColors && hasSizes && (
                      <div className="space-y-1.5">
                        {product.colors.map(color => (
                          <div key={color} className="flex items-center space-x-2 text-[8px] uppercase tracking-widest">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-gray-250 shadow-sm flex-shrink-0"
                              style={getBackgroundStyle(color)}
                            />
                            <span className="font-black text-gray-800 min-w-[55px] truncate" title={getColorName(color)}>
                              {getColorName(color)}:
                            </span>
                            <span className="text-gray-400 font-bold font-mono">
                              {product.sizes.map(size => {
                                const key = `${color}|${size}`;
                                const qty = product.variantMatrix instanceof Map
                                  ? (product.variantMatrix.get(key) ?? 0)
                                  : (product.variantMatrix?.[key] ?? 0);
                                return (
                                  <span key={size} className={qty === 0 ? 'text-red-400 font-black' : 'text-gray-600'}>
                                    {size}:{qty}&nbsp;&nbsp;
                                  </span>
                                );
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Size Only View */}
                    {!hasMatrix && hasSizes && (
                      <div className="flex flex-wrap gap-1">
                        {product.sizes.map(size => {
                          const sizeQty = product.sizeStock instanceof Map
                            ? (product.sizeStock.get(size) ?? 0)
                            : (product.sizeStock?.[size] ?? 0);
                          return (
                            <span
                              key={size}
                              className={`text-[7px] font-black px-1.5 py-0.5 rounded-[2px] uppercase tracking-wider ${
                                sizeQty === 0 ? 'bg-red-50 border border-red-100 text-red-600' : 'bg-gray-100 border border-gray-200 text-gray-700'
                              }`}
                            >
                              {size}: {sizeQty}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Color Only View */}
                    {!hasMatrix && hasColors && (
                      <div className="space-y-1">
                        {product.colors.map(color => {
                          const colorQty = product.colorStock instanceof Map
                            ? (product.colorStock.get(color) ?? 0)
                            : (product.colorStock?.[color] ?? 0);
                          return (
                            <span
                              key={color}
                              className={`inline-flex items-center text-[7px] font-black px-1.5 py-0.5 rounded-[2px] uppercase tracking-wider border mr-1 mb-1 ${
                                colorQty === 0 
                                  ? 'bg-red-50 border-red-150 text-red-650' 
                                  : 'bg-gray-50 border-gray-150 text-gray-700'
                              }`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full mr-1 border border-white flex-shrink-0"
                                style={getBackgroundStyle(color)}
                              />
                              {getColorName(color)}: {colorQty}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </td>

                {/* Rating */}
                <td className="px-5 py-4 align-top">
                  <div className="flex items-center space-x-1 mt-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-[10px] ${i < (product.rating ?? 5) ? 'text-amber-gold' : 'text-gray-200'}`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-[9px] font-bold text-gray-400 ml-1">
                      {product.rating ?? 5}.0
                    </span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-5 py-4 align-top">
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => onEdit(product)}
                      title="Edit product — updates MongoDB"
                      className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 text-[9px] font-black uppercase tracking-widest rounded-[4px] hover:bg-black hover:text-white hover:border-black transition-all duration-200"
                    >
                      <Edit3 size={11} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => onDelete(product)}
                      title="Delete product — removes from MongoDB"
                      className="flex items-center space-x-1.5 px-3 py-2 bg-red-50 border border-red-100 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-[4px] hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200"
                    >
                      <Trash2 size={11} />
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

ProductTable.displayName = 'ProductTable';
export default ProductTable;