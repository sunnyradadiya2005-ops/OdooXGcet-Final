import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import ErpLayout from '../../components/ErpLayout';

const STATUS_COLUMNS = [
  'QUOTATION',
  'RENTAL_ORDER',
  'CONFIRMED',
  'PICKED_UP',
  'RETURNED',
  'CANCELLED',
];

export default function ErpDashboard() {
  const [view, setView] = useState('kanban');
  const [kanban, setKanban] = useState({});
  const [list, setList] = useState({ orders: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Fetch metrics
    api.get('/reports/dashboard-metrics')
      .then((r) => setMetrics(r.data))
      .catch(() => setMetrics(null));

    // Fetch orders
    if (view === 'kanban') {
      api.get('/orders/kanban').then((r) => setKanban(r.data)).catch(() => setKanban({}));
    } else {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      api.get(`/orders?${params}`).then((r) => setList(r.data)).catch(() => setList({}));
    }
    setLoading(false);
  }, [view, search, statusFilter]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (view === 'kanban') {
        const r = await api.get('/orders/kanban');
        setKanban(r.data);
      } else {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (statusFilter) params.set('status', statusFilter);
        const r = await api.get(`/orders?${params}`);
        setList(r.data);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update');
    }
  };

  const handlePickup = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/pickup`);
      const r = await api.get('/orders/kanban');
      setKanban(r.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Pickup failed');
    }
  };

  const handleReturn = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/return`);
      const r = await api.get('/orders/kanban');
      setKanban(r.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Return failed');
    }
  };

  return (
    <ErpLayout>
      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600 mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-teal-600">₹{metrics.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">This month</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600 mb-2">Total Orders</p>
            <p className="text-3xl font-bold text-slate-900">{metrics.totalOrders}</p>
            <p className="text-xs text-slate-500 mt-1">This month</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600 mb-2">Active Rentals</p>
            <p className="text-3xl font-bold text-amber-600">{metrics.activeRentals}</p>
            <p className="text-xs text-slate-500 mt-1">Currently rented</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600 mb-2">Pending Returns</p>
            <p className="text-3xl font-bold text-red-600">{metrics.pendingReturns}</p>
            <p className="text-xs text-slate-500 mt-1">Overdue</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setView('kanban')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${view === 'kanban'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${view === 'list'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
          >
            List
          </button>
        </div>
      </div>

      {view === 'list' && (
        <div className="flex gap-4 mb-6">
          <input
            type="search"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {STATUS_COLUMNS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {STATUS_COLUMNS.flatMap((col) => kanban[col] || []).map((order) => {
            // Status badge colors
            const statusColors = {
              QUOTATION: 'bg-purple-100 text-purple-700 border-purple-200',
              RENTAL_ORDER: 'bg-blue-100 text-blue-700 border-blue-200',
              CONFIRMED: 'bg-teal-100 text-teal-700 border-teal-200',
              PICKED_UP: 'bg-amber-100 text-amber-700 border-amber-200',
              RETURNED: 'bg-green-100 text-green-700 border-green-200',
              CANCELLED: 'bg-red-100 text-red-700 border-red-200',
            };

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
              >
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusColors[order.status] || 'bg-slate-100 text-slate-700'}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>

                <Link to={`/erp/orders/${order.id}`} className="block">
                  <p className="font-semibold text-sm text-slate-900 mb-1">
                    #{order.orderNumber}
                  </p>
                  <p className="text-sm text-slate-600 mb-2">
                    {order.customer?.firstName} {order.customer?.lastName}
                  </p>
                  <p className="text-base font-bold text-teal-600">
                    ₹{order.totalAmount?.toFixed?.() || Number(order.totalAmount).toFixed(2)}
                  </p>
                </Link>

                {/* Action Buttons */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {order.status === 'QUOTATION' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'RENTAL_ORDER')}
                      className="text-xs px-2 py-1 bg-slate-100 rounded hover:bg-slate-200"
                    >
                      To Order
                    </button>
                  )}
                  {order.status === 'RENTAL_ORDER' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'CONFIRMED')}
                      className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded hover:bg-teal-200"
                    >
                      Confirm
                    </button>
                  )}
                  {order.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handlePickup(order.id)}
                      className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                    >
                      Pickup
                    </button>
                  )}
                  {order.status === 'PICKED_UP' && (
                    <button
                      onClick={() => handleReturn(order.id)}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Return
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-slate-700">Order ID</th>
                <th className="text-left px-4 py-3 text-slate-700">Date</th>
                <th className="text-left px-4 py-3 text-slate-700">Customer</th>
                <th className="text-left px-4 py-3 text-slate-700">Product</th>
                <th className="text-left px-4 py-3 text-slate-700">Total</th>
                <th className="text-left px-4 py-3 text-slate-700">Status</th>
                <th className="text-left px-4 py-3 text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(list.orders || []).map((order) => (
                <tr key={order.id} className="border-t border-slate-200">
                  <td className="px-4 py-3">
                    <Link to={`/erp/orders/${order.id}`} className="text-teal-600 hover:underline">
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {order.customer?.firstName} {order.customer?.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {order.items?.[0]?.product?.name || '-'}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    ₹{Number(order.totalAmount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-100">
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/erp/orders/${order.id}`} className="text-teal-600 text-sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(list.orders || []).length === 0 && (
            <div className="p-8 text-center text-slate-500">No orders found</div>
          )}
        </div>
      )}
    </ErpLayout>
  );
}
