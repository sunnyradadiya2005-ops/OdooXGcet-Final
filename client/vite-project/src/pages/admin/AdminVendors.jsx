import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import { Link } from 'react-router-dom';

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/vendors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVendors(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(v =>
    v.companyName.toLowerCase().includes(search.toLowerCase()) ||
    v.user.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading vendors...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
        <p className="text-gray-600 mt-1">Manage all vendors and their performance</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="search"
          placeholder="Search vendors by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Company</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Owner</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Email</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">GST</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Products</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Orders</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredVendors.map((vendor) => (
              <tr key={vendor.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{vendor.companyName}</div>
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {vendor.user.firstName} {vendor.user.lastName}
                </td>
                <td className="px-6 py-4 text-gray-700">{vendor.user.email}</td>
                <td className="px-6 py-4 text-gray-600 text-sm">{vendor.gstNumber || 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {vendor._count?.products || 0}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {vendor._count?.rentalOrders || 0}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link
                    to={`/admin/vendors/${vendor.id}`}
                    className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredVendors.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No vendors found
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
