import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import ErpLayout from '../../components/ErpLayout';

export default function ErpNewOrder() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    customerId: '',
    items: [{ productId: '', quantity: 1, startDate: '', endDate: '' }],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/products?limit=100').then((r) => setProducts(r.data.products || [])).catch(() => {});
    api.get('/users/customers').then((r) => setCustomers(r.data)).catch(() => {});
  }, []);

  const addLine = () => {
    setForm((f) => ({
      ...f,
      items: [...f.items, { productId: '', quantity: 1, startDate: '', endDate: '' }],
    }));
  };

  const updateLine = (i, field, value) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((item, j) => (j === i ? { ...item, [field]: value } : item)),
    }));
  };

  const removeLine = (i) => {
    if (form.items.length > 1) {
      setForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId || form.items.some((l) => !l.productId || !l.startDate || !l.endDate)) {
      alert('Fill required fields');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/orders', {
        customerId: form.customerId,
        items: form.items
          .filter((l) => l.productId)
          .map((l) => ({
            productId: l.productId,
            quantity: l.quantity || 1,
            startDate: l.startDate,
            endDate: l.endDate,
          })),
      });
      navigate(`/erp/orders/${data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErpLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">New Rental Order</h1>
        <Link to="/erp" className="text-teal-600 hover:underline">
          ← Back to Orders
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Customer</label>
          <select
            required
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} ({c.email})
              </option>
            ))}
          </select>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Order Lines</h3>
          {form.items.map((line, i) => (
            <div key={i} className="flex gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
              <select
                required
                value={line.productId}
                onChange={(e) => updateLine(i, 'productId', e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg"
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ₹{p.basePrice}/day
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={line.quantity}
                onChange={(e) => updateLine(i, 'quantity', parseInt(e.target.value, 10))}
                className="w-20 px-4 py-2 border rounded-lg"
              />
              <input
                type="date"
                required
                value={line.startDate}
                onChange={(e) => updateLine(i, 'startDate', e.target.value)}
                className="px-4 py-2 border rounded-lg"
              />
              <input
                type="date"
                required
                value={line.endDate}
                onChange={(e) => updateLine(i, 'endDate', e.target.value)}
                className="px-4 py-2 border rounded-lg"
              />
              <button type="button" onClick={() => removeLine(i)} className="text-red-600">
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addLine} className="text-teal-600 hover:underline">
            + Add line
          </button>
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Order'}
          </button>
          <Link to="/erp" className="px-6 py-2 border rounded-lg">
            Cancel
          </Link>
        </div>
      </form>
    </ErpLayout>
  );
}
