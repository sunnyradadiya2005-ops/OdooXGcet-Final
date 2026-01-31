import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import ErpLayout from '../../components/ErpLayout';

export default function ErpProductForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({
        name: '',
        description: '',
        brand: '',
        categoryId: '',
        costPrice: '',
        basePrice: '',
        hourlyRate: '',
        stockQty: 1,
        images: [],
        isActive: true,
    });

    useEffect(() => {
        // Load categories
        api.get('/auth/categories').then((r) => setCategories(r.data || [])).catch(() => { });

        // Load product for edit
        if (id) {
            setLoading(true);
            api.get(`/products/${id}`)
                .then((r) => {
                    setForm({
                        name: r.data.name || '',
                        description: r.data.description || '',
                        brand: r.data.brand || '',
                        categoryId: r.data.categoryId || '',
                        costPrice: r.data.costPrice || '',
                        basePrice: r.data.basePrice || '',
                        hourlyRate: r.data.hourlyRate || '',
                        stockQty: r.data.stockQty || 1,
                        images: r.data.images || [],
                        isActive: r.data.isActive ?? true,
                    });
                })
                .catch(() => alert('Failed to load product'))
                .finally(() => setLoading(false));
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.basePrice) {
            alert('Name and base price are required');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...form,
                categoryId: null, // TODO: Implement proper category management with UUIDs
                costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
                basePrice: parseFloat(form.basePrice),
                hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : null,
                stockQty: parseInt(form.stockQty, 10) || 1,
            };

            if (id) {
                await api.patch(`/products/${id}`, payload);
                alert('Product updated successfully');
            } else {
                await api.post('/products', payload);
                alert('Product created successfully');
            }
            navigate('/erp/products');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    const addImage = () => {
        const url = prompt('Enter image URL:');
        if (url) setForm({ ...form, images: [...form.images, url] });
    };

    const removeImage = (idx) => {
        setForm({ ...form, images: form.images.filter((_, i) => i !== idx) });
    };

    if (loading && id) {
        return (
            <ErpLayout>
                <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
            </ErpLayout>
        );
    }

    return (
        <ErpLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">{id ? 'Edit Product' : 'New Product'}</h1>
                <Link to="/erp/products" className="text-teal-600 hover:underline">
                    ← Back to Products
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                            <input
                                type="text"
                                value={form.brand}
                                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select
                                value={form.categoryId}
                                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">Select category</option>
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.costPrice}
                                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                placeholder="Wholesale cost"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Base Price (₹/day) *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={form.basePrice}
                                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Hourly Rate (₹/hr)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.hourlyRate}
                                onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={form.stockQty}
                                onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <div className="flex items-center gap-3 h-[42px]">
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                    className="w-4 h-4 text-teal-600"
                                />
                                <span className="text-sm text-slate-700">Active (published)</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Images</label>
                        <div className="space-y-2">
                            {form.images.map((img, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={img}
                                        onChange={(e) => {
                                            const newImages = [...form.images];
                                            newImages[i] = e.target.value;
                                            setForm({ ...form, images: newImages });
                                        }}
                                        className="flex-1 px-4 py-2 border rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(i)}
                                        className="px-3 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addImage}
                                className="px-4 py-2 text-teal-600 border border-teal-600 rounded-lg hover:bg-teal-50"
                            >
                                + Add Image URL
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : id ? 'Update Product' : 'Create Product'}
                    </button>
                    <Link to="/erp/products" className="px-6 py-2 border rounded-lg">
                        Cancel
                    </Link>
                </div>
            </form>
        </ErpLayout>
    );
}
