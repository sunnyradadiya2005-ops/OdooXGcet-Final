import { useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

export default function AdminReports() {
  const [reportType, setReportType] = useState('orders');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleExport = async (format) => {
    try {
      setLoading(true);
      setMessage('');

      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('format', format);

      const response = await axios.get(
        `http://localhost:5000/api/exports/${reportType}?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: format === 'csv' ? 'blob' : 'json',
        }
      );

      if (format === 'csv') {
        // Download CSV
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        setMessage('Report exported successfully!');
      } else {
        setMessage('Export format not yet implemented');
      }
    } catch (err) {
      console.error('Export failed:', err);
      setMessage('Failed to export report: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Generate and export system reports</p>
      </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${message.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Generate Report</h2>

          <div className="space-y-6">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="orders">Orders Report</option>
                <option value="revenue">Revenue Report</option>
                <option value="products">Products Report</option>
                <option value="customers">Customers Report</option>
                <option value="vendors">Vendors Report</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Export Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <div className="flex gap-3">
                <button
                  onClick={() => handleExport('csv')}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Exporting...' : '📊 Export as CSV'}
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Exporting...' : '📈 Export as Excel'}
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Exporting...' : '📄 Export as PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Descriptions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Report Descriptions</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li><strong>Orders Report:</strong> All orders with customer details, status, and amounts</li>
            <li><strong>Revenue Report:</strong> Revenue breakdown by period with tax and fees</li>
            <li><strong>Products Report:</strong> Product inventory and rental statistics</li>
            <li><strong>Customers Report:</strong> Customer list with order history and spending</li>
            <li><strong>Vendors Report:</strong> Vendor performance and revenue metrics</li>
          </ul>
        </div>
    </AdminLayout>
  );
}
