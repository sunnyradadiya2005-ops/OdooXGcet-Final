import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import { Link } from 'react-router-dom';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      
      const res = await axios.get(`http://localhost:5000/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading orders...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600 mt-1">View all orders across all vendors (Read-only)</p>
        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            ℹ️ <strong>Note:</strong> Admins can only view orders. Vendors manage their own orders through the ERP.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="QUOTATION">Quotation</option>
          <option value="RENTAL_ORDER">Rental Order</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="RETURNED">Returned</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Order #</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Customer</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Vendor</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Items</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Total</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link to={`/admin/orders/${order.id}`} className="text-teal-600 hover:underline font-medium">
                    #{order.orderNumber}
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {order.customer.firstName} {order.customer.lastName}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {order.vendor.companyName}
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {order.items.length} items
                  </span>
                </td>
                <td className="px-6 py-4 font-medium">
                  ₹{Number(order.totalAmount).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No orders found
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function getStatusColor(status) {
  const colors = {
    QUOTATION: 'bg-purple-100 text-purple-700',
    RENTAL_ORDER: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-teal-100 text-teal-700',
    PICKED_UP: 'bg-amber-100 text-amber-700',
    RETURNED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}
