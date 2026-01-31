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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [startDate, endDate, user?.role]);

  return (
    <ErpLayout>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Reports</h1>

      <div className="flex gap-4 mb-6">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      {loading ? (
        <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Total Revenue</h2>
            <p className="text-3xl font-bold text-teal-600">
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
            <h2 className="font-semibold text-slate-800 mb-4">Most Rented Products</h2>
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
              <h2 className="font-semibold text-slate-800 mb-4">Vendor Earnings</h2>
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
