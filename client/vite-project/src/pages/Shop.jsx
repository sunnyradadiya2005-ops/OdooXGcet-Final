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

  const [wishlist, setWishlist] = useState(new Set());
  const [cartItems, setCartItems] = useState(new Set());

  useEffect(() => {
    if (user?.role === 'CUSTOMER') {
      // Fetch Wishlist
      api.get('/wishlist')
        .then((r) => {
          const ids = new Set(r.data.map(item => item.productId));
          setWishlist(ids);
        })
        .catch(() => {});

      // Fetch Cart to show 'Added' status
      api.get('/cart')
        .then((r) => {
          const ids = new Set(r.data.map(item => item.productId));
          setCartItems(ids);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleWishlist = async (productId) => {
    if (!user) return (window.location.href = '/login');
    
    setWishlist(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      if (wishlist.has(productId)) {
         await api.delete(`/wishlist/${productId}`);
      } else {
         await api.post(`/wishlist/${productId}`);
      }
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (err) {
      setWishlist(prev => {
        const next = new Set(prev);
        if (prev.has(productId)) next.add(productId);
        else next.delete(productId);
        return next;
      });
    }
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault(); // Prevent navigation
    if (!user) return (window.location.href = '/login');
    if (cartItems.has(product.id)) return; // Already added

    // Optimistic Update
    setCartItems(prev => new Set(prev).add(product.id));

    try {
      // Default 1-day rental starting tomorrow
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      await api.post('/cart', {
        productId: product.id,
        quantity: 1,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error(err);
      // Revert if failed
      setCartItems(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
      alert('Failed to add to cart. Please try again.');
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {items.map((p) => {
                  const stock = p.availableQty ?? p.stockQty;
                  const isSoldOut = stock <= 0;
                  const isLowStock = stock > 0 && stock <= 5;
                  
                  return (
                    <Link
                      key={p.id}
                      to={`/product/${p.id}`}
                      className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-500/30 transition-all duration-300 flex flex-col overflow-hidden h-full"
                    >
                      {/* Card Cover - Square */}
                      <div className="relative aspect-square bg-slate-50 border-b border-slate-100 overflow-hidden">
                        <img
                          src={p.images?.[0] || 'https://picsum.photos/400/400'}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
                        />
                        
                        {/* Status Badges - Top Left */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          {isSoldOut && (
                            <span className="bg-red-600 text-white px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-sm">
                              Sold Out
                            </span>
                          )}
                          {isLowStock && (
                            <span className="bg-amber-500 text-white px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-sm">
                              Low Stock
                            </span>
                          )}
                        </div>

                        {/* Wishlist - Top Right */}
                        {user?.role === 'CUSTOMER' && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleWishlist(p.id);
                            }}
                            className={`absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full shadow-sm hover:bg-white transition-all duration-300 ${
                              wishlist.has(p.id) ? 'opacity-100 translate-y-0 text-red-500' : 'opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0 text-slate-400 hover:text-red-500'
                            }`}
                          >
                            <svg 
                              className="w-5 h-5 transition-colors" 
                              fill={wishlist.has(p.id) ? "currentColor" : "none"} 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Card Content - Professional & Compact */}
                      <div className="p-5 flex flex-col flex-1 gap-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{p.brand || 'Generic'}</p>
                            <h3 className="font-bold text-lg text-slate-900 leading-tight group-hover:text-teal-700 transition-colors line-clamp-2">
                              {p.name}
                            </h3>
                          </div>
                          {/* Price Tag - Prominent */}
                          <div className="text-right shrink-0">
                            <p className="text-xl font-bold text-teal-700">₹{p.basePrice}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">/day</p>
                          </div>
                        </div>

                        {/* Info Grid - Kanban Properties */}
                        <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-3">
                          <div className="grid grid-cols-2 gap-4">
                            {/* Stock */}
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-slate-50 text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Stock</span>
                                <span className={`text-xs font-semibold ${stock > 0 ? 'text-slate-700' : 'text-red-600'}`}>
                                  {stock > 0 ? `${stock} units` : 'Out of stock'}
                                </span>
                              </div>
                            </div>

                            {/* Hourly Rate or Spacer */}
                            {p.hourlyRate ? (
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-slate-50 text-slate-400">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Hourly</span>
                                  <span className="text-xs font-semibold text-slate-700">₹{p.hourlyRate}/hr</span>
                                </div>
                              </div>
                            ) : <div></div>}
                          </div>

                          {/* Add to Cart Button */}
                           {user?.role === 'CUSTOMER' && (
                            <button
                              onClick={(e) => handleAddToCart(e, p)}
                              disabled={stock <= 0 || cartItems.has(p.id)}
                              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                                cartItems.has(p.id)
                                  ? 'bg-green-50 text-green-600 cursor-default'
                                  : stock <= 0
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-slate-900 text-white hover:bg-teal-600 shadow-sm hover:shadow-md'
                              }`}
                            >
                              {cartItems.has(p.id) ? (
                                <>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Added to Cart
                                </>
                              ) : stock <= 0 ? (
                                'Out of Stock'
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  Add to Cart
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
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
