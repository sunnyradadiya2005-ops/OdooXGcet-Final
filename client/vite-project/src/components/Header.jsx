import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { useState, useEffect, useRef } from 'react';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);

  // Track scroll for shadow effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchCartCount = () => {
    if (user?.role === 'CUSTOMER') {
      api.get('/cart')
        .then((r) => {
          const totalQuantity = r.data.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
          setCartCount(totalQuantity);
        })
        .catch(() => setCartCount(0));
    }
  };

  const fetchWishlistCount = () => {
    if (user?.role === 'CUSTOMER') {
      api.get('/wishlist')
        .then((r) => setWishlistCount(r.data.length))
        .catch(() => setWishlistCount(0));
    }
  };

  useEffect(() => {
    fetchCartCount();
    fetchWishlistCount();
  }, [user]);

  useEffect(() => {
    const handleUpdates = () => { fetchCartCount(); fetchWishlistCount(); };
    window.addEventListener('cartUpdated', handleUpdates);
    window.addEventListener('wishlistUpdated', handleUpdates);
    return () => {
      window.removeEventListener('cartUpdated', handleUpdates);
      window.removeEventListener('wishlistUpdated', handleUpdates);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${
        isScrolled ? 'shadow-md border-transparent py-3' : 'border-b border-slate-200 py-4'
      }`}
    >
      <div className="container-custom flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:bg-teal-700 transition-colors">
            K
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-teal-700 transition-colors">
            KirayaKart
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { name: 'Shop', path: '/shop' },
            { name: 'About', path: '/about' },
            { name: 'Contact', path: '/contact' },
          ].map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {user.role === 'CUSTOMER' && (
                <div className="flex items-center gap-2">
                  <Link 
                    to="/wishlist" 
                    className="relative p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-all"
                    title="Wishlist"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {wishlistCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                    )}
                  </Link>
                  <Link 
                    to="/cart" 
                    className="relative p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-all"
                    title="Cart"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              )}

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full border border-slate-200 hover:border-teal-200 hover:bg-teal-50 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>

                    <div className="py-2">
                       {user.role === 'CUSTOMER' ? (
                        <>
                          <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-700">
                            User Profile
                          </Link>
                          <Link to="/orders" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-700">
                            My Orders
                          </Link>
                        </>
                       ) : (
                        <Link to={user.role === 'ADMIN' ? "/admin/dashboard" : "/erp"} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-700">
                          To Dashboard
                        </Link>
                       )}
                    </div>

                    <div className="border-t border-slate-100 pt-2 pb-1">
                      <button
                        onClick={() => { setShowProfileDropdown(false); logout(); navigate('/'); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                         Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 text-sm font-medium text-white bg-teal-600 rounded-full hover:bg-teal-700 shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
