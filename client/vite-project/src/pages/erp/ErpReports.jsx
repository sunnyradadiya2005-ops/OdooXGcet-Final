import { useState, useEffect } from 'react';
import api from '../../lib/api';
import ErpLayout from '../../components/ErpLayout';
import { useAuth } from '../../context/AuthContext';

export default function ErpReports() {
  const { user } = useAuth();
  const [revenue, setRevenue] = useState({ totalRevenue: 0, chartData: [] });
  const [mostRented, setMostRented] = useState([]);
  const [vendorEarnings, setVendorEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    Promise.all([
      api.get(`/reports/revenue?${params}`).then((r) => r.data),
      api.get(`/reports/most-rented?${params}`).then((r) => r.data),
      user?.role === 'ADMIN'
        ? api.get(`/reports/vendor-earnings?${params}`).then((r) => r.data)
        : Promise.resolve([]),
    ])
      .then(([rev, rented, vendor]) => {
        setRevenue(rev);
        setMostRented(rented);
        setVendorEarnings(vendor);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [startDate, endDate, user?.role]);

  return (
    <ErpLayout>
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Reports & Analytics</h1>

      <div className="flex gap-4 mb-8">
        <div className="flex gap-3 flex-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-3 items-end">
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/exports/revenue/pdf?startDate=${startDate}&endDate=${endDate}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
          >
            📄 Export PDF
          </a>
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/exports/revenue/csv?startDate=${startDate}&endDate=${endDate}`}
            download
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
          >
            📊 Export CSV
          </a>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />
      ) : (
        <div className="space-y-8">
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Total Revenue</h2>
            <p className="text-4xl font-bold text-teal-600">
              ₹{revenue.totalRevenue?.toFixed(2) || '0.00'}
            </p>
            {revenue.chartData?.length > 0 && (
              <div className="mt-4 h-48 flex items-end gap-1">
                {revenue.chartData.slice(-14).map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-teal-500 rounded-t min-h-[4px]"
                    style={{
                      height: `${Math.max(
                        4,
                        (d.amount / Math.max(...revenue.chartData.map((x) => x.amount), 1)) * 100
                      )}%`,
                    }}
                    title={`${d.date}: ₹${d.amount}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-slate-800">Most Rented Products</h2>
              <a
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/exports/most-rented/csv?startDate=${startDate}&endDate=${endDate}`}
                download
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                📊 Export CSV
              </a>
            </div>
            <div className="space-y-2">
              {mostRented.slice(0, 10).map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-800">{item.product?.name || 'Unknown'}</span>
                  <span className="font-medium text-teal-600">{item.totalQuantity || 0} rentals</span>
                </div>
              ))}
              {mostRented.length === 0 && (
                <p className="text-slate-500 text-sm">No data</p>
              )}
            </div>
          </div>

          {user?.role === 'ADMIN' && vendorEarnings.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-slate-800">Vendor Earnings</h2>
                <a
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/exports/vendor-earnings/csv?startDate=${startDate}&endDate=${endDate}`}
                  download
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  📊 Export CSV
                </a>
              </div>
              <div className="space-y-2">
                {vendorEarnings.map((v, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-800">{v.vendorName}</span>
                    <span className="font-medium text-teal-600">₹{v.total?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ErpLayout>
  );
}
