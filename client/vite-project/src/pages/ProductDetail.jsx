import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('18:00');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const [availableQty, setAvailableQty] = useState(0);

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((r) => {
        setProduct(r.data);
        setAvailableQty(r.data.stockQty);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!product || !startDate || !endDate) {
      setPrice(0);
      if (product) setAvailableQty(product.stockQty);
      return;
    }
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    if (end <= start) {
      setPrice(0);
      return;
    }

    // Check availability for selected dates
    api.get(`/products/${id}/availability?startDate=${start.toISOString()}&endDate=${end.toISOString()}`)
      .then((r) => {
        setAvailableQty(r.data.available);
        // If current quantity exceeds available, reset to 1 or available
        if (quantity > r.data.available) {
          setQuantity(Math.max(1, Math.min(quantity, r.data.available)));
        }
      })
      .catch((err) => console.error('Availability check failed:', err));

    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) || 1;

    let total = 0;
    if (product.hourlyRate && diffHours < 24) {
      total = product.hourlyRate * Math.ceil(diffHours);
    } else {
      total = product.basePrice * diffDays;
      if (product.rentalPeriods?.length) {
        const period = product.rentalPeriods.find((p) => p.days === diffDays);
        if (period) total = product.basePrice * Number(period.multiplier);
        else if (diffDays >= 7) total = product.basePrice * 5 * Math.ceil(diffDays / 7);
      }
    }
    setPrice(total * quantity);
  }, [product, startDate, startTime, endDate, endTime, quantity, id]);

  const handleAddToCart = async () => {
    if (!user) return navigate('/login');
    if (!startDate || !endDate) {
      setError('Please select rental dates');
      return;
    }
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    if (end <= start) {
      setError('End date must be after start date');
      return;
    }
    
    // Final availability check before adding
    try {
      const availRes = await api.get(`/products/${id}/availability?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      if (availRes.data.available < quantity) {
        setError(`Only ${availRes.data.available} units available for these dates`);
        setAvailableQty(availRes.data.available);
        return;
      }
    } catch (err) {
      console.error(err);
    }

    setError('');
    setAdding(true);
    try {
      await api.post('/cart', {
        productId: product.id,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        quantity,
      });
      // Trigger cart update event to refresh header badge
      window.dispatchEvent(new Event('cartUpdated'));
      navigate('/cart');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading || !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const datesValid = startDate && endDate;
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);
  const canAdd = datesValid && end > start && availableQty > 0;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minStart = new Date().toISOString().split('T')[0];
  const minEnd = startDate || minStart;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {product.images?.length ? (
            product.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`${product.name} ${i + 1}`}
                className="w-full aspect-square object-cover rounded-xl"
              />
            ))
          ) : (
            <div className="w-full aspect-square bg-slate-200 rounded-xl flex items-center justify-center">
              No image
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{product.name}</h1>
          <p className="text-slate-600 mt-1">{product.vendor?.companyName}</p>
          <p className="text-slate-700 mt-4">{product.description}</p>
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-lg font-semibold text-teal-600">
              ₹{product.basePrice}/day
              {product.hourlyRate && (
                <span className="text-slate-600 font-normal ml-2">• ₹{product.hourlyRate}/hr</span>
              )}
            </p>
            <p className="text-sm mt-2">
              {availableQty > 0 ? (
                <span className={availableQty <= 5 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                  ✓ {availableQty} units available {datesValid ? 'for selected dates' : '(Total Fleet)'}
                </span>
              ) : (
                <span className="text-red-600 font-medium">✗ Out of stock {datesValid ? 'for selected dates' : ''}</span>
              )}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rental start date & time
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  min={minStart}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-32 px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rental end date & time
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  min={minEnd}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-32 px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Quantity</label>
                <span className={`text-xs font-medium ${availableQty > 0 ? 'text-teal-600' : 'text-red-600'}`}>
                  {availableQty > 0 ? `${availableQty} items available` : 'Out of Stock'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={availableQty <= 0}
                  className="w-10 h-10 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(availableQty, quantity + 1))}
                  disabled={availableQty <= 0 || quantity >= availableQty}
                  className="w-10 h-10 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

            <div className="mt-8 p-4 bg-teal-50 rounded-lg">
              <p className="text-slate-700">
                Total: <span className="text-xl font-bold text-teal-600">₹{price}</span>
              </p>
            </div>

            {availableQty > 0 ? (
              <button
                onClick={handleAddToCart}
                disabled={!canAdd || adding}
                className="mt-6 w-full py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? 'Adding...' : canAdd ? 'Add to Cart' : datesValid ? 'Sold Out for dates' : 'Select dates to add to cart'}
              </button>
            ) : (
              <button
                disabled
                className="mt-6 w-full py-3 bg-red-50 text-red-600 border border-red-200 font-medium rounded-lg cursor-not-allowed"
              >
                Sold Out {datesValid ? 'for selected dates' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
