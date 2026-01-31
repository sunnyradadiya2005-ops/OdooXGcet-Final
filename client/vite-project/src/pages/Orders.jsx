import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'CUSTOMER') {
      navigate('/');
      return;
    }
    loadOrders();
  }, [user, navigate, search, statusFilter]);

  const loadOrders = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    api
      .get(`/orders?${params}`)
      .then((r) => setOrders(r.data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  if (!user) return null;

  const items = orders.orders || orders;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Orders</h1>
      <div className="flex gap-4 mb-6">
        <input
          type="search"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All statuses</option>
          <option value="QUOTATION">Quotation</option>
          <option value="RENTAL_ORDER">Rental Order</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="RETURNED">Returned</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      {loading ? (
        <div className="animate-pulse h-48 bg-slate-200 rounded-xl" />
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-600">No orders yet</p>
          <Link to="/" className="text-teal-600 mt-2 inline-block">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-slate-800">Order #{order.orderNumber}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString()} • {order.vendor?.companyName}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {order.items?.[0]?.product?.name}
                    {order.items?.length > 1 && ` +${order.items.length - 1} more`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-teal-600">₹{Number(order.totalAmount).toFixed(2)}</p>
                  <span
                    className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                      order.status === 'RETURNED'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
