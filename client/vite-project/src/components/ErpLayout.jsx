import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { path: '/erp', label: 'Orders' },
  { path: '/erp/products', label: 'Products' },
  { path: '/erp/invoices', label: 'Invoices' },
  { path: '/erp/customers', label: 'Customers' },
  { path: '/erp/reports', label: 'Reports' },
  { path: '/erp/settings', label: 'Settings' },
];

export default function ErpLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!user || !['ADMIN', 'VENDOR'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-base text-slate-600 mb-4">Access denied. Vendor or Admin only.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-slate-800 text-white shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <Link to="/erp" className="text-xl font-bold text-teal-400 hover:text-teal-300 transition-colors">
            KirayaKart ERP
          </Link>
          <p className="text-xs text-slate-400 mt-1">Management System</p>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname === item.path
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700 space-y-2">
          <div className="px-4 py-2">
            <div className="text-sm font-medium text-white">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {user.role}
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-left font-medium"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
