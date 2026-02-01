import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [overviewRes, revenueRes, productsRes, vendorsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/analytics/overview', { headers }),
        axios.get('http://localhost:5000/api/analytics/revenue?period=month&limit=6', { headers }),
        axios.get('http://localhost:5000/api/analytics/products/top?limit=5', { headers }),
        axios.get('http://localhost:5000/api/analytics/vendors?limit=5', { headers }),
      ]);

      setOverview(overviewRes.data);
      setRevenue(revenueRes.data);
      setTopProducts(productsRes.data);
      setVendors(vendorsRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <KPICard
          title="Total Revenue"
          value={`₹${overview?.totalRevenue?.toLocaleString() || 0}`}
          icon="💰"
          color="bg-green-500"
        />
        <KPICard
          title="Total Orders"
          value={overview?.totalOrders || 0}
          icon="📦"
          color="bg-blue-500"
        />
        <KPICard
          title="Active Vendors"
          value={overview?.activeVendors || 0}
          icon="🏪"
          color="bg-purple-500"
        />
        <KPICard
          title="Active Customers"
          value={overview?.activeCustomers || 0}
          icon="👥"
          color="bg-orange-500"
        />
        <KPICard
          title="Products Listed"
          value={overview?.totalProducts || 0}
          icon="📋"
          color="bg-teal-500"
        />
        <KPICard
          title="Pending Returns"
          value={overview?.pendingReturns || 0}
          icon="⏰"
          color="bg-red-500"
        />
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Trend (Last 6 Months)</h2>
        <div className="h-64">
          <SimpleBarChart data={revenue} />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Products</h2>
          <div className="space-y-3">
            {topProducts.map((product, idx) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.rentalCount} rentals</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-teal-600">₹{product.totalRevenue.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Vendors */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Vendors</h2>
          <div className="space-y-3">
            {vendors.map((vendor, idx) => (
              <div key={vendor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                  <div>
                    <div className="font-medium text-gray-900">{vendor.companyName}</div>
                    <div className="text-sm text-gray-500">{vendor.orderCount} orders</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-teal-600">₹{vendor.totalRevenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Avg: ₹{vendor.avgOrderValue.toFixed(0)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function KPICard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SimpleBarChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400">No data available</div>;
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue));

  return (
    <div className="flex items-end justify-around h-full gap-2 px-4">
      {data.map((item, idx) => {
        const height = (item.revenue / maxRevenue) * 100;
        return (
          <div key={idx} className="flex flex-col items-center flex-1">
            <div className="text-xs font-semibold text-gray-700 mb-1">
              ₹{(item.revenue / 1000).toFixed(0)}k
            </div>
            <div
              className="w-full bg-teal-500 rounded-t-lg transition-all hover:bg-teal-600"
              style={{ height: `${height}%`, minHeight: '20px' }}
            />
            <div className="text-xs text-gray-600 mt-2">{item.period.slice(5)}</div>
          </div>
        );
      })}
    </div>
  );
}
