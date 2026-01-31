import { useState, useEffect } from 'react';
import api from '../../lib/api';
import ErpLayout from '../../components/ErpLayout';
import { useAuth } from '../../context/AuthContext';

export default function ErpSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // System Settings (Admin only)
  const [taxRate, setTaxRate] = useState('');
  const [lateFee, setLateFee] = useState('');

  // Company Details (Admin only)
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyGST, setCompanyGST] = useState('');

  // Profile
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [vendorCompanyName, setVendorCompanyName] = useState('');
  const [vendorGST, setVendorGST] = useState('');

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadSettings();
    loadProfile();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings');
      setTaxRate((res.data.tax_rate * 100).toFixed(0)); // Convert to percentage
      setLateFee(res.data.late_fee_per_day?.toString() || '');
      setCompanyName(res.data.company_name || '');
      setCompanyAddress(res.data.company_address || '');
      setCompanyGST(res.data.company_gst || '');
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const loadProfile = async () => {
    if (!user) return;
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    if (user.vendor) {
      setVendorCompanyName(user.vendor.companyName || '');
      setVendorGST(user.vendor.gstNumber || '');
    }
  };

  const handleSaveSystemSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.post('/settings/bulk', {
        settings: {
          tax_rate: (parseFloat(taxRate) / 100).toString(), // Convert back to decimal
          late_fee_per_day: lateFee,
        },
      });
      setMessage('System settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompanyDetails = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.post('/settings/bulk', {
        settings: {
          company_name: companyName,
          company_address: companyAddress,
          company_gst: companyGST,
        },
      });
      setMessage('Company details saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const updates = { firstName, lastName };
      if (user.vendor) {
        updates.vendorCompanyName = vendorCompanyName;
        updates.vendorGST = vendorGST;
      }

      await api.put('/profile', updates);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (newPassword !== confirmPassword) {
      setMessage('Error: Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Error: Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await api.post('/profile/change-password', {
        currentPassword,
        newPassword,
      });
      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErpLayout>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium ${activeTab === 'profile'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-600 hover:text-slate-800'
            }`}
        >
          Profile
        </button>
        {user?.role === 'ADMIN' && (
          <>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 font-medium ${activeTab === 'system'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-slate-600 hover:text-slate-800'
                }`}
            >
              System Settings
            </button>
            <button
              onClick={() => setActiveTab('company')}
              className={`px-4 py-2 font-medium ${activeTab === 'company'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-slate-600 hover:text-slate-800'
                }`}
            >
              Company Details
            </button>
          </>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${message.startsWith('Error')
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-green-50 text-green-800 border border-green-200'
            }`}
        >
          {message}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="w-full px-4 py-2 border rounded-lg bg-slate-50"
                  disabled
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              {user?.vendor && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={vendorCompanyName}
                      onChange={(e) => setVendorCompanyName(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      GST Number
                    </label>
                    <input
                      type="text"
                      value={vendorGST}
                      onChange={(e) => setVendorGST(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* System Settings Tab (Admin Only) */}
      {activeTab === 'system' && user?.role === 'ADMIN' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">System Settings</h2>
          <form onSubmit={handleSaveSystemSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tax Rate (GST %)
              </label>
              <input
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Current: {taxRate}% (Applied to all new orders)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Late Fee Per Day (₹)
              </label>
              <input
                type="number"
                step="1"
                value={lateFee}
                onChange={(e) => setLateFee(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Charged when items are returned late
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save System Settings'}
            </button>
          </form>
        </div>
      )}

      {/* Company Details Tab (Admin Only) */}
      {activeTab === 'company' && user?.role === 'ADMIN' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Company Details</h2>
          <form onSubmit={handleSaveCompanyDetails} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Company Address
              </label>
              <textarea
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Company GST Number
              </label>
              <input
                type="text"
                value={companyGST}
                onChange={(e) => setCompanyGST(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Company Details'}
            </button>
          </form>
        </div>
      )}
    </ErpLayout>
  );
}
