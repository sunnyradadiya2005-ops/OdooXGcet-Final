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

  const canPickup = order.status === 'CONFIRMED';
  const canReturn = order.status === 'PICKED_UP';
  const canCreateInvoice = ['PICKED_UP', 'RETURNED'].includes(order.status);
  const hasInvoice = order.invoices?.length > 0;

  return (
    <ErpLayout>
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Order #{order.orderNumber}</h1>
        <div className="flex gap-2">
          {order.status === 'QUOTATION' && (
            <button onClick={() => handleStatus('RENTAL_ORDER')} className="px-4 py-2 border rounded-lg">
              Convert to Order
            </button>
          )}
          {order.status === 'RENTAL_ORDER' && (
            <button onClick={() => handleStatus('CONFIRMED')} className="px-4 py-2 bg-teal-600 text-white rounded-lg">
              Confirm
            </button>
          )}
          {canPickup && (
            <button onClick={handlePickup} className="px-4 py-2 bg-amber-600 text-white rounded-lg">
              Confirm Pickup
            </button>
          )}
          {canReturn && (
            <button onClick={handleReturn} className="px-4 py-2 bg-green-600 text-white rounded-lg">
              Confirm Return
            </button>
          )}
          {canCreateInvoice && !hasInvoice && (
            <button onClick={createInvoice} className="px-4 py-2 bg-teal-600 text-white rounded-lg">
              Create Invoice
            </button>
          )}
          {hasInvoice && (
            <Link to={`/erp/invoices/${order.invoices[0].id}`} className="px-4 py-2 border rounded-lg">
              View Invoice
            </Link>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Customer</h3>
          <p className="text-slate-600">{order.customer?.firstName} {order.customer?.lastName}</p>
          <p className="text-slate-600 text-sm">{order.customer?.email}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Rental Period</h3>
          <p className="text-slate-600 text-sm">
            {order.items?.[0]?.startDate && new Date(order.items[0].startDate).toLocaleString()} –{' '}
            {order.items?.[0]?.endDate && new Date(order.items[0].endDate).toLocaleString()}
          </p>
        </div>
      </div>

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
