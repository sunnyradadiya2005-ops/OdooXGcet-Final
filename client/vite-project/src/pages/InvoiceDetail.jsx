import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function InvoiceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        api
            .get(`/invoices/${id}`)
            .then((r) => setInvoice(r.data))
            .catch(() => setInvoice(null))
            .finally(() => setLoading(false));
    }, [id, user, navigate]);

    const handleDownloadPDF = async () => {
        try {
            const response = await api.get(`/invoices/${id}/pdf`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${invoice.invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Failed to download PDF');
        }
    };

    if (!user) return null;
    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12">
                <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
            </div>
        );
    }
    if (!invoice) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 text-center">
                <p className="text-slate-600">Invoice not found</p>
                <Link to="/invoices" className="text-teal-600 mt-2 inline-block">
                    Back to invoices
                </Link>
            </div>
        );
    }

    const remaining = Number(invoice.totalAmount) - Number(invoice.amountPaid);
    const canPay = remaining > 0 && ['POSTED', 'PARTIALLY_PAID'].includes(invoice.status);

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Invoice #{invoice.invoiceNumber}</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadPDF}
                        className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                        Download PDF
                    </button>
                    <Link to="/invoices" className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
                        Back
                    </Link>
                </div>
            </div>

            <div className="mb-4">
                <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${invoice.status === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'DRAFT'
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                >
                    {invoice.status.replace('_', ' ')}
                </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Bill To</h3>
                    <p className="font-medium text-slate-800">{invoice.customer?.firstName} {invoice.customer?.lastName}</p>
                    <p className="text-slate-600 text-sm mb-2">{invoice.customer?.email}</p>
                    {invoice.billingAddress ? (
                        <div className="text-sm text-slate-600 mt-2 pt-2 border-t">
                            <p>{invoice.billingAddress.line1}</p>
                            <p>{invoice.billingAddress.city}, {invoice.billingAddress.zip}</p>
                            <p>{invoice.billingAddress.country}</p>
                        </div>
                    ) : <p className="text-sm text-slate-500 mt-2">No billing address</p>}
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Ship To</h3>
                    {invoice.shippingAddress ? (
                        <div className="text-sm text-slate-600">
                            <p className="font-medium text-slate-800">{invoice.shippingAddress.name}</p>
                            <p>{invoice.shippingAddress.line1}</p>
                            <p>{invoice.shippingAddress.city}, {invoice.shippingAddress.zip}</p>
                            <p>{invoice.shippingAddress.country}</p>
                        </div>
                    ) : <p className="text-sm text-slate-500">Same as billing</p>}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Invoice Details</h3>
                    <p className="text-slate-600 text-sm mb-2">
                        Date: {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-slate-600 text-sm mb-2">
                        Order:{' '}
                        <Link to={`/orders/${invoice.order?.id}`} className="text-teal-600 hover:underline">
                            #{invoice.order?.orderNumber}
                        </Link>
                    </p>
                    {invoice.postedAt && (
                        <p className="text-slate-600 text-sm">
                            Posted: {new Date(invoice.postedAt).toLocaleDateString()}
                        </p>
                    )}
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Vendor</h3>
                    <p className="text-slate-600">{invoice.vendor?.companyName}</p>
                    <p className="text-slate-600 text-sm">GST: {invoice.vendor?.gstNumber}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
                <h3 className="font-semibold text-slate-800 mb-4">Line Items</h3>
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-slate-600 text-sm">
                            <th className="pb-2">Product</th>
                            <th className="pb-2">Qty</th>
                            <th className="pb-2">Period</th>
                            <th className="pb-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.order?.items?.map((item) => (
                            <tr key={item.id} className="border-t border-slate-100">
                                <td className="py-3">{item.product?.name}</td>
                                <td className="py-3">{item.quantity}</td>
                                <td className="py-3 text-sm text-slate-600">
                                    {new Date(item.startDate).toLocaleDateString()} –{' '}
                                    {new Date(item.endDate).toLocaleDateString()}
                                </td>
                                <td className="py-3 text-right">₹{Number(item.lineTotal).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-4 pt-4 border-t space-y-2 text-right">
                    <p className="text-slate-600">Subtotal: ₹{Number(invoice.subtotal).toFixed(2)}</p>
                    <p className="text-slate-600">Tax (18%): ₹{Number(invoice.taxAmount).toFixed(2)}</p>
                    {Number(invoice.securityDeposit) > 0 && (
                        <p className="text-slate-600">
                            Security Deposit: ₹{Number(invoice.securityDeposit).toFixed(2)}
                        </p>
                    )}
                    {Number(invoice.lateFee) > 0 && (
                        <p className="text-red-600">Late Fee: ₹{Number(invoice.lateFee).toFixed(2)}</p>
                    )}
                    <p className="font-bold text-lg">Total: ₹{Number(invoice.totalAmount).toFixed(2)}</p>
                    <p className="text-green-600">Paid: ₹{Number(invoice.amountPaid).toFixed(2)}</p>
                    {remaining > 0 && (
                        <p className="font-semibold text-amber-600">Balance Due: ₹{remaining.toFixed(2)}</p>
                    )}
                </div>
            </div>

            {
                canPay && (
                    <Link
                        to={`/orders/${invoice.order?.id}/checkout`}
                        className="block w-full py-3 bg-teal-600 text-white text-center rounded-lg hover:bg-teal-700"
                    >
                        Pay Now (₹{remaining.toFixed(2)})
                    </Link>
                )
            }
        </div >
    );
}
