import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import ErpLayout from '../../components/ErpLayout';

export default function ErpProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [productToToggle, setProductToToggle] = useState(null);

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

  const handleStatusClick = (product) => {
    // If product is active, show confirmation modal before disabling
    if (product.isActive) {
      setProductToToggle(product);
      setShowConfirmModal(true);
    } else {
      // If product is inactive, enable it directly without confirmation
      toggleActive(product.id, product.isActive);
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      await api.patch(`/products/${id}`, { isActive: !isActive });
      fetchProducts();
      setShowConfirmModal(false);
      setProductToToggle(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update product');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Permanently delete product "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete product');
    }
  };

  const handleConfirmDisable = () => {
    if (productToToggle) {
      toggleActive(productToToggle.id, productToToggle.isActive);
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
                    <td className="px-6 py-4 text-slate-600">
                      <span className="font-medium text-teal-600">{p.availableQty ?? p.stockQty}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="font-medium">{p.stockQty}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleStatusClick(p)}
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

      {/* Confirmation Modal */}
      {showConfirmModal && productToToggle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Disable Product?</h3>
            </div>
            
            <p className="text-slate-600 mb-2">
              Are you sure you want to disable <span className="font-semibold text-slate-900">"{productToToggle.name}"</span>?
            </p>
            <p className="text-sm text-slate-500 mb-6">
              This product will be hidden from customers until you enable it again. You can re-enable it anytime from this page.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setProductToToggle(null);
                }}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDisable}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Disable Product
              </button>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}
