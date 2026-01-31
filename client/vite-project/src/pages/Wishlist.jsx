import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Wishlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'CUSTOMER') {
      navigate('/');
      return;
    }
    api
      .get('/wishlist')
      .then((r) => setItems(r.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleRemove = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } catch { }
  };

  if (!user) return null;
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Wishlist</h1>
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-600 mb-4">Your wishlist is empty</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link to={`/product/${item.product.id}`}>
                <img
                  src={item.product?.images?.[0] || 'https://picsum.photos/400/400'}
                  alt={item.product?.name}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-4">
                  <h3 className="font-medium text-slate-800">{item.product?.name}</h3>
                  <p className="text-sm text-teal-600 font-medium mt-1">
                    ₹{item.product?.basePrice}/day
                  </p>
                  <p className="text-xs mt-1">
                    {item.product?.stockQty > 0 ? (
                      <span className={item.product.stockQty <= 5 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                        {item.product.stockQty} available
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">Out of stock</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.product?.vendor?.companyName}
                  </p>
                </div>
              </Link>
              <div className="px-4 pb-4 flex gap-2">
                <Link
                  to={`/product/${item.product.id}`}
                  className="flex-1 text-center py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50"
                >
                  Rent
                </Link>
                <button
                  onClick={() => handleRemove(item.productId)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
