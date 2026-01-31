import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await login(form.email, form.password);
      // Role-based redirect
      if (user.role === 'ADMIN' || user.role === 'VENDOR') {
        navigate('/erp');
      } else {
        navigate('/shop');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-600 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-8">
          {/* Logo inside card */}
          <div className="text-center mb-6">
            <Link to="/" className="text-3xl font-bold text-teal-600 hover:text-teal-700 transition-colors">
              KirayaKart
            </Link>
            <p className="text-xs text-slate-500 mt-1">Rental Management System</p>
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-1 text-center">Sign in to your account</h1>
          <p className="text-sm text-slate-600 mb-5 text-center">Access your rental dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-center text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                Register as Customer
              </Link>
            </p>
            <p className="text-center text-sm text-slate-600 mt-2">
              <Link to="/register/vendor" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                Become a Vendor
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
