import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Date & Time Selection
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('18:00');
  
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [availableQty, setAvailableQty] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);

  // Helper date calcs
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minStart = new Date().toISOString().split('T')[0];
  const minEnd = startDate || minStart;

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get(`/products/${id}`)
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
      return;
    }
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    
    if (end <= start) {
      setPrice(0);
      return;
    }

    // Check availability
    api.get(`/products/${id}/availability?startDate=${start.toISOString()}&endDate=${end.toISOString()}`)
      .then((r) => {
        setAvailableQty(r.data.available);
        if (quantity > r.data.available) {
          setQuantity(Math.max(1, r.data.available)); // Reset if requested > available
        }
      })
      .catch((err) => console.error('Availability check failed:', err));

    // Calculate Price
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
      setError('Please select rental dates first');
      return;
    }
    
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    
    if (end <= start) {
      setError('End date must be after start date');
      return;
    }
    
    setError('');
    setAdding(true);
    
    try {
      // Re-verify availability
      const availRes = await api.get(`/products/${id}/availability?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      if (availRes.data.available < quantity) {
        setError(`Only ${availRes.data.available} units available for these dates.`);
        setAvailableQty(availRes.data.available);
        setAdding(false);
        return;
      }

      await api.post('/cart', {
        productId: product.id,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        quantity,
      });
      
      window.dispatchEvent(new Event('cartUpdated'));
      navigate('/cart');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add to cart');
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-slate-500 mb-6">The item you are looking for might have been removed.</p>
        <Link to="/shop" className="btn-primary">Browse Shop</Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : ['https://picsum.photos/800/800'];
  const datesValid = startDate && endDate;
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);
  const canAdd = datesValid && end > start && availableQty > 0;

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="container-custom">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-slate-500 mb-8 overflow-x-auto whitespace-nowrap">
          <Link to="/shop" className="hover:text-teal-600 transition-colors">Marketplace</Link>
          <svg className="w-4 h-4 mx-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="font-medium text-slate-900 truncate">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left Column: Gallery & Details */}
          <div className="lg:col-span-2 space-y-10">
            {/* Gallery */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-4 relative group">
                <img 
                  src={images[selectedImage]} 
                  alt={product.name} 
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-20 h-20 shrink-0 rounded-lg border-2 overflow-hidden transition-all ${selectedImage === i ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-100 hover:border-teal-200'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description & Specs */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Product Overview</h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                <p>{product.description}</p>
                {/* Fallback description if empty */}
                {!product.description && <p>High-quality professional equipment maintained to the highest standards. Suitable for commercial and personal projects.</p>}
              </div>

              {/* Vendor Info */}
              <div className="mt-8 pt-8 border-t border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center text-teal-700 font-bold overflow-hidden">
                   {product.vendor?.logo ? <img src={product.vendor.logo} className="w-full h-full object-cover" /> : product.vendor?.companyName?.[0] || 'V'}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Provided by</p>
                  <h4 className="font-semibold text-slate-900">{product.vendor?.companyName || 'Verified Vendor'}</h4>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 shadow-lg p-6 space-y-6">
              <div>
                 <p className="text-sm text-slate-500 font-medium mb-1 pl-1">Daily Rate</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-slate-900">₹{product.basePrice}</span>
                    <span className="text-slate-500 font-medium">/ day</span>
                 </div>
                 {product.hourlyRate && (
                    <p className="text-sm text-teal-600 font-medium mt-1 pl-1">Also available at ₹{product.hourlyRate}/hr</p>
                 )}
              </div>

              {/* Availability Status */}
              <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${availableQty > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                 <span className={`w-2 h-2 rounded-full ${availableQty > 0 ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></span>
                 {availableQty > 0 ? `${availableQty} units available now` : 'Currently Out of Stock'}
              </div>

              {/* Date Selection */}
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                       <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Start Date</label>
                       <input 
                          type="date" 
                          min={minStart}
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="input-field text-sm py-2"
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Time</label>
                       <input 
                          type="time" 
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="input-field text-sm py-2"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                       <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">End Date</label>
                       <input 
                          type="date" 
                          min={minEnd}
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="input-field text-sm py-2"
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Time</label>
                       <input 
                          type="time" 
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="input-field text-sm py-2"
                       />
                    </div>
                 </div>

                 {/* Quantity */}
                 <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Quantity</label>
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden w-32">
                       <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-3 py-2 hover:bg-slate-50 text-slate-600 transition-colors"
                       >
                          -
                       </button>
                       <input 
                          type="text" 
                          value={quantity} 
                          readOnly 
                          className="w-full text-center py-2 text-slate-900 font-semibold focus:outline-none"
                       />
                       <button 
                          onClick={() => setQuantity(Math.min(availableQty, quantity + 1))}
                          disabled={quantity >= availableQty}
                          className="px-3 py-2 hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
                       >
                          +
                       </button>
                    </div>
                 </div>
              </div>

              {/* Total Calculation */}
              {price > 0 && (
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Total Cost:</span>
                    <span className="text-xl font-bold text-slate-900">₹{price.toFixed(2)}</span>
                 </div>
              )}

              {/* Action Button */}
              {error && (
                 <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg animate-in slide-in-from-top-1">
                    {error}
                 </div>
              )}

              <button
                 onClick={handleAddToCart}
                 disabled={adding || !canAdd || availableQty <= 0}
                 className="w-full btn-primary py-3.5 text-base shadow-lg shadow-teal-500/20"
              >
                 {adding ? (
                    <span className="flex items-center justify-center gap-2">
                       <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                       Processing...
                    </span>
                 ) : !datesValid ? (
                    'Select Dates' 
                 ) : availableQty <= 0 ? (
                    'Out of Stock'
                 ) : (
                    'Book Now'
                 )}
              </button>
              
              <p className="text-xs text-center text-slate-400">
                 Free cancellation up to 24 hours before pickup.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
