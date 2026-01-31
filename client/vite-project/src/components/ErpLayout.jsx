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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Access denied. Vendor or Admin only.</p>
        <button onClick={() => navigate('/')} className="ml-4 text-teal-600">
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 bg-slate-800 text-white shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <Link to="/erp" className="text-xl font-bold text-teal-400">
            KirayaKart ERP
          </Link>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded-lg ${
                location.pathname === item.path
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="text-sm text-slate-400 px-4">
            {user.firstName} {user.lastName}
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="mt-2 text-sm text-slate-400 hover:text-white"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
