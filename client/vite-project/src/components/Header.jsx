import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { useState, useEffect } from 'react';

export default function Header() {
  const { user, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'CUSTOMER') {
      Promise.all([
        api.get('/cart').then((r) => r.data.length),
        api.get('/wishlist').then((r) => r.data.length),
      ]).then(([c, w]) => {
        setCartCount(c);
        setWishlistCount(w);
      }).catch(() => { });
    }
  }, [user]);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-teal-600">
            KirayaKart
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-slate-700 hover:text-teal-600">
              Products
            </Link>
            <Link to="/terms" className="text-slate-700 hover:text-teal-600">
              Terms
            </Link>
            <Link to="/about" className="text-slate-700 hover:text-teal-600">
              About
            </Link>
            <Link to="/contact" className="text-slate-700 hover:text-teal-600">
              Contact
            </Link>
            {user ? (
              <div className="flex items-center gap-4">
                {user.role === 'CUSTOMER' && (
                  <>
                    <Link to="/wishlist" className="relative text-slate-700 hover:text-teal-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      {wishlistCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>
                    <Link to="/cart" className="relative text-slate-700 hover:text-teal-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                <div className="flex items-center gap-2">
                  {user.role === 'CUSTOMER' && (
                    <>
                      <Link to="/orders" className="text-slate-700 hover:text-teal-600">Orders</Link>
                      <Link to="/invoices" className="text-slate-700 hover:text-teal-600">Invoices</Link>
                    </>
                  )}
                  {(user.role === 'VENDOR' || user.role === 'ADMIN') && (
                    <Link to="/erp" className="text-teal-600 font-medium">
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="text-slate-700 hover:text-red-600"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-slate-700 hover:text-teal-600">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
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
