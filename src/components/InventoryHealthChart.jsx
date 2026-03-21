import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const InventoryHealthChart = ({ products }) => {
  const soldOutCount = products.filter(p => p.quantity === 0).length;
  const inStockCount = products.length - soldOutCount;
  
  const data = [
    { name: 'Sold Out', value: soldOutCount },
    { name: 'In Stock', value: inStockCount },
  ];

  const COLORS = ['#F63049', '#E5E7EB'];
  const percentage = products.length > 0 ? Math.round((soldOutCount / products.length) * 100) : 0;

  return (
    <div className="bg-white p-8 rounded-sm border border-gray-100 shadow-xl shadow-gray-100/50 flex flex-col items-center justify-center relative min-h-[300px]">
      <div className="absolute top-6 left-8">
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Inventory Health</h3>
      </div>
      
      <div className="w-full h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Centered Percentage Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-red-600 tracking-tighter">{percentage}%</span>
          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-1">Out of Stock</span>
        </div>
      </div>

      <div className="mt-6 flex space-x-8">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[#F63049] rounded-sm"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sold Out ({soldOutCount})</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[#E5E7EB] rounded-sm"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">In Stock ({inStockCount})</p>
        </div>
      </div>
      
      <p className="mt-8 text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 italic border-t border-gray-50 pt-4 w-full text-center">
        Logistics Health Score: {100 - percentage}/100
      </p>
    </div>
  );
};

export default InventoryHealthChart;
