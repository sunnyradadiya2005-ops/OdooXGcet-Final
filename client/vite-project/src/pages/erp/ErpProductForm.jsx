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
        depositAmount: '',
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
                        depositAmount: r.data.depositAmount || '',
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
                depositAmount: form.depositAmount ? parseFloat(form.depositAmount) : 0,
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

    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await api.post('/products/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const imagePath = `http://localhost:5000${response.data.imagePath}`;
            setForm({ ...form, images: [...form.images, imagePath] });
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Security Deposit (₹/item)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.depositAmount}
                                onChange={(e) => setForm({ ...form, depositAmount: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                placeholder="Refundable deposit per item"
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
                        <label className="block text-sm font-medium text-slate-700 mb-2">Product Images</label>
                        
                        {/* Image Upload Button */}
                        <div className="mb-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploading}
                                className="hidden"
                                id="image-upload"
                            />
                            <label
                                htmlFor="image-upload"
                                className={`inline-flex items-center px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 cursor-pointer transition-colors ${
                                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {uploading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Upload Image
                                    </>
                                )}
                            </label>
                            <p className="text-xs text-slate-500 mt-1">Max 5MB • JPG, PNG, GIF, WebP</p>
                        </div>

                        {/* Image Previews */}
                        {form.images.length > 0 && (
                            <div className="grid grid-cols-3 gap-4">
                                {form.images.map((img, i) => (
                                    <div key={i} className="relative group">
                                        <img
                                            src={img}
                                            alt={`Product ${i + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        {i === 0 && (
                                            <span className="absolute bottom-2 left-2 bg-teal-600 text-white text-xs px-2 py-1 rounded">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
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
