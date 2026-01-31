import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    api
      .get(`/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch(() => setOrder(null));
  }, [id, user, navigate]);

  if (!user) return null;
  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-600">Order not found</p>
        <Link to="/orders" className="text-teal-600 mt-2 inline-block">
          Back to orders
        </Link>
      </div>
    );
  }

  const needsPayment =
    user.role === 'CUSTOMER' &&
    ['RENTAL_ORDER', 'CONFIRMED', 'PICKED_UP'].includes(order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Order #{order.orderNumber}</h1>
        <Link to="/orders" className="text-teal-600 hover:underline">
          ← Back to orders
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex justify-between mb-4">
          <span className="text-slate-600">Status</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              order.status === 'RETURNED'
                ? 'bg-green-100 text-green-800'
                : order.status === 'CANCELLED'
                ? 'bg-red-100 text-red-800'
                : 'bg-teal-100 text-teal-800'
            }`}
          >
            {order.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-slate-600 text-sm mb-2">
          Date: {new Date(order.createdAt).toLocaleString()}
        </p>
        <p className="text-slate-600 text-sm mb-2">
          Vendor: {order.vendor?.companyName}
        </p>
        <div className="mt-6 pt-4 border-t">
          <h3 className="font-semibold text-slate-800 mb-3">Items</h3>
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="font-medium text-slate-800">{item.product?.name}</p>
                <p className="text-sm text-slate-500">
                  {new Date(item.startDate).toLocaleDateString()} –{' '}
                  {new Date(item.endDate).toLocaleDateString()} × {item.quantity}
                </p>
              </div>
              <p className="font-medium text-slate-800">₹{Number(item.lineTotal).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t space-y-2">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{Number(order.subtotal).toFixed(2)}</span>
          </p>
          <p className="flex justify-between">
            <span>Tax (18%)</span>
            <span>₹{Number(order.taxAmount).toFixed(2)}</span>
          </p>
          <p className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{Number(order.totalAmount).toFixed(2)}</span>
          </p>
        </div>
        {needsPayment && (
          <Link
            to={`/orders/${id}/checkout`}
            className="mt-6 block w-full py-3 bg-teal-600 text-white text-center rounded-lg hover:bg-teal-700"
          >
            Pay Now
          </Link>
        )}
      </div>
    </div>
  );
}
