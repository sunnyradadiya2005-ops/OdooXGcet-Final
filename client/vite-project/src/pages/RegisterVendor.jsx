import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Equipment',
  'Vehicles',
  'Sports',
  'Events',
  'Other',
];

export default function RegisterVendor() {
  const navigate = useNavigate();
  const { registerVendor } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    gstNumber: '',
    category: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name required';
    if (!form.lastName.trim()) e.lastName = 'Last name required';
    if (!form.companyName.trim()) e.companyName = 'Company name required';
    if (!form.gstNumber.trim()) e.gstNumber = 'GST number required';
    else if (form.gstNumber.trim().length !== 15) e.gstNumber = 'GST number must be exactly 15 characters';
    if (!form.category) e.category = 'Select a category';
    if (!form.email.trim()) e.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!/\d/.test(form.password)) e.password = 'Password must contain a number';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleVerifyEmail = async () => {
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrors({ ...errors, email: 'Valid email required' });
      return;
    }
    setLoading(true);
    try {
      const { requestOtp } = await import('../context/AuthContext');
      await api.post('/auth/request-otp', { email: form.email });
      setOtpSent(true);
      setErrors({ ...errors, email: '' });
      alert('OTP sent to your email');
    } catch (err) {
      setErrors({ ...errors, email: err.response?.data?.message || 'Failed to send OTP' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setErrors({ ...errors, otp: 'Enter OTP' });
      return;
    }
    setLoading(true);
    try {
      const { verifyOtp } = await import('../context/AuthContext');
      const { data } = await api.post('/auth/verify-otp', { email: form.email, otp });
      console.log('OTP verification response:', data);
      setVerificationToken(data.verificationToken);
      setIsVerified(true);
      setErrors({ ...errors, otp: '' });
      alert('Email verified successfully');
    } catch (err) {
      setErrors({ ...errors, otp: err.response?.data?.message || 'Invalid OTP' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!isVerified) {
      setErrors({ ...errors, form: 'Please verify your email first' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        confirmPassword: form.confirmPassword,
        verificationToken,
      };
      console.log('Sending vendor registration payload:', payload);
      await registerVendor(payload);
      navigate('/erp');
    } catch (err) {
      console.error('Registration error details:', err.response?.data);
      const errorMsg = err.response?.data?.errors
        ? err.response.data.errors.map(e => e.msg).join(', ')
        : err.response?.data?.message || 'Registration failed';
      setErrors({ form: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-600 px-4 py-6">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6">
          {/* Logo inside card */}
          <div className="text-center mb-4">
            <Link to="/" className="text-2xl font-bold text-teal-600 hover:text-teal-700 transition-colors">
              KirayaKart
            </Link>
            <p className="text-xs text-slate-500 mt-1">Vendor Registration</p>
          </div>

          <h1 className="text-lg font-bold text-slate-900 mb-1 text-center">Register as a Vendor</h1>
          <p className="text-sm text-slate-600 mb-4 text-center">Manage rentals, inventory, and invoices</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{errors.form}</div>
            )}

            {/* Personal Information Section */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide pb-1.5 border-b border-slate-200">
                Personal Information
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      disabled={isVerified}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-slate-100 text-sm"
                    />
                    {!isVerified && !otpSent && (
                      <button
                        type="button"
                        onClick={handleVerifyEmail}
                        disabled={loading}
                        className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium whitespace-nowrap transition-colors"
                      >
                        Verify
                      </button>
                    )}
                    {isVerified && (
                      <span className="flex items-center px-2 text-green-600 text-xs font-medium">
                        ✓
                      </span>
                    )}
                  </div>
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>

              {otpSent && !isVerified && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Verification Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otp}
                      maxLength={6}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit code"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={loading}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    >
                      Submit
                    </button>
                  </div>
                  {errors.otp && <p className="text-red-600 text-xs mt-1">{errors.otp}</p>}
                  <p className="text-xs text-slate-500 mt-1">Check your email for the code</p>
                </div>
              )}
            </div>

            {/* Business Information Section */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide pb-1.5 border-b border-slate-200">
                Business Information
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  {errors.companyName && (
                    <p className="text-red-600 text-xs mt-1">{errors.companyName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">GST Number</label>
                  <input
                    type="text"
                    value={form.gstNumber}
                    onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="29AABCT1234F1Z5"
                  />
                  {errors.gstNumber && <p className="text-red-600 text-xs mt-1">{errors.gstNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Product Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-600 text-xs mt-1">{errors.category}</p>}
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide pb-1.5 border-b border-slate-200">
                Security
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
                  <p className="text-xs text-slate-500 mt-1">Min 6 chars, include a number</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating account...' : 'Register as Vendor'}
            </button>
          </form>
          <div className="mt-5 pt-4 border-t border-slate-200">
            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                Sign In
              </Link>
            </p>
            <p className="text-center text-sm text-slate-600 mt-2">
              <Link to="/register" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                Register as Customer instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
