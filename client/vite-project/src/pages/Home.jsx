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
    api.get('/products/brands').then((r) => setBrands(r.data)).catch(() => { });
    api.get('/products/colors').then((r) => setColors(r.data)).catch(() => { });
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
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex gap-8">
        <aside className="w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 sticky top-24 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Brand</label>
                <select
                  value={filters.brand}
                  onChange={(e) => setFilters({ ...filters, brand: e.target.value, page: 1 })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                >
                  <option value="">All Brands</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                <select
                  value={filters.color}
                  onChange={(e) => setFilters({ ...filters, color: e.target.value, page: 1 })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                >
                  <option value="">All Colors</option>
                  {colors.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Min Price (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value, page: 1 })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Max Price (₹)</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value, page: 1 })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        </aside>
        <main className="flex-1">
          <div className="mb-8">
            <input
              type="search"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full max-w-md px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-slate-100 h-80 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
              <p className="text-base text-slate-600">No products found</p>
              <p className="text-sm text-slate-500 mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((p) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                  >
                    <div className="aspect-square bg-slate-100 relative overflow-hidden">
                      <img
                        src={p.images?.[0] || 'https://picsum.photos/400/400'}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {user?.role === 'CUSTOMER' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleWishlist(p.id);
                          }}
                          className="absolute top-3 right-3 p-2.5 bg-white rounded-full shadow-md hover:bg-teal-50 transition-colors"
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

                      {/* Sold Out Badge */}
                      {p.stockQty <= 0 && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-base text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-2">
                        {p.name}
                      </h3>
                      <p className="text-sm text-slate-600 mt-2 font-medium">
                        ₹{p.basePrice}/day
                        {p.hourlyRate && (
                          <span className="ml-2 text-slate-500">• ₹{p.hourlyRate}/hr</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 mt-1.5">
                        {p.stockQty > 0 ? (
                          <span className={p.stockQty <= 5 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                            {p.stockQty} available
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">Out of stock</span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        {p.vendor?.companyName}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-10">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    className="px-6 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-slate-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    className="px-6 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
