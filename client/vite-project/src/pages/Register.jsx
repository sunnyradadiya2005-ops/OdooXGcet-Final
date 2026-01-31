import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { registerCustomer, requestOtp, verifyOtp } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
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
    if (!form.email.trim()) e.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!/\d/.test(form.password)) e.password = 'Password must contain a number';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleVerifyEmail = async () => {
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrors({ ...errors, email: 'Enter a valid email first' });
      return;
    }
    setLoading(true);
    try {
      await requestOtp(form.email);
      setOtpSent(true);
      setErrors({});
    } catch (err) {
      setErrors({ ...errors, email: err.response?.data?.message || 'Failed to send OTP' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setErrors({ ...errors, otp: 'Enter a valid 6-digit OTP' });
      return;
    }
    setLoading(true);
    try {
      const data = await verifyOtp(form.email, otp);
      setVerificationToken(data.verificationToken);
      setIsVerified(true);
      setOtpSent(false);
      setErrors({});
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
      await registerCustomer({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        verificationToken,
      });
      navigate('/shop');
    } catch (err) {
      setErrors({ form: err.response?.data?.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-600 px-4 py-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6">
          {/* Logo inside card */}
          <div className="text-center mb-4">
            <Link to="/" className="text-2xl font-bold text-teal-600 hover:text-teal-700 transition-colors">
              KirayaKart
            </Link>
            <p className="text-xs text-slate-500 mt-1">Customer Registration</p>
          </div>

          <h1 className="text-lg font-bold text-slate-900 mb-1 text-center">Create your account</h1>
          <p className="text-sm text-slate-600 mb-4 text-center">Rent products easily and securely</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {errors.form && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{errors.form}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
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
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={form.email}
                  disabled={isVerified}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-slate-100"
                />
                {!isVerified && !otpSent && (
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    disabled={loading}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap transition-colors"
                  >
                    Verify
                  </button>
                )}
              </div>
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
              {isVerified && <p className="text-green-600 text-xs mt-1 font-medium">✓ Email verified</p>}
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
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter 6-digit code"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap transition-colors"
                  >
                    Submit
                  </button>
                </div>
                {errors.otp && <p className="text-red-600 text-xs mt-1">{errors.otp}</p>}
                <p className="text-xs text-slate-500 mt-1">Check your email for the code</p>
              </div>
            )}

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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating account...' : 'Create Account'}
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
              Want to rent out products?{' '}
              <Link to="/register/vendor" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                Become a Vendor →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
