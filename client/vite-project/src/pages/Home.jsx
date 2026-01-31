import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    brand: '',
    color: '',
    minPrice: '',
    maxPrice: '',
    category: '',
    page: 1,
  });

  useEffect(() => {
    api.get('/products/brands').then((r) => setBrands(r.data)).catch(() => {});
    api.get('/products/colors').then((r) => setColors(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.brand) params.set('brand', filters.brand);
    if (filters.color) params.set('color', filters.color);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.category) params.set('category', filters.category);
    params.set('page', filters.page);
    params.set('limit', 12);

    api
      .get(`/products?${params}`)
      .then(({ data }) => setProducts(data))
      .catch(() => setProducts({ products: [], pagination: {} }))
      .finally(() => setLoading(false));
  }, [filters]);

  const handleWishlist = async (productId) => {
    if (!user) return (window.location.href = '/login');
    try {
      await api.post(`/wishlist/${productId}`);
    } catch (err) {
      if (err.response?.status === 409) return;
    }
  };

  const items = products.products || [];
  const pagination = products.pagination || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        <aside className="w-64 shrink-0">
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4 sticky top-24">
            <h3 className="font-semibold text-slate-800">Filters</h3>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Brand</label>
              <select
                value={filters.brand}
                onChange={(e) => setFilters({ ...filters, brand: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="">All</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Color</label>
              <select
                value={filters.color}
                onChange={(e) => setFilters({ ...filters, color: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="">All</option>
                {colors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Min Price (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Max Price (₹)</label>
              <input
                type="number"
                placeholder="Any"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </aside>
        <main className="flex-1">
          <div className="mb-6">
            <input
              type="search"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-slate-200 h-80 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-slate-600">No products found</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((p) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-square bg-slate-100 relative">
                      <img
                        src={p.images?.[0] || 'https://picsum.photos/400/400'}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                      {user?.role === 'CUSTOMER' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleWishlist(p.id);
                          }}
                          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-teal-50"
                        >
                          <svg
                            className="w-5 h-5 text-slate-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-slate-800 group-hover:text-teal-600">
                        {p.name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        ₹{p.basePrice}/day
                        {p.hourlyRate && (
                          <span className="ml-2">• ₹{p.hourlyRate}/hr</span>
                        )}
                      </p>
                      <p className="text-sm text-slate-600 mt-2">
                        {p.vendor?.companyName}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
