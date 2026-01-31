import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { useState, useEffect, useRef } from 'react';

export default function Header() {
  const { user, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Function to fetch and update cart count
  const fetchCartCount = () => {
    if (user?.role === 'CUSTOMER') {
      api.get('/cart')
        .then((r) => {
          const totalQuantity = r.data.reduce((sum, item) => {
            const qty = parseInt(item.quantity) || 1;
            return sum + qty;
          }, 0);
          setCartCount(totalQuantity);
        })
        .catch(() => setCartCount(0));
    }
  };

  // Function to fetch and update wishlist count
  const fetchWishlistCount = () => {
    if (user?.role === 'CUSTOMER') {
      api.get('/wishlist')
        .then((r) => setWishlistCount(r.data.length))
        .catch(() => setWishlistCount(0));
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCartCount();
    fetchWishlistCount();
  }, [user]);

  // Listen for cart/wishlist update events
  useEffect(() => {
    const handleCartUpdate = () => fetchCartCount();
    const handleWishlistUpdate = () => fetchWishlistCount();

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-teal-600 hover:text-teal-700 transition-colors">
            KirayaKart
          </Link>
          <nav className="flex items-center gap-8">
            <Link to="/shop" className="text-base text-slate-700 hover:text-teal-600 font-medium transition-colors">
              Shop
            </Link>
            <Link to="/terms" className="text-base text-slate-700 hover:text-teal-600 transition-colors font-medium">
              Terms
            </Link>
            <Link to="/about" className="text-base text-slate-700 hover:text-teal-600 transition-colors font-medium">
              About
            </Link>
            <Link to="/contact" className="text-base text-slate-700 hover:text-teal-600 transition-colors font-medium">
              Contact
            </Link>
            {user ? (
              <div className="flex items-center gap-6 ml-4 pl-4 border-l border-slate-200">
                {user.role === 'CUSTOMER' && (
                  <>
                    <Link to="/wishlist" className="relative text-slate-700 hover:text-teal-600 transition-colors p-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      {wishlistCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>
                    <Link to="/cart" className="relative text-slate-700 hover:text-teal-600 transition-colors p-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                <div className="flex items-center gap-4">
                  {user.role === 'CUSTOMER' && (
                    <>
                      <Link to="/orders" className="text-base text-slate-700 hover:text-teal-600 transition-colors font-medium">Orders</Link>
                      <Link to="/invoices" className="text-base text-slate-700 hover:text-teal-600 transition-colors font-medium">Invoices</Link>

                      {/* Profile Dropdown */}
                      <div className="relative" ref={dropdownRef}>
                        <button
                          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                          className="flex items-center gap-2 text-slate-700 hover:text-teal-600 transition-colors p-2 rounded-lg hover:bg-slate-50"
                        >
                          <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {showProfileDropdown && (
                          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                            {/* User Info Header */}
                            <div className="px-4 py-3 border-b border-slate-200">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                  {user.firstName?.[0]}{user.lastName?.[0]}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                                  <p className="text-sm text-slate-500">{user.email}</p>
                                </div>
                              </div>
                            </div>

                            {/* User Details */}
                            <div className="px-4 py-3 border-b border-slate-200">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Account Details</p>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Role:</span>
                                  <span className="font-medium text-slate-900">{user.role}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Member Since:</span>
                                  <span className="font-medium text-slate-900">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Menu Items */}
                            <div className="px-2 py-2 border-b border-slate-200">
                              <Link
                                to="/profile"
                                onClick={() => setShowProfileDropdown(false)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                View Profile
                              </Link>
                            </div>

                            {/* Logout Button */}
                            <div className="px-2 py-2">
                              <button
                                onClick={() => {
                                  setShowProfileDropdown(false);
                                  logout();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {(user.role === 'VENDOR' || user.role === 'ADMIN') && (
                    <>
                      <Link to="/erp" className="text-base text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                        Dashboard
                      </Link>
                      <button
                        onClick={logout}
                        className="text-base text-slate-700 hover:text-red-600 transition-colors font-medium"
                      >
                        Logout
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-200">
                <Link to="/login" className="text-base text-slate-700 hover:text-teal-600 transition-colors font-medium">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
