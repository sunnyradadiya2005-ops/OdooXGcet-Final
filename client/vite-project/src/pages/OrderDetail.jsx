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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    api
      .get(`/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));

    api
      .get(`/invoices/by-order/${id}`)
      .then((r) => setInvoice(r.data))
      .catch(() => setInvoice(null));
  }, [id, user, navigate]);

  if (!user) return null;
  if (loading) {
     return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
           <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
        </div>
     );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
        <Link to="/orders" className="btn-primary">Back to Orders</Link>
      </div>
    );
  }

  const needsPayment =
    user.role === 'CUSTOMER' &&
    ['RENTAL_ORDER', 'CONFIRMED', 'PICKED_UP'].includes(order.status) &&
    (!invoice || (invoice && Number(invoice.amountPaid) < Number(invoice.totalAmount)));

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="container-custom max-w-4xl">
         {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
             <Link to="/orders" className="text-sm text-slate-500 hover:text-teal-600 mb-1 inline-flex items-center gap-1">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
               Back to my orders
             </Link>
             <h1 className="text-3xl font-bold text-slate-900">Order #{order.orderNumber}</h1>
          </div>
          
          <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${
             order.status === 'RETURNED' ? 'bg-green-50 text-green-700 border-green-200' :
             order.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' :
             order.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
             'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
             {order.status.replace('_', ' ')}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
           {/* Main Content */}
           <div className="md:col-span-2 space-y-6">
              {/* Items Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                 <h3 className="font-bold text-slate-900 mb-4 pb-4 border-b border-slate-100">Order Items</h3>
                 <div className="space-y-4">
                    {order.items?.map((item) => (
                       <div key={item.id} className="flex gap-4">
                          <img 
                             src={item.product?.images?.[0] || 'https://picsum.photos/100/100'} 
                             alt={item.product?.name} 
                             className="w-20 h-20 object-cover rounded-lg bg-slate-100"
                          />
                          <div className="flex-1">
                             <h4 className="font-semibold text-slate-800">{item.product?.name}</h4>
                             <p className="text-sm text-slate-500 mb-1">
                                {new Date(item.startDate).toLocaleDateString()} — {new Date(item.endDate).toLocaleDateString()}
                             </p>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded">Qty: {item.quantity}</span>
                                <span className="font-medium text-slate-900">₹{Number(item.lineTotal).toLocaleString()}</span>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Order Info Grid */}
              <div className="grid sm:grid-cols-2 gap-6">
                 {/* Shipping */}
                 <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">Shipping Address</h3>
                    {order.deliveryAddress ? (
                       <div className="text-sm text-slate-600 space-y-1">
                          <p className="font-medium text-slate-900">{order.deliveryAddress.name}</p>
                          <p>{order.deliveryAddress.line1}</p>
                          <p>{order.deliveryAddress.city}, {order.deliveryAddress.zip}</p>
                          <p>{order.deliveryAddress.country}</p>
                       </div>
                    ) : (
                       <p className="text-sm text-slate-400 italic">Not provided</p>
                    )}
                 </div>
                 
                 {/* Billing */}
                 <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">Billing Address</h3>
                    {order.billingAddress ? (
                       <div className="text-sm text-slate-600 space-y-1">
                          <p className="font-medium text-slate-900">{order.billingAddress.name}</p>
                          <p>{order.billingAddress.line1}</p>
                          <p>{order.billingAddress.city}, {order.billingAddress.zip}</p>
                          <p>{order.billingAddress.country}</p>
                       </div>
                    ) : (
                       <p className="text-sm text-slate-400 italic">Same as shipping</p>
                    )}
                 </div>
              </div>

              {/* Status Cards (Pickup, Return) */}
              {order.pickups?.[0] && (
                 <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5 flex gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                       <h4 className="font-bold text-amber-900">Pickup Confirmed</h4>
                       <p className="text-sm text-amber-800 mt-1">
                          Items were picked up on {new Date(order.pickups[0].pickedAt).toLocaleString()}
                       </p>
                       {order.pickups[0].notes && (
                          <p className="text-xs text-amber-700 mt-2 p-2 bg-amber-100/50 rounded block">Note: {order.pickups[0].notes}</p>
                       )}
                    </div>
                 </div>
              )}

              {order.returns?.[0] && (
                 <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 flex gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                       <h4 className="font-bold text-emerald-900">Return Completed</h4>
                       <p className="text-sm text-emerald-800 mt-1">
                          Items were returned on {new Date(order.returns[0].returnedAt).toLocaleString()}
                       </p>
                       {(Number(order.returns[0].lateFee) > 0 || Number(order.returns[0].damageFee) > 0) && (
                          <div className="mt-2 text-xs font-semibold text-red-600 bg-white/50 p-2 rounded border border-red-100">
                             {Number(order.returns[0].lateFee) > 0 && <span>Late Fee: ₹{Number(order.returns[0].lateFee)} </span>}
                             {Number(order.returns[0].damageFee) > 0 && <span>Damage Fee: ₹{Number(order.returns[0].damageFee)}</span>}
                          </div>
                       )}
                    </div>
                 </div>
              )}
           </div>

           {/* Sidebar Summary */}
           <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24">
                 <h3 className="font-bold text-slate-900 mb-4">Payment Summary</h3>
                 <div className="space-y-3 pb-6 border-b border-slate-100 text-sm">
                    <div className="flex justify-between text-slate-600">
                       <span>Subtotal</span>
                       <span>₹{Number(order.subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                       <span>Tax (18%)</span>
                       <span>₹{Number(order.taxAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-slate-900 pt-2">
                       <span>Total</span>
                       <span>₹{Number(order.totalAmount).toLocaleString()}</span>
                    </div>
                 </div>

                 {/* Invoice Section */}
                 {invoice ? (
                    <div className="mt-6">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-slate-500 uppercase">Invoice #{invoice.invoiceNumber}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${invoice.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                             {invoice.status}
                          </span>
                       </div>
                       <div className="bg-slate-50 rounded-lg p-3 text-sm mb-4">
                          <div className="flex justify-between mb-1">
                             <span className="text-slate-600">Paid so far:</span>
                             <span className="font-medium">₹{Number(invoice.amountPaid).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-slate-600">Remaining:</span>
                             <span className="font-bold text-teal-600">₹{(Number(invoice.totalAmount) - Number(invoice.amountPaid)).toLocaleString()}</span>
                          </div>
                       </div>
                       <Link to={`/invoices/${invoice.id}`} className="block w-full text-center py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                          View Invoice
                       </Link>
                    </div>
                 ) : (
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg text-center text-sm text-slate-500 italic">
                       Invoice will be generated shortly
                    </div>
                 )}

                 {/* Pay Button */}
                 {needsPayment && (
                    <Link
                       to={`/orders/${id}/checkout`}
                       className="mt-4 block w-full btn-primary text-center py-3 shadow-lg shadow-teal-500/20"
                    >
                       Pay Now
                    </Link>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
