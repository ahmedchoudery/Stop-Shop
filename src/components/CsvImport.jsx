/**
 * @fileoverview CsvImport.jsx
 * Standalone component — add this to AdminProducts.jsx
 *
 * Allows bulk import of products via CSV upload.
 * Expected CSV columns (header row required):
 *   name, price, quantity, bucket, subCategory, specs, colors, sizes
 *
 * Usage in AdminProducts.jsx:
 *   import CsvImport from '../components/CsvImport.jsx';
 *   // Add <CsvImport onImported={refetch} /> in the page
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, Loader } from 'lucide-react';
import { authFetch } from '../lib/auth.js';
import { apiUrl } from '../config/api.js';

// ─────────────────────────────────────────────────────────────────
// CSV PARSER
// ─────────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

  const required = ['name', 'price'];
  const missing  = required.filter(r => !headers.includes(r));
  if (missing.length) throw new Error(`Missing required columns: ${missing.join(', ')}`);

  const products = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle commas inside quotes
    const values = [];
    let cur = '';
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { values.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    values.push(cur.trim());

    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });

    if (!row.name || !row.price) continue;

    const product = {
      name:        row.name,
      price:       parseFloat(row.price) || 0,
      quantity:    parseInt(row.quantity ?? row.stock ?? 0) || 0,
      bucket:      row.bucket || row.category || 'Tops',
      subCategory: row.subcategory || row.subCategory || 'General',
      specs:       row.specs   ? row.specs.split('|').map(s => s.trim()).filter(Boolean)   : [],
      colors:      row.colors  ? row.colors.split('|').map(c => c.trim()).filter(Boolean)  : [],
      sizes:       row.sizes   ? row.sizes.split('|').map(s => s.trim()).filter(Boolean)   : [],
      image:       row.image   || row.imageurl || '',
      rating:      parseFloat(row.rating)  || 5,
      mediaType:   row.image   ? 'url' : 'upload',
    };

    products.push(product);
  }

  if (!products.length) throw new Error('No valid product rows found in CSV');
  return products;
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

const CsvImport = ({ onImported }) => {
  const [isOpen,    setIsOpen]    = useState(false);
  const [preview,   setPreview]   = useState([]);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [result,    setResult]    = useState(null); // { imported, errors }
  const fileRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setParseError('Please select a .csv file'); return; }

    setParseError('');
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const products = parseCSV(e.target.result);
        setPreview(products);
      } catch (err) {
        setParseError(err.message);
        setPreview([]);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    if (!preview.length) return;
    setImporting(true);
    const errors = [];
    let imported = 0;

    // Import in batches of 5
    for (let i = 0; i < preview.length; i += 5) {
      const batch = preview.slice(i, i + 5);
      await Promise.all(batch.map(async (product) => {
        try {
          const res = await authFetch(apiUrl('/api/admin/products'), {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ ...product, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }),
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            errors.push(`"${product.name}": ${d.error ?? 'Failed'}`);
          } else {
            imported++;
          }
        } catch (err) {
          errors.push(`"${product.name}": ${err.message}`);
        }
      }));
    }

    setResult({ imported, errors });
    setImporting(false);
    if (imported > 0) onImported?.();
  };

  const downloadTemplate = () => {
    const csv = `name,price,quantity,bucket,subCategory,specs,colors,sizes,image
Classic White Polo,2500,50,Tops,Polo,100% Cotton|Regular Fit|Polo collar,#FFFFFF White|#000000 Black,S|M|L|XL,
Slim Fit Jeans,3500,30,Bottoms,Jeans,Slim fit|Stretch denim|5-pocket design,#1a1a2e Indigo|#4a4a4a Grey,30|32|34|36,`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'stopshop-product-template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-2.5 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-all"
      >
        <Upload size={13} />
        <span>Bulk Import CSV</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-black uppercase tracking-tight text-gray-900">Bulk Import Products</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">via CSV file</p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={downloadTemplate}
              className="flex items-center space-x-1.5 px-3 py-2 border border-gray-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-all">
              <Download size={11} />
              <span>Download Template</span>
            </button>
            <button onClick={() => { setIsOpen(false); setPreview([]); setParseError(''); setResult(null); }}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto p-6 space-y-5">

          {/* Drop zone */}
          {!result && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-[#ba1f3d] hover:bg-red-50/30 transition-all group"
            >
              <FileText size={32} className="mx-auto text-gray-300 mb-3 group-hover:text-[#ba1f3d] transition-colors" />
              <p className="font-black uppercase tracking-tight text-gray-900 mb-1">
                Drop CSV file here
              </p>
              <p className="text-[10px] font-bold text-gray-400">or click to browse</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>
          )}

          {/* Parse error */}
          {parseError && (
            <div className="flex items-start space-x-2 p-4 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle size={14} className="text-[#ba1f3d] flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-[#ba1f3d]">{parseError}</p>
            </div>
          )}

          {/* Preview table */}
          {preview.length > 0 && !result && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-3">
                Preview — {preview.length} product{preview.length !== 1 ? 's' : ''} ready to import
              </p>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Name', 'Price (PKR)', 'Qty', 'Category', 'Sub-Category'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-[8px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {preview.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs font-bold text-gray-900 truncate max-w-[140px]">{p.name}</td>
                          <td className="px-3 py-2 text-xs font-black text-[#ba1f3d]">{p.price.toLocaleString()}</td>
                          <td className="px-3 py-2 text-xs font-bold text-gray-600">{p.quantity}</td>
                          <td className="px-3 py-2 text-xs font-bold text-gray-600">{p.bucket}</td>
                          <td className="px-3 py-2 text-xs font-bold text-gray-600">{p.subCategory}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CSV format guide */}
          {!preview.length && !parseError && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-xs font-bold text-gray-600 space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">CSV Column Format</p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {[
                  ['name', 'Product name (required)'],
                  ['price', 'Price in PKR (required)'],
                  ['quantity', 'Stock quantity'],
                  ['bucket', 'Category: Tops / Bottoms / etc'],
                  ['subCategory', 'e.g. Polo, Jeans, Shoes'],
                  ['specs', 'Pipe-separated: 100% Cotton|Slim fit'],
                  ['colors', 'Pipe-separated: #FFFFFF White|#000000'],
                  ['sizes', 'Pipe-separated: S|M|L|XL'],
                  ['image', 'Image URL (optional)'],
                  ['rating', 'Rating 1-5 (default: 5)'],
                ].map(([col, desc]) => (
                  <div key={col} className="flex items-start space-x-1.5">
                    <code className="text-[#ba1f3d] font-black bg-red-50 px-1 rounded text-[9px] flex-shrink-0">{col}</code>
                    <span className="text-gray-400 text-[9px]">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import result */}
          {result && (
            <div className="space-y-4">
              <div className={`flex items-center space-x-3 p-4 rounded-xl ${result.imported > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {result.imported > 0
                  ? <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                  : <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                }
                <div>
                  <p className="text-sm font-black text-gray-900">
                    {result.imported} product{result.imported !== 1 ? 's' : ''} imported successfully
                  </p>
                  {result.errors.length > 0 && (
                    <p className="text-[10px] font-bold text-red-600 mt-0.5">
                      {result.errors.length} failed
                    </p>
                  )}
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Errors</p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-[10px] font-bold text-red-600">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {preview.length > 0 && !result && (
          <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4 flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400">
              {preview.length} product{preview.length !== 1 ? 's' : ''} will be added to your catalog
            </p>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center space-x-2 px-8 py-3 bg-[#ba1f3d] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
            >
              {importing
                ? <><Loader size={13} className="animate-spin" /><span>Importing...</span></>
                : <><Upload size={13} /><span>Import All {preview.length} Products</span></>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CsvImport;