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
    referralCode: '',
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
        referralCode: form.referralCode,
      });
      navigate('/shop');
    } catch (err) {
      setErrors({ form: err.response?.data?.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4 py-12">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 md:p-10 card">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:bg-teal-700 transition-colors">
                K
              </div>
              <span className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-teal-700 transition-colors">
                KirayaKart
              </span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">Create Account</h1>
          <p className="text-slate-500 mb-8 text-center text-sm">Join purely rental marketplace</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.form && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {errors.form}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="input-field"
                  placeholder="John"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="input-field"
                  placeholder="Doe"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Email Address</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={form.email}
                    disabled={isVerified}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="john@example.com"
                  />
                  {isVerified && (
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     </span>
                  )}
                </div>
                {!isVerified && !otpSent && (
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    disabled={loading}
                    className="px-5 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                  >
                    Verify
                  </button>
                )}
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              {isVerified && <p className="text-green-600 text-xs mt-1 font-medium">Email verified successfully</p>}
            </div>

            {otpSent && !isVerified && (
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Enter Verification Code</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="input-field text-center tracking-widest text-lg font-mono font-bold"
                    placeholder="000000"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium transition-colors"
                  >
                    Confirm
                  </button>
                </div>
                {errors.otp && <p className="text-red-500 text-xs mt-2">{errors.otp}</p>}
                <p className="text-xs text-slate-500 mt-2">We sent a 6-digit code to your email address.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="input-field"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
               <label className="block text-sm font-semibold text-slate-700">Referral Code (Optional)</label>
               <input
                 type="text"
                 value={form.referralCode}
                 onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
                 className="input-field uppercase tracking-wider font-mono placeholder:normal-case placeholder:font-sans"
                 placeholder="Enter code (e.g. VEER123)"
                 maxLength={10}
               />
               <p className="text-xs text-slate-500">Have a code? Enter it to get a welcome reward!</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base shadow-lg shadow-teal-500/20 mt-4"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   <span>Creating Account...</span>
                </div>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition-all">
                Sign In
              </Link>
            </p>
            <p className="text-sm text-slate-600">
              Want to sell on KirayaKart?{' '}
              <Link to="/register/vendor" className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition-all">
                Become a Vendor →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
