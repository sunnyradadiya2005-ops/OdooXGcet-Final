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
    api
      .get('/cart')
      .then((r) => {
        console.log('Cart Items:', r.data);
        setItems(r.data);
      })
      .catch((err) => {
        console.error('Cart Load Error:', err);
        setError(err.message || 'Failed to load cart');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const subtotal = items.reduce((s, i) => {
    const days = Math.ceil((new Date(i.endDate) - new Date(i.startDate)) / (1000 * 60 * 60 * 24)) || 1;
    const price = (i.product?.basePrice || 0) * days * i.quantity;
    return s + price;
  }, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax - couponDiscount;

  const handleUpdateQty = async (id, qty) => {
    if (qty < 1) return;
    try {
      await api.patch(`/cart/${id}`, { quantity: qty });
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
      );
      // Trigger cart update event to refresh header badge
      window.dispatchEvent(new Event('cartUpdated'));
    } catch { }
  };

  const handleRemove = async (id) => {
    try {
      await api.delete(`/cart/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      // Trigger cart update event to refresh header badge
      window.dispatchEvent(new Event('cartUpdated'));
    } catch { }
  };

  const handleApplyCoupon = async () => {
    setCouponError('');
    try {
      const { data } = await api.post('/coupons/validate', {
        code: couponCode,
        amount: subtotal + tax,
      });
      setCouponDiscount(data.discount);
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Invalid coupon');
    }
  };

  const handleCheckout = () => {
    setCheckoutModal(true);
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
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Cart</h1>
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 border border-red-200">
          Error loading cart: {error}
        </div>
      )}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-600 mb-4">Your cart is empty</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {items.map((item) => {
              const days =
                Math.ceil((new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24)) || 1;
              const lineTotal = (item.product?.basePrice || 0) * days * item.quantity;
              return (
                <div
                  key={item.id}
                  className="flex gap-4 bg-white rounded-xl border border-slate-200 p-4"
                >
                  <img
                    src={item.product?.images?.[0] || 'https://picsum.photos/100/100'}
                    alt={item.product?.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-800">{item.product?.name}</h3>
                    <p className="text-sm text-slate-500">
                      {new Date(item.startDate).toLocaleDateString()} –{' '}
                      {new Date(item.endDate).toLocaleDateString()} ({days} day{days > 1 ? 's' : ''})
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      ₹{item.product?.basePrice}/day × {item.quantity} = ₹{lineTotal}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                      className="w-8 h-8 border rounded"
                    >
                      −
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                      className="w-8 h-8 border rounded"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <button
                onClick={handleApplyCoupon}
                className="px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50"
              >
                Apply
              </button>
            </div>
            {couponError && <p className="text-red-600 text-sm mb-2">{couponError}</p>}
            {couponDiscount > 0 && (
              <p className="text-green-600 text-sm mb-2">Discount: ₹{couponDiscount}</p>
            )}
            <div className="space-y-2 mb-4">
              <p className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </p>
              <p className="flex justify-between">
                <span>Tax (18%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </p>
              {couponDiscount > 0 && (
                <p className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>−₹{couponDiscount.toFixed(2)}</span>
                </p>
              )}
              <p className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                to="/"
                className="flex-1 text-center py-3 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Continue shopping
              </Link>
              <button
                onClick={handleCheckout}
                className="flex-1 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Checkout
              </button>
            </div>
          </div>

          {checkoutModal && (
            <ExpressCheckoutModal
              onClose={() => setCheckoutModal(false)}
              onConfirm={handlePlaceOrder}
              total={total}
            />
          )}
        </>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Express Checkout</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shipping Address Section */}
          <div>
            <h3 className="font-semibold text-slate-700 mb-2 border-b pb-1">Shipping Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Delivery method
                </label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="standard">Standard delivery</option>
                  <option value="pickup">Pickup from store</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg mb-2"
                  placeholder="Street address"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="px-4 py-2 border rounded-lg"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    required
                    value={form.zip}
                    onChange={(e) => setForm({ ...form, zip: e.target.value })}
                    className="px-4 py-2 border rounded-lg"
                    placeholder="ZIP"
                  />
                </div>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg mt-2"
                  placeholder="Country"
                />
              </div>
            </div>
          </div>

          {/* Billing Address Section */}
          <div className="pt-2">
            <h3 className="font-semibold text-slate-700 mb-2 border-b pb-1">Billing Details</h3>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="sameAsShipping"
                checked={useShippingForBilling}
                onChange={(e) => setUseShippingForBilling(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <label htmlFor="sameAsShipping" className="text-sm text-slate-700">
                Billing address is same as shipping address
              </label>
            </div>

            {!useShippingForBilling && (
              <div className="space-y-3 pl-2 border-l-2 border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Billing Name</label>
                  <input
                    type="text"
                    required
                    value={billingForm.name}
                    onChange={(e) => setBillingForm({ ...billingForm, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Billing Email</label>
                  <input
                    type="email"
                    required
                    value={billingForm.email}
                    onChange={(e) => setBillingForm({ ...billingForm, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Billing Address</label>
                  <input
                    type="text"
                    required
                    value={billingForm.line1}
                    onChange={(e) => setBillingForm({ ...billingForm, line1: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg mb-2"
                    placeholder="Street address"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={billingForm.city}
                      onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      required
                      value={billingForm.zip}
                      onChange={(e) => setBillingForm({ ...billingForm, zip: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                      placeholder="ZIP"
                    />
                  </div>
                  <input
                    type="text"
                    value={billingForm.country}
                    onChange={(e) => setBillingForm({ ...billingForm, country: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg mt-2"
                    placeholder="Country"
                  />
                </div>
              </div>
            )}
          </div>

          <p className="font-semibold text-lg pt-2 border-t text-right">Total: ₹{total.toFixed(2)}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              Proceed to payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
