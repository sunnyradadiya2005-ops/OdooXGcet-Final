import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import ErpLayout from '../../components/ErpLayout';

export default function ErpProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = () => {
    api
      .get('/products?limit=100')
      .then((r) => setProducts(r.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleActive = async (id, isActive) => {
    try {
      await api.patch(`/products/${id}`, { isActive: !isActive });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update product');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete product "${name}"?`)) return;
    try {
      await api.patch(`/products/${id}`, { isActive: false });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete product');
    }
  };

  return (
    <ErpLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Products</h1>
        <Link
          to="/erp/products/new"
          className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
        >
          + Add Product
        </Link>
      </div>
      {loading ? (
        <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Price/day</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0] || 'https://picsum.photos/50'}
                          alt=""
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <span className="font-medium text-sm text-slate-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{p.brand || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {p.costPrice ? `₹${Number(p.costPrice).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">₹{Number(p.basePrice).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{p.stockQty}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(p.id, p.isActive)}
                        className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${p.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <Link
                          to={`/erp/products/${p.id}/edit`}
                          className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {products.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-base text-slate-600 mb-2">No products yet</p>
              <Link to="/erp/products/new" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                Create your first product
              </Link>
            </div>
          )}
        </div>
      )}
    </ErpLayout>
  );
}
