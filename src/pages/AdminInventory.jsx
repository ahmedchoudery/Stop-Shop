import React from 'react';
import InventoryTable from '../components/InventoryTable';

const AdminInventory = () => {
  return (
    <div className="p-10 bg-white min-h-screen">
      <div className="mb-12">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900 border-l-8 border-red-600 pl-6">
          Master Inventory
        </h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2 ml-6">
          Global Stock Availability & Logistics Control
        </p>
      </div>
      <InventoryTable />
    </div>
  );
};

export default AdminInventory;
