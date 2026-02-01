import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import ErpLayout from '../../components/ErpLayout';

export default function ErpInvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registerAmount, setRegisterAmount] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${id}`).then((r) => setInvoice(r.data)).catch(() => setInvoice(null)).finally(() => setLoading(false));
  }, [id]);

  const handlePost = async () => {
    try {
      await api.patch(`/invoices/${id}/post`);
      const r = await api.get(`/invoices/${id}`);
      setInvoice(r.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Post failed');
    }
  };

  const handleRegisterPayment = async () => {
    const amount = parseFloat(registerAmount);
    if (isNaN(amount) || amount <= 0) return;
    setRegistering(true);
    try {
      await api.post('/payments/register', { invoiceId: id, amount, method: 'cash' });
      const r = await api.get(`/invoices/${id}`);
      setInvoice(r.data);
      setRegisterAmount('');
    } catch (err) {
      alert(err.response?.data?.error || 'Payment registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/invoices/${id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download PDF');
    }
  };

  if (loading) return <ErpLayout><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></ErpLayout>;
  if (!invoice) return <ErpLayout><div className="text-slate-600">Invoice not found</div></ErpLayout>;

  const canPost = invoice.status === 'DRAFT';
  const canRegisterPayment = ['POSTED', 'PARTIALLY_PAID'].includes(invoice.status);
  const remaining = Number(invoice.totalAmount) - Number(invoice.amountPaid);

  return (
    <ErpLayout>
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Invoice #{invoice.invoiceNumber}</h1>
        <div className="flex gap-2">
          {canPost && (
            <button onClick={handlePost} className="px-4 py-2 bg-teal-600 text-white rounded-lg">
              Post
            </button>
          )}
          <button onClick={handleDownloadPDF} className="px-4 py-2 border rounded-lg hover:bg-slate-50 transition-colors">Print PDF</button>
        </div>
      </div>

      <div className="mb-4">
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
              invoice.status === 'DRAFT' ? 'bg-slate-100 text-slate-800' : 'bg-amber-100 text-amber-800'
            }`}
        >
          {invoice.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Customer</h3>
          <p className="text-slate-600 font-medium mb-1">{invoice.customer?.firstName} {invoice.customer?.lastName}</p>
          <p className="text-slate-600 text-sm mb-4">{invoice.customer?.email}</p>

          <div className="pt-4 border-t grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Billing</p>
              {invoice.billingAddress ? (
                <div className="text-xs text-slate-600">
                  <p>{invoice.billingAddress.line1}</p>
                  <p>{invoice.billingAddress.city}, {invoice.billingAddress.zip}</p>
                  <p>{invoice.billingAddress.country}</p>
                </div>
              ) : <p className="text-xs text-slate-400">N/A</p>}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Shipping</p>
              {invoice.shippingAddress ? (
                <div className="text-xs text-slate-600">
                  <p>{invoice.shippingAddress.line1}</p>
                  <p>{invoice.shippingAddress.city}, {invoice.shippingAddress.zip}</p>
                  <p>{invoice.shippingAddress.country}</p>
                </div>
              ) : <p className="text-xs text-slate-500">Same as billing</p>}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Order</h3>
          <Link to={`/erp/orders/${invoice.order?.id}`} className="text-teal-600 hover:underline">
            #{invoice.order?.orderNumber}
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="font-semibold text-slate-800 mb-4">Line Items</h3>
        <table className="w-full">
          <thead>
            <tr className="text-left text-slate-600 text-sm">
              <th className="pb-2">Product</th>
              <th className="pb-2">Qty</th>
              <th className="pb-2">Period</th>
              <th className="pb-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.order?.items?.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="py-3">{item.product?.name}</td>
                <td className="py-3">{item.quantity}</td>
                <td className="py-3 text-sm text-slate-600">
                  {new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}
                </td>
                <td className="py-3">₹{Number(item.lineTotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 pt-4 border-t space-y-2 text-right">
          <p className="text-slate-600">Subtotal: ₹{Number(invoice.subtotal).toFixed(2)}</p>
          <p className="text-slate-600">Tax: ₹{Number(invoice.taxAmount).toFixed(2)}</p>
          {Number(invoice.securityDeposit) > 0 && (
            <p className="text-blue-600 font-medium">Security Deposit (Refundable): ₹{Number(invoice.securityDeposit).toFixed(2)}</p>
          )}
          {Number(invoice.lateFee) > 0 && (
            <p className="text-red-600 font-medium">Late Fee: ₹{Number(invoice.lateFee).toFixed(2)}</p>
          )}
          <p className="font-bold text-lg pt-2 border-t">Total: ₹{Number(invoice.totalAmount).toFixed(2)}</p>
          <p className="text-green-600 font-medium">Paid: ₹{Number(invoice.amountPaid).toFixed(2)}</p>
          <p className="font-semibold text-lg">Remaining: ₹{remaining.toFixed(2)}</p>
        </div>
      </div>

      {/* Payment History */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">Payment History</h3>
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-600 text-sm">
                <th className="pb-2">Date</th>
                <th className="pb-2">Method</th>
                <th className="pb-2">Payment ID</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((payment) => (
                <tr key={payment.id} className="border-t border-slate-100">
                  <td className="py-3 text-sm">
                    {new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-sm capitalize">{payment.method}</td>
                  <td className="py-3 text-xs text-slate-500">
                    {payment.razorpayPaymentId || 'Manual'}
                  </td>
                  <td className="py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      payment.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium">₹{Number(payment.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canRegisterPayment && remaining > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Register Payment</h3>
          <div className="flex gap-4">
            <input
              type="number"
              placeholder="Amount"
              value={registerAmount}
              onChange={(e) => setRegisterAmount(e.target.value)}
              className="px-4 py-2 border rounded-lg w-32"
            />
            <button
              onClick={handleRegisterPayment}
              disabled={registering || !registerAmount}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              Register
            </button>
            <button
              onClick={() => setRegisterAmount(remaining.toFixed(2))}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Full Amount (₹{remaining.toFixed(2)})
            </button>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}
