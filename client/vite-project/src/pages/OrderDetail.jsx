import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    api
      .get(`/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch(() => setOrder(null));

    // Fetch invoice if exists
    api
      .get(`/invoices/by-order/${id}`)
      .then((r) => setInvoice(r.data))
      .catch(() => setInvoice(null));
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
            className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === 'RETURNED'
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

        <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-slate-700 mb-2">Shipping Address</h4>
            {order.deliveryAddress ? (
              <div className="text-sm text-slate-600">
                <p className="font-medium">{order.deliveryAddress.name}</p>
                <p>{order.deliveryAddress.line1}</p>
                <p>{order.deliveryAddress.city}, {order.deliveryAddress.zip}</p>
                <p>{order.deliveryAddress.country}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Not provided</p>
            )}
          </div>
          <div>
            <h4 className="font-medium text-slate-700 mb-2">Billing Address</h4>
            {order.billingAddress ? (
              <div className="text-sm text-slate-600">
                <p className="font-medium">{order.billingAddress.name}</p>
                <p>{order.billingAddress.line1}</p>
                <p>{order.billingAddress.city}, {order.billingAddress.zip}</p>
                <p>{order.billingAddress.country}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Same as shipping</p>
            )}
          </div>
        </div>
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

      {/* Invoice Status */}
      {
        invoice && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">Invoice</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${invoice.status === 'PAID'
                  ? 'bg-green-100 text-green-800'
                  : invoice.status === 'DRAFT'
                    ? 'bg-slate-100 text-slate-800'
                    : 'bg-amber-100 text-amber-800'
                  }`}
              >
                {invoice.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-slate-600 text-sm mb-2">Invoice #{invoice.invoiceNumber}</p>
            <p className="text-slate-600 text-sm mb-2">
              Total: ₹{Number(invoice.totalAmount).toFixed(2)}
            </p>
            <p className="text-slate-600 text-sm mb-4">
              Paid: ₹{Number(invoice.amountPaid).toFixed(2)}
            </p>
            <Link
              to={`/invoices/${invoice.id}`}
              className="text-teal-600 hover:underline text-sm"
            >
              View Invoice →
            </Link>
          </div>
        )
      }

      {/* Pickup Status */}
      {
        order?.pickups?.[0] && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-600 font-semibold">✓ Pickup Confirmed</span>
            </div>
            <p className="text-slate-600 text-sm">
              Picked up: {new Date(order.pickups[0].pickedAt).toLocaleString()}
            </p>
            {order.pickups[0].notes && (
              <p className="text-slate-600 text-sm mt-2">Notes: {order.pickups[0].notes}</p>
            )}
          </div>
        )
      }

      {/* Return Status */}
      {
        order?.returns?.[0] && (
          <div className="bg-green-50 rounded-xl border border-green-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-600 font-semibold">✓ Return Completed</span>
            </div>
            <p className="text-slate-600 text-sm">
              Returned: {new Date(order.returns[0].returnedAt).toLocaleString()}
            </p>
            {Number(order.returns[0].lateFee) > 0 && (
              <p className="text-red-600 text-sm mt-2">
                Late Fee: ₹{Number(order.returns[0].lateFee).toFixed(2)}
              </p>
            )}
            {Number(order.returns[0].damageFee) > 0 && (
              <p className="text-red-600 text-sm">
                Damage Fee: ₹{Number(order.returns[0].damageFee).toFixed(2)}
              </p>
            )}
            {order.returns[0].notes && (
              <p className="text-slate-600 text-sm mt-2">Notes: {order.returns[0].notes}</p>
            )}
          </div>
        )
      }
    </div >
  );
}
