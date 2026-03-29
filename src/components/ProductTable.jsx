import React, { memo } from 'react';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';

const ProductTable = memo(({
  products,
  loading,
  onEdit,
  onDelete,
  onView,
}) => {
  if (loading) {
    return (
      <div className="p-10 text-center font-black uppercase tracking-widest text-gray-400 animate-pulse">
        Syncing Product Registry...
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-sm">
        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">
          No products found
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">SKU</th>
            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Product</th>
            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Category</th>
            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Price (PKR)</th>
            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Stock</th>
            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Rating</th>
            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
              <td className="p-4 font-mono text-xs font-bold text-red-600">
                {product.id}
              </td>
              <td className="p-4">
                <div className="flex items-center space-x-3">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-sm bg-gray-100"
                    />
                  )}
                  <span className="text-sm font-black uppercase tracking-tight">{product.name}</span>
                </div>
              </td>
              <td className="p-4">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  {product.bucket} / {product.subCategory || 'General'}
                </span>
              </td>
              <td className="p-4">
                <span className="text-sm font-black text-gray-900">
                  Rs. {product.price?.toLocaleString()}
                </span>
              </td>
              <td className="p-4">
                <span className={`text-xs font-black uppercase tracking-widest ${
                  product.quantity === 0 
                    ? 'text-red-600' 
                    : product.quantity < 5 
                      ? 'text-yellow-600' 
                      : 'text-green-600'
                }`}>
                  {product.quantity === 0 ? 'Out of Stock' : `${product.quantity} units`}
                </span>
              </td>
              <td className="p-4">
                <span className="text-xs font-black text-gray-400">
                  {'★'.repeat(product.rating || 5)}
                </span>
              </td>
              <td className="p-4">
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => onView(product)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                    title="View Details"
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button
                    onClick={() => onEdit(product)}
                    className="p-2 text-gray-400 hover:text-[#ba1f3d] hover:bg-red-50 rounded-full transition-all"
                    title="Edit Product"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                    title="Delete Product"
                  >
                    <Trash2 size={16} />
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
