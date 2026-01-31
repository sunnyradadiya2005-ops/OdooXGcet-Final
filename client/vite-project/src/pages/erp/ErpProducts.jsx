import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import ErpLayout from '../../components/ErpLayout';

export default function ErpProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/products?limit=100')
      .then((r) => setProducts(r.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ErpLayout>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Products</h1>
      {loading ? (
        <div className="animate-pulse h-48 bg-slate-200 rounded-xl" />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-slate-700">Product</th>
                <th className="text-left px-4 py-3 text-slate-700">Brand</th>
                <th className="text-left px-4 py-3 text-slate-700">Price/day</th>
                <th className="text-left px-4 py-3 text-slate-700">Stock</th>
                <th className="text-left px-4 py-3 text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-slate-200">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.images?.[0] || 'https://picsum.photos/50'}
                        alt=""
                        className="w-12 h-12 object-cover rounded"
                      />
                      <span className="font-medium text-slate-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.brand || '-'}</td>
                  <td className="px-4 py-3">₹{Number(p.basePrice).toFixed(2)}</td>
                  <td className="px-4 py-3">{p.stockQty}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        p.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="p-8 text-center text-slate-500">No products</div>
          )}
        </div>
      )}
    </ErpLayout>
  );
}
