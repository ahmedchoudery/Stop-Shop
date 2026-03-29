import React, { memo } from 'react';
import { Search, Filter, X } from 'lucide-react';

const ProductFilters = memo(({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  stockFilter,
  onStockChange,
  categories = [],
}) => {
  const stockOptions = [
    { value: 'all', label: 'All Stock' },
    { value: 'in-stock', label: 'In Stock' },
    { value: 'low-stock', label: 'Low Stock (<5)' },
    { value: 'out-of-stock', label: 'Out of Stock' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 mb-8">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-sm py-3 pl-10 pr-4 text-xs font-bold focus:bg-white focus:border-[#ba1f3d] outline-none transition-all placeholder:text-gray-400"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-sm py-3 pl-10 pr-8 text-xs font-bold focus:bg-white focus:border-[#ba1f3d] outline-none transition-all cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <select
          value={stockFilter}
          onChange={(e) => onStockChange(e.target.value)}
          className="appearance-none bg-white border border-gray-200 rounded-sm py-3 px-4 text-xs font-bold focus:bg-white focus:border-[#ba1f3d] outline-none transition-all cursor-pointer"
        >
          {stockOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
});

ProductFilters.displayName = 'ProductFilters';

export default ProductFilters;
