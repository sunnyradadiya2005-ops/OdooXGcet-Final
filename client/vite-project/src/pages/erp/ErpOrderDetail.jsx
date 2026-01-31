import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import ErpLayout from '../../components/ErpLayout';

export default function ErpOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`).then((r) => setOrder(r.data)).catch(() => setOrder(null)).finally(() => setLoading(false));
  }, [id]);

  const handleStatus = async (status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      const r = await api.get(`/orders/${id}`);
      setOrder(r.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handlePickup = async () => {
    try {
      await api.post(`/orders/${id}/pickup`);
      const r = await api.get(`/orders/${id}`);
      setOrder(r.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Pickup failed');
    }
  };

  const handleReturn = async () => {
    try {
      await api.post(`/orders/${id}/return`);
      const r = await api.get(`/orders/${id}`);
      setOrder(r.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Return failed');
    }
  };

  const createInvoice = async () => {
    try {
      const { data } = await api.post(`/invoices/from-order/${id}`);
      navigate(`/erp/invoices/${data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Invoice creation failed');
    }
  };

  if (loading) return <ErpLayout><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></ErpLayout>;
  if (!order) return <ErpLayout><div className="text-slate-600">Order not found</div></ErpLayout>;

  const canCreateInvoice = ['PICKED_UP', 'RETURNED'].includes(order.status);
  const hasInvoice = order.invoices?.length > 0;
  const isTerminalStatus = ['RETURNED', 'CANCELLED'].includes(order.status);

  return (
    <ErpLayout>
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Order #{order.orderNumber}</h1>
        {!isTerminalStatus && (
          <div className="flex gap-2">
            {order.status === 'QUOTATION' && (
              <button onClick={() => handleStatus('RENTAL_ORDER')} className="px-4 py-2 border rounded-lg hover:bg-slate-50">
                Convert to Order
              </button>
            )}
            {order.status === 'RENTAL_ORDER' && (
              <button onClick={() => handleStatus('CONFIRMED')} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                Confirm
              </button>
            )}
            {order.status === 'CONFIRMED' && (
              <button onClick={handlePickup} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                Confirm Pickup
              </button>
            )}
            {order.status === 'PICKED_UP' && (
              <button onClick={handleReturn} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Confirm Return
              </button>
            )}
          </div>
        )}
        {canCreateInvoice && !hasInvoice && (
          <button onClick={createInvoice} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
            Create Invoice
          </button>
        )}
        {hasInvoice && (
          <Link to={`/erp/invoices/${order.invoices[0].id}`} className="px-4 py-2 border rounded-lg hover:bg-slate-50">
            View Invoice
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Customer</h3>
          <p className="text-slate-600 font-medium mb-1">{order.customer?.firstName} {order.customer?.lastName}</p>
          <p className="text-slate-600 text-sm mb-4">{order.customer?.email}</p>

          <div className="pt-4 border-t grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Shipping</p>
              {order.deliveryAddress ? (
                <div className="text-xs text-slate-600">
                  <p>{order.deliveryAddress.line1}</p>
                  <p>{order.deliveryAddress.city}, {order.deliveryAddress.zip}</p>
                  <p>{order.deliveryAddress.country}</p>
                </div>
              ) : <p className="text-xs text-slate-400">N/A</p>}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Billing</p>
              {order.billingAddress ? (
                <div className="text-xs text-slate-600">
                  <p>{order.billingAddress.line1}</p>
                  <p>{order.billingAddress.city}, {order.billingAddress.zip}</p>
                  <p>{order.billingAddress.country}</p>
                </div>
              ) : <p className="text-xs text-slate-500">Same as shipping</p>}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Rental Period</h3>
          <p className="text-slate-600 text-sm">
            {order.items?.[0]?.startDate && new Date(order.items[0].startDate).toLocaleString()} –{' '}
            {order.items?.[0]?.endDate && new Date(order.items[0].endDate).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Pickup & Return Status */}
      {(order.pickups?.length > 0 || order.returns?.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {order.pickups?.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
              <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                ✓ Pickup Confirmed
              </h3>
              <p className="text-amber-700 text-sm">
                {new Date(order.pickups[0].pickedAt).toLocaleString()}
              </p>
              {order.pickups[0].notes && (
                <p className="text-amber-600 text-xs mt-2">Note: {order.pickups[0].notes}</p>
              )}
            </div>
          )}
          {order.returns?.length > 0 && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-6">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                ✓ Return Completed
              </h3>
              <p className="text-green-700 text-sm">
                {new Date(order.returns[0].returnedAt).toLocaleString()}
              </p>
              {Number(order.returns[0].lateFee) > 0 && (
                <p className="text-red-600 text-sm mt-2 font-medium">
                  Late Fee: ₹{Number(order.returns[0].lateFee).toFixed(2)}
                </p>
              )}
              {Number(order.returns[0].damageFee) > 0 && (
                <p className="text-red-600 text-sm mt-1 font-medium">
                  Damage Fee: ₹{Number(order.returns[0].damageFee).toFixed(2)}
                </p>
              )}
              {order.returns[0].notes && (
                <p className="text-green-600 text-xs mt-2">Note: {order.returns[0].notes}</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Order Lines</h3>
        <table className="w-full">
          <thead>
            <tr className="text-left text-slate-600 text-sm">
              <th className="pb-2">Product</th>
              <th className="pb-2">Qty</th>
              <th className="pb-2">Period</th>
              <th className="pb-2">Unit Price</th>
              <th className="pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="py-3">{item.product?.name}</td>
                <td className="py-3">{item.quantity}</td>
                <td className="py-3 text-sm text-slate-600">
                  {new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}
                </td>
                <td className="py-3">₹{Number(item.unitPrice).toFixed(2)}</td>
                <td className="py-3 font-medium">₹{Number(item.lineTotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 pt-4 border-t text-right space-y-2">
          <p className="text-slate-600">Subtotal: ₹{Number(order.subtotal).toFixed(2)}</p>
          <p className="text-slate-600">Tax: ₹{Number(order.taxAmount).toFixed(2)}</p>
          <p className="font-bold text-lg">Total: ₹{Number(order.totalAmount).toFixed(2)}</p>
        </div>
      </div>
    </ErpLayout>
  );
}
