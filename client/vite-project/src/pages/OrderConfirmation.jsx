import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function OrderConfirmation() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!user) return;
    api
      .get(`/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch(() => setOrder(null));
  }, [id, user]);

  if (!user) return null;
  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-600">Order not found</p>
        <Link to="/orders" className="text-teal-600 mt-2 inline-block">
          View orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Thank you for your order!</h1>
        <p className="text-green-600 font-medium mb-2">Payment successful</p>
        <p className="text-slate-600 mb-6">Order #{order.orderNumber}</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            to={`/invoices?order=${order.id}`}
            className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Print invoice
          </Link>
          <Link
            to={`/orders/${order.id}`}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            View order details
          </Link>
        </div>
      </div>
    </div>
  );
}
