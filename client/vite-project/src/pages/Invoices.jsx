import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Invoices() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'CUSTOMER') {
            navigate('/');
            return;
        }
        loadInvoices();
    }, [user, navigate, search, statusFilter]);

    const loadInvoices = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (statusFilter) params.set('status', statusFilter);
        api
            .get(`/invoices?${params}`)
            .then((r) => setInvoices(r.data.invoices || []))
            .catch(() => setInvoices([]))
            .finally(() => setLoading(false));
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">My Invoices</h1>
            <div className="flex gap-4 mb-6">
                <input
                    type="search"
                    placeholder="Search invoices..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg"
                >
                    <option value="">All statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="POSTED">Posted</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                    <option value="PAID">Paid</option>
                </select>
            </div>
            {loading ? (
                <div className="animate-pulse h-48 bg-slate-200 rounded-xl" />
            ) : invoices.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <p className="text-slate-600">No invoices yet</p>
                    <Link to="/orders" className="text-teal-600 mt-2 inline-block">
                        View orders
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {invoices.map((invoice) => {
                        const remaining = Number(invoice.totalAmount) - Number(invoice.amountPaid);
                        return (
                            <Link
                                key={invoice.id}
                                to={`/invoices/${invoice.id}`}
                                className="block bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-slate-800">Invoice #{invoice.invoiceNumber}</p>
                                        <p className="text-sm text-slate-500">
                                            {new Date(invoice.createdAt).toLocaleDateString()} • Order #{invoice.order?.orderNumber}
                                        </p>
                                        <p className="text-sm text-slate-600 mt-1">
                                            Paid: ₹{Number(invoice.amountPaid).toFixed(2)} / ₹{Number(invoice.totalAmount).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {remaining > 0 && (
                                            <p className="font-semibold text-amber-600 mb-1">
                                                Due: ₹{remaining.toFixed(2)}
                                            </p>
                                        )}
                                        <span
                                            className={`inline-block px-2 py-1 text-xs rounded-full ${invoice.status === 'PAID'
                                                    ? 'bg-green-100 text-green-800'
                                                    : invoice.status === 'DRAFT'
                                                        ? 'bg-slate-100 text-slate-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}
                                        >
                                            {invoice.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
