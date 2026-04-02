/**
 * @fileoverview ProductTable.jsx
 * Renders the products list table with Edit and Delete action buttons.
 * Delete triggers a confirmation modal in AdminProducts.
 * Edit opens the product form pre-filled.
 */

import React, { memo } from 'react';
import { Edit3, Trash2, AlertTriangle } from 'lucide-react';
import MediaRenderer from './MediaRenderer.jsx';

const StockBadge = ({ qty }) => {
  if (qty === 0) {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-red-600 text-white">
        <span>Sold Out</span>
      </span>
    );
  }
  if (qty < 5) {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-orange-100 text-orange-700">
        <AlertTriangle size={8} />
        <span>Low · {qty}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-green-100 text-green-700">
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
          {products.map(product => (
            <tr
              key={product.id ?? product._id}
              className="group hover:bg-gray-50/60 transition-colors duration-150"
            >
              {/* Product image + name */}
              <td className="px-5 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
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
                        <span className="text-gray-300 text-[10px] font-black uppercase">No img</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-tight text-gray-900 truncate max-w-[200px]">
                      {product.name}
                    </p>
                    {product.colors?.length > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        {product.colors.slice(0, 4).map(color => (
                          <span
                            key={color}
                            className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: color.includes('|') ? color.split('|')[0] : color }}
                            title={color}
                          />
                        ))}
                        {product.colors.length > 4 && (
                          <span className="text-[8px] text-gray-400 font-bold">
                            +{product.colors.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </td>

              {/* SKU */}
              <td className="px-5 py-4">
                <span className="font-mono text-[10px] font-bold text-gray-400">
                  #{product.id ?? product._id?.toString()?.slice(-8)}
                </span>
              </td>

              {/* Category */}
              <td className="px-5 py-4">
                <div>
                  <p className="text-[10px] font-black text-[#ba1f3d] uppercase tracking-widest">
                    {product.bucket || '—'}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    {product.subCategory || '—'}
                  </p>
                </div>
              </td>

              {/* Price */}
              <td className="px-5 py-4">
                <span className="text-sm font-black text-gray-900 tabular-nums">
                  Rs. {Number(product.price ?? 0).toLocaleString('en-PK')}
                </span>
              </td>

              {/* Stock */}
              <td className="px-5 py-4">
                <div className="space-y-1.5">
                  <StockBadge qty={product.quantity ?? 0} />
                  {/* Per-size breakdown if available */}
                  {product.sizes?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {product.sizes.map(size => {
                        const sizeQty =
                          product.sizeStock instanceof Map
                            ? (product.sizeStock.get(size) ?? 0)
                            : (product.sizeStock?.[size] ?? 0);
                        return (
                          <span
                            key={size}
                            className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              sizeQty === 0 ? 'bg-red-50 text-red-400' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {size}: {sizeQty}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </td>

              {/* Rating */}
              <td className="px-5 py-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-[10px] ${i < (product.rating ?? 5) ? 'text-[#FBBF24]' : 'text-gray-200'}`}
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
              <td className="px-5 py-4">
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">

                  {/* Edit → opens form pre-filled → PATCH /api/admin/products/:id */}
                  <button
                    onClick={() => onEdit(product)}
                    title="Edit product — updates MongoDB"
                    className="flex items-center space-x-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-900 hover:text-white transition-all duration-200"
                  >
                    <Edit3 size={11} />
                    <span>Edit</span>
                  </button>

                  {/* Delete → confirmation modal → DELETE /api/admin/products/:id */}
                  <button
                    onClick={() => onDelete(product)}
                    title="Delete product — removes from MongoDB"
                    className="flex items-center space-x-1.5 px-3 py-2 bg-red-50 text-[#ba1f3d] text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-[#ba1f3d] hover:text-white transition-all duration-200"
                  >
                    <Trash2 size={11} />
                    <span>Delete</span>
                  </button>

                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

ProductTable.displayName = 'ProductTable';
export default ProductTable;