import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import ErpLayout from '../../components/ErpLayout';

export default function ErpInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    api
      .get(`/invoices?${params}`)
      .then((r) => setInvoices(r.data.invoices || []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <ErpLayout>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Invoices</h1>
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="POSTED">Posted</option>
          <option value="PAID">Paid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
        </select>
      </div>
      {loading ? (
        <div className="animate-pulse h-48 bg-slate-200 rounded-xl" />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-slate-700">Invoice #</th>
                <th className="text-left px-4 py-3 text-slate-700">Order</th>
                <th className="text-left px-4 py-3 text-slate-700">Customer</th>
                <th className="text-left px-4 py-3 text-slate-700">Total</th>
                <th className="text-left px-4 py-3 text-slate-700">Paid</th>
                <th className="text-left px-4 py-3 text-slate-700">Status</th>
                <th className="text-left px-4 py-3 text-slate-700"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-slate-200">
                  <td className="px-4 py-3">
                    <Link to={`/erp/invoices/${inv.id}`} className="text-teal-600 hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{inv.order?.orderNumber || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {inv.customer?.firstName} {inv.customer?.lastName}
                  </td>
                  <td className="px-4 py-3 font-medium">₹{Number(inv.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">₹{Number(inv.amountPaid).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        inv.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : inv.status === 'DRAFT'
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/erp/invoices/${inv.id}`} className="text-teal-600 text-sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && (
            <div className="p-8 text-center text-slate-500">No invoices found</div>
          )}
        </div>
      )}
    </ErpLayout>
  );
}
