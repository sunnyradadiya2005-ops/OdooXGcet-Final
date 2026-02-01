import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setMessage('Failed to load settings');
      setLoading(false);
    }
  };

  const handleUpdate = async (key, value) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/settings/${key}`,
        { value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettings({ ...settings, [key]: value });
      setMessage('Setting updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update setting:', err);
      setMessage('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpdate = async (updates) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/settings/bulk',
        { settings: updates },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettings({ ...settings, ...updates });
      setMessage('Settings updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setMessage('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-1">Configure platform-wide settings</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* General Settings - No Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
        </div>
        <div className="p-6">
          <GeneralSettings settings={settings} onUpdate={handleUpdate} saving={saving} />
        </div>
      </div>
    </AdminLayout>
  );
}

function GeneralSettings({ settings, onUpdate, saving }) {
  const [form, setForm] = useState({
    company_name: settings.company_name || '',
    company_email: settings.company_email || '',
    company_phone: settings.company_phone || '',
    company_address: settings.company_address || '',
    company_city: settings.company_city || '',
    company_state: settings.company_state || '',
    company_zip: settings.company_zip || '',
    gst_number: settings.gst_number || '',
  });

  useEffect(() => {
    setForm({
      company_name: settings.company_name || '',
      company_email: settings.company_email || '',
      company_phone: settings.company_phone || '',
      company_address: settings.company_address || '',
      company_city: settings.company_city || '',
      company_state: settings.company_state || '',
      company_zip: settings.company_zip || '',
      gst_number: settings.gst_number || '',
    });
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== settings[key]) {
        onUpdate(key, value);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
          <input
            type="text"
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Email</label>
          <input
            type="email"
            value={form.company_email}
            onChange={(e) => setForm({ ...form, company_email: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={form.company_phone}
            onChange={(e) => setForm({ ...form, company_phone: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
          <input
            type="text"
            value={form.gst_number}
            onChange={(e) => setForm({ ...form, gst_number: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
        <input
          type="text"
          value={form.company_address}
          onChange={(e) => setForm({ ...form, company_address: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <input
            type="text"
            value={form.company_city}
            onChange={(e) => setForm({ ...form, company_city: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
          <input
            type="text"
            value={form.company_state}
            onChange={(e) => setForm({ ...form, company_state: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
          <input
            type="text"
            value={form.company_zip}
            onChange={(e) => setForm({ ...form, company_zip: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

function TaxSettings({ settings, onUpdate, saving }) {
  const [taxRate, setTaxRate] = useState(settings.tax_rate || 0.18);
  const [platformFee, setPlatformFee] = useState(settings.platform_fee_percent || 2.5);

  const handleSave = () => {
    onUpdate('tax_rate', taxRate);
    onUpdate('platform_fee_percent', platformFee);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tax Rate (GST %)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="1"
          value={taxRate}
          onChange={(e) => setTaxRate(parseFloat(e.target.value))}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          Current: {(taxRate * 100).toFixed(2)}%
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Platform Fee (%)
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={platformFee}
          onChange={(e) => setPlatformFee(parseFloat(e.target.value))}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          Fee charged to vendors on each transaction
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

function PaymentSettings({ settings, onUpdate, saving }) {
  const [keyId, setKeyId] = useState(settings.razorpay_key_id || '');
  const [keySecret, setKeySecret] = useState(settings.razorpay_key_secret || '');
  const [mode, setMode] = useState(settings.payment_mode || 'test');

  const handleSave = () => {
    onUpdate('razorpay_key_id', keyId);
    onUpdate('razorpay_key_secret', keySecret);
    onUpdate('payment_mode', mode);
  };

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>Security Notice:</strong> Payment gateway credentials are sensitive. Handle with care.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Razorpay Key ID
        </label>
        <input
          type="text"
          value={keyId}
          onChange={(e) => setKeyId(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          placeholder="rzp_test_..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Razorpay Key Secret
        </label>
        <input
          type="password"
          value={keySecret}
          onChange={(e) => setKeySecret(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Mode
        </label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
        >
          <option value="test">Test Mode</option>
          <option value="live">Live Mode</option>
        </select>
        <p className="text-sm text-gray-500 mt-1">
          {mode === 'test' ? '🧪 Test mode - No real transactions' : '🔴 Live mode - Real transactions'}
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
