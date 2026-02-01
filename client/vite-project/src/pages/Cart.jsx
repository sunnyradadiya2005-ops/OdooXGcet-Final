import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'CUSTOMER') {
      navigate('/');
      return;
    }
    loadCart();
  }, [user, navigate]);

  const loadCart = () => {
    api.get('/cart')
      .then((r) => setItems(r.data))
      .catch((err) => {
        console.error('Cart Load Error:', err);
        setError(err.message || 'Failed to load cart');
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  const subtotal = items.reduce((s, i) => {
    const days = Math.ceil((new Date(i.endDate) - new Date(i.startDate)) / (1000 * 60 * 60 * 24)) || 1;
    const price = (i.product?.basePrice || 0) * days * i.quantity;
    return s + price;
  }, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax - couponDiscount;

  const handleUpdateQty = async (id, qty, maxStock) => {
    if (qty < 1) return;
    if (maxStock && qty > maxStock) {
      alert(`Only ${maxStock} items available in stock`);
      return;
    }
    try {
      await api.patch(`/cart/${id}`, { quantity: qty });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
      window.dispatchEvent(new Event('cartUpdated'));
    } catch { }
  };

  const handleRemove = async (id) => {
    try {
      await api.delete(`/cart/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      window.dispatchEvent(new Event('cartUpdated'));
    } catch { }
  };

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) return;
    try {
      const { data } = await api.post('/coupons/validate', {
        code: couponCode,
        amount: subtotal + tax,
      });
      setCouponDiscount(data.discount);
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Invalid coupon');
      setCouponDiscount(0);
    }
  };

  const handlePlaceOrder = async (deliveryMethod, deliveryAddress, billingAddress) => {
    try {
      const { data } = await api.post('/orders/from-cart', {
        deliveryMethod: deliveryMethod || 'standard',
        deliveryAddress,
        billingAddress,
        couponCode: couponDiscount > 0 ? couponCode : undefined,
      });
      setItems([]);
      setCheckoutModal(false);
      window.dispatchEvent(new Event('cartUpdated'));
      if (data.orders?.length) {
        navigate(`/orders/${data.orders[0].id}/checkout`);
      } else {
        navigate('/orders');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Checkout failed');
    }
  };

  if (!user) return null;
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">Looks like you haven't added any rental items yet.</p>
            <Link to="/shop" className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-lg shadow-teal-500/20">
              Start Browsing
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items List */}
            <div className="flex-1 space-y-4">
               {error && (
                 <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center gap-2">
                   <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   {error}
                 </div>
               )}
               
              {items.map((item) => {
                const days = Math.ceil((new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24)) || 1;
                const lineTotal = (item.product?.basePrice || 0) * days * item.quantity;
                const availableStock = item.product?.stockQty || 0;
                const isAtStockLimit = item.quantity >= availableStock;

                return (
                  <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row gap-6 transition-all hover:shadow-md">
                    <Link to={`/product/${item.product?.id}`} className="shrink-0">
                      <img
                        src={item.product?.images?.[0] || 'https://picsum.photos/150/150'}
                        alt={item.product?.name}
                        className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg bg-slate-100"
                      />
                    </Link>
                    
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link to={`/product/${item.product?.id}`} className="font-bold text-slate-900 text-lg hover:text-teal-600 transition-colors line-clamp-1">
                            {item.product?.name}
                          </Link>
                          <p className="text-sm text-slate-500 mb-2">{item.product?.vendor?.companyName}</p>
                        </div>
                        <button onClick={() => handleRemove(item.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 mb-4 flex flex-wrap gap-x-6 gap-y-2">
                         <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span>{new Date(item.startDate).toLocaleDateString()} — {new Date(item.endDate).toLocaleDateString()}</span>
                         </div>
                         <div className="font-medium text-slate-900">
                            {days} Day{days > 1 ? 's' : ''} Rental
                         </div>
                      </div>

                      <div className="mt-auto flex justify-between items-end">
                        <div className="flex items-center gap-3">
                           <div className="flex items-center border border-slate-300 rounded-lg bg-white h-9">
                              <button 
                                 onClick={() => handleUpdateQty(item.id, item.quantity - 1, availableStock)}
                                 className="w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                              >−</button>
                              <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                              <button 
                                 onClick={() => handleUpdateQty(item.id, item.quantity + 1, availableStock)}
                                 disabled={isAtStockLimit}
                                 className="w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                              >+</button>
                           </div>
                           {isAtStockLimit && <span className="text-xs text-orange-600 font-medium">Max stock</span>}
                        </div>
                        <div className="text-right">
                           <p className="text-xs text-slate-500 mb-0.5">₹{item.product?.basePrice} / day</p>
                           <p className="text-lg font-bold text-slate-900">₹{lineTotal.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Card */}
            <div className="lg:w-96 shrink-0">
               <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h3>
                  
                  {/* Coupon */}
                  <div className="mb-6">
                     <div className="flex gap-2 mb-2">
                        <input
                           type="text"
                           placeholder="Coupon Code"
                           value={couponCode}
                           onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                           className="flex-1 input-field py-2 text-sm uppercase"
                        />
                        <button 
                           onClick={handleApplyCoupon}
                           className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                        >
                           Apply
                        </button>
                     </div>
                     {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                     {couponDiscount > 0 && <p className="text-green-600 text-xs mt-1 font-medium">Coupon applied successfully!</p>}
                  </div>

                  <div className="space-y-3 pb-6 border-b border-slate-100 text-sm">
                     <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between text-slate-600">
                        <span>Tax (18% GST)</span>
                        <span>₹{tax.toLocaleString()}</span>
                     </div>
                     {couponDiscount > 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                           <span>Discount</span>
                           <span>−₹{couponDiscount.toLocaleString()}</span>
                        </div>
                     )}
                  </div>

                  <div className="flex justify-between items-center py-6">
                     <span className="text-base font-bold text-slate-900">Total Amount</span>
                     <span className="text-2xl font-bold text-teal-700">₹{total.toLocaleString()}</span>
                  </div>

                  <div className="space-y-3">
                     <button 
                        onClick={() => setCheckoutModal(true)}
                        className="w-full btn-primary py-3.5 shadow-lg shadow-teal-500/20 text-base"
                     >
                        Proceed to Checkout
                     </button>
                     <p className="text-xs text-center text-slate-400">
                        Safe & Secure Payment via Razorpay/Stripe
                     </p>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {checkoutModal && (
        <ExpressCheckoutModal
          onClose={() => setCheckoutModal(false)}
          onConfirm={handlePlaceOrder}
          total={total}
        />
      )}
    </div>
  );
}

function ExpressCheckoutModal({ onClose, onConfirm, total }) {
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [form, setForm] = useState({
    name: '',
    email: '',
    line1: '',
    city: '',
    zip: '',
    country: 'India',
  });
  const [useShippingForBilling, setUseShippingForBilling] = useState(true);
  const [billingForm, setBillingForm] = useState({
    name: '',
    email: '',
    line1: '',
    city: '',
    zip: '',
    country: 'India',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const deliveryAddress = { ...form, label: 'Shipping' };
      const billingAddress = useShippingForBilling
        ? { ...form, label: 'Billing' }
        : { ...billingForm, label: 'Billing' };

      await onConfirm(deliveryMethod, deliveryAddress, billingAddress);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-2xl font-bold text-slate-900">Express Checkout</h2>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shipping Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">Shipping Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    placeholder="John Doe"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field"
                    placeholder="john@example.com"
                  />
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Delivery Method</label>
              <div className="flex gap-4">
                 <label className={`flex-1 border rounded-lg p-3 cursor-pointer transition-all ${deliveryMethod === 'standard' ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" value="standard" checked={deliveryMethod === 'standard'} onChange={(e) => setDeliveryMethod(e.target.value)} className="sr-only" />
                    <div className="font-semibold text-slate-900 text-sm">Standard Delivery</div>
                    <div className="text-xs text-slate-500">Delivered to your address</div>
                 </label>
                 <label className={`flex-1 border rounded-lg p-3 cursor-pointer transition-all ${deliveryMethod === 'pickup' ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" value="pickup" checked={deliveryMethod === 'pickup'} onChange={(e) => setDeliveryMethod(e.target.value)} className="sr-only" />
                    <div className="font-semibold text-slate-900 text-sm">Pickup</div>
                    <div className="text-xs text-slate-500">Collect from store</div>
                 </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
              <input
                type="text"
                required
                value={form.line1}
                onChange={(e) => setForm({ ...form, line1: e.target.value })}
                className="input-field mb-2"
                placeholder="Street address, Apt, Suite"
              />
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="input-field"
                  placeholder="City"
                />
                <input
                  type="text"
                  required
                  value={form.zip}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })}
                  className="input-field"
                  placeholder="ZIP"
                />
              </div>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="input-field"
                placeholder="Country"
              />
            </div>
          </div>

          {/* Billing Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">Billing Details</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useShippingForBilling}
                onChange={(e) => setUseShippingForBilling(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-700">Same as shipping address</span>
            </label>

            {!useShippingForBilling && (
              <div className="space-y-4 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={billingForm.name}
                    onChange={(e) => setBillingForm({ ...billingForm, name: e.target.value })}
                    className="input-field"
                    placeholder="Billing Name"
                  />
                   <input
                    type="email"
                    required
                    value={billingForm.email}
                    onChange={(e) => setBillingForm({ ...billingForm, email: e.target.value })}
                    className="input-field"
                    placeholder="Billing Email"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={billingForm.line1}
                  onChange={(e) => setBillingForm({ ...billingForm, line1: e.target.value })}
                  className="input-field"
                  placeholder="Street Address"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" required value={billingForm.city} onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })} className="input-field" placeholder="City" />
                  <input type="text" required value={billingForm.zip} onChange={(e) => setBillingForm({ ...billingForm, zip: e.target.value })} className="input-field" placeholder="ZIP" />
                  <input type="text" value={billingForm.country} onChange={(e) => setBillingForm({ ...billingForm, country: e.target.value })} className="input-field" placeholder="Country" />
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100">
             <div className="flex justify-between items-center mb-6">
                <span className="text-slate-600 font-medium">Total Payable</span>
                <span className="text-2xl font-bold text-teal-700">₹{total.toLocaleString()}</span>
             </div>
             
             <div className="flex gap-4">
               <button
                 type="button"
                 onClick={onClose}
                 className="flex-1 py-3 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
               >
                 Cancel
               </button>
               <button
                 type="submit"
                 disabled={loading}
                 className="flex-1 btn-primary py-3 shadow-lg shadow-teal-500/20"
               >
                 {loading ? 'Processing...' : 'Confirm Order'}
               </button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
}
