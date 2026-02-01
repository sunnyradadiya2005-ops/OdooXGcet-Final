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
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input
                type="search"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm text-sm"
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
        </div>

        {loading ? (
          <div className="space-y-4">
             {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse h-24 bg-white rounded-xl border border-slate-200" />
             ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No orders found</h3>
            <p className="text-slate-500 mb-6">You haven't placed any orders yet.</p>
            <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="group block bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-teal-200 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                     <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 font-bold shrink-0">
                        #{order.orderNumber.slice(-3)}
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                           <h3 className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                              Order #{order.orderNumber}
                           </h3>
                           <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              order.status === 'RETURNED' ? 'bg-green-100 text-green-700' :
                              order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                           }`}>
                              {order.status.replace('_', ' ')}
                           </span>
                        </div>
                        <p className="text-sm text-slate-500">
                           {new Date(order.createdAt).toLocaleDateString()} • {order.items?.length || 0} items
                        </p>
                        <p className="text-sm font-medium text-slate-700 mt-1">
                           Vendor: {order.vendor?.companyName}
                        </p>
                     </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                     <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase font-semibold">Total Amount</p>
                        <p className="text-xl font-bold text-slate-900">₹{Number(order.totalAmount).toLocaleString()}</p>
                     </div>
                     <div className="text-slate-400 group-hover:translate-x-1 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                     </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
