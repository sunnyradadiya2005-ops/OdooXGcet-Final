import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(window.Razorpay);
    document.body.appendChild(script);
  });
};

export default function OrderCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentMode, setPaymentMode] = useState('full'); // 'full' or 'partial'
  const [partialAmount, setPartialAmount] = useState('');
  const [minPayment, setMinPayment] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const orderRes = await api.get(`/orders/${id}`);
        const o = orderRes.data;
        if (cancelled) return;
        setOrder(o);
        let inv = null;
        try {
          const invRes = await api.get(`/invoices/by-order/${id}`);
          inv = invRes.data;
        } catch {
          const createRes = await api.post(`/invoices/from-order/${id}`);
          inv = createRes.data;
        }
        if (cancelled) return;
        setInvoice(inv);
        
        // Calculate minimum payment (50% by default)
        const remaining = Number(inv.totalAmount) - Number(inv.amountPaid);
        const minPmt = remaining * 0.5; // 50% minimum
        setMinPayment(minPmt);
        setPartialAmount(minPmt.toFixed(2));
      } catch (err) {
        if (!cancelled) navigate('/orders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id, user, navigate]);

  const totalAmount = invoice ? Number(invoice.totalAmount) - Number(invoice.amountPaid) : 0;
  const hasPartialPayment = invoice && Number(invoice.amountPaid) > 0; // Check if any payment already made
  const paymentAmount = paymentMode === 'full' ? totalAmount : parseFloat(partialAmount) || 0;

  const handlePay = async () => {
    if (totalAmount <= 0) {
      navigate(`/orders/${id}/confirmation`);
      return;
    }

    // Validate partial payment amount
    if (paymentMode === 'partial') {
      if (paymentAmount < minPayment) {
        alert(`Minimum payment required is ₹${minPayment.toFixed(2)}`);
        return;
      }
      if (paymentAmount > totalAmount) {
        alert(`Payment amount cannot exceed remaining balance of ₹${totalAmount.toFixed(2)}`);
        return;
      }
    }

    setPaying(true);
    try {
      const { data } = await api.post('/payments/create-order', {
        amount: paymentAmount,
        invoiceId: invoice.id,
        isPartialPayment: paymentMode === 'partial',
      });
      const Razorpay = await loadRazorpay();
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: 'KirayaKart',
        description: `Order ${order?.orderNumber}`,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              invoiceId: invoice.id,
              amount: data.amount,
            });
            navigate(`/orders/${id}/confirmation`);
          } catch (err) {
            alert('Payment verification failed');
          } finally {
            setPaying(false);
          }
        },
      };
      const rzp = new Razorpay(options);
      rzp.open();
      rzp.on('payment.failed', () => {
        setPaying(false);
        alert('Payment failed');
      });
      rzp.on('payment.cancel', () => {
        setPaying(false);
      });
    } catch (err) {
      alert(err.response?.data?.error || 'Payment initiation failed');
      setPaying(false);
    }
  };

  if (!user) return null;
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!order) return <div className="p-8 text-center">Order not found</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Payment</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Order summary</h2>
        <p className="text-slate-600">Order # {order.orderNumber}</p>
        <div className="mt-4 space-y-2">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.product?.name} × {item.quantity}</span>
              <span>₹{Number(item.lineTotal).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t space-y-2">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{Number(order.subtotal).toFixed(2)}</span>
          </p>
          <p className="flex justify-between">
            <span>Tax (18%)</span>
            <span>₹{Number(order.taxAmount).toFixed(2)}</span>
          </p>
          {Number(order.securityDeposit) > 0 && (
            <p className="flex justify-between text-blue-600">
              <span>Security Deposit (Refundable)</span>
              <span>₹{Number(order.securityDeposit).toFixed(2)}</span>
            </p>
          )}
          <p className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total Amount</span>
            <span>₹{Number(invoice?.totalAmount || 0).toFixed(2)}</span>
          </p>
          {Number(invoice?.amountPaid || 0) > 0 && (
            <p className="flex justify-between text-green-600">
              <span>Already Paid</span>
              <span>₹{Number(invoice.amountPaid).toFixed(2)}</span>
            </p>
          )}
          <p className="flex justify-between font-bold text-lg text-amber-600">
            <span>Amount Due</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {/* Payment Mode Selection */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="font-semibold text-slate-800 mb-4">Payment Options</h3>
        <div className="space-y-3">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
            <input
              type="radio"
              name="paymentMode"
              value="full"
              checked={paymentMode === 'full'}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="font-medium">Pay Full Amount</div>
              <div className="text-sm text-slate-600">₹{totalAmount.toFixed(2)}</div>
            </div>
          </label>
          <label className={`flex items-start p-3 border rounded-lg ${hasPartialPayment ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`}>
            <input
              type="radio"
              name="paymentMode"
              value="partial"
              checked={paymentMode === 'partial'}
              onChange={(e) => setPaymentMode(e.target.value)}
              disabled={hasPartialPayment}
              className="mr-3 mt-1"
            />
            <div className="flex-1">
              <div className="font-medium">Partial Payment</div>
              {hasPartialPayment ? (
                <div className="text-sm text-amber-600 font-medium">
                  Not available - Remaining balance must be paid in full
                </div>
              ) : (
                <>
                  <div className="text-sm text-slate-600 mb-2">
                    Minimum: ₹{minPayment.toFixed(2)} (50% of balance)
                  </div>
                  {paymentMode === 'partial' && (
                    <input
                      type="number"
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                      min={minPayment}
                      max={totalAmount}
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder={`Min: ₹${minPayment.toFixed(2)}`}
                    />
                  )}
                </>
              )}
            </div>
          </label>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-slate-600">Card payment via Razorpay</p>
        <p className="text-xs text-slate-500 mt-1">Test mode – use Razorpay test cards</p>
        {Number(order.securityDeposit) > 0 && (
          <p className="text-xs text-blue-600 mt-2">
            Note: Security deposit of ₹{Number(order.securityDeposit).toFixed(2)} will be refunded after successful return
          </p>
        )}
        {hasPartialPayment && (
          <p className="text-xs text-amber-600 mt-2 font-medium">
            ⚠️ A partial payment has been made. Remaining balance must be paid in full.
          </p>
        )}
      </div>
      <div className="flex gap-4">
        <Link
          to="/orders"
          className="flex-1 text-center py-3 border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Back to orders
        </Link>
        <button
          onClick={handlePay}
          disabled={paying}
          className="flex-1 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          {paying ? 'Processing...' : `Pay ₹${paymentAmount.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
