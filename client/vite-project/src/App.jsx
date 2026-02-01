import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';

// Landing Page
import LandingPage from './pages/LandingPage';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterVendor from './pages/RegisterVendor';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Customer site
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import OrderCheckout from './pages/OrderCheckout';
import OrderConfirmation from './pages/OrderConfirmation';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Profile from './pages/Profile';
import Terms from './pages/Terms';
import About from './pages/About';
import Contact from './pages/Contact';

// ERP
import ErpDashboard from './pages/erp/ErpDashboard';
import ErpOrderDetail from './pages/erp/ErpOrderDetail';
import ErpNewOrder from './pages/erp/ErpNewOrder';
import ErpInvoices from './pages/erp/ErpInvoices';
import ErpInvoiceDetail from './pages/erp/ErpInvoiceDetail';
import ErpProducts from './pages/erp/ErpProducts';
import ErpProductForm from './pages/erp/ErpProductForm';
import ErpCustomers from './pages/erp/ErpCustomers';
import ErpReports from './pages/erp/ErpReports';
import ErpSettings from './pages/erp/ErpSettings';
import AdminSettings from './pages/admin/AdminSettings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReports from './pages/admin/AdminReports';
import AdminVendors from './pages/admin/AdminVendors';
import AdminProducts from './pages/admin/AdminProducts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProfile from './pages/admin/AdminProfile';
import VendorRoute from './components/VendorRoute';
import AdminRoute from './components/AdminRoute';

function CustomerLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="pt-28 pb-12">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/vendor" element={<RegisterVendor />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Customer Routes - Product Listing moved to /shop */}
          <Route
            path="/shop"
            element={
              <CustomerLayout>
                <Shop />
              </CustomerLayout>
            }
          />
          <Route
            path="/product/:id"
            element={
              <CustomerLayout>
                <ProductDetail />
              </CustomerLayout>
            }
          />
          <Route
            path="/cart"
            element={
              <CustomerLayout>
                <Cart />
              </CustomerLayout>
            }
          />
          <Route
            path="/wishlist"
            element={
              <CustomerLayout>
                <Wishlist />
              </CustomerLayout>
            }
          />
          <Route path="/orders" element={<CustomerLayout><Orders /></CustomerLayout>} />
          <Route path="/orders/:id" element={<CustomerLayout><OrderDetail /></CustomerLayout>} />
          <Route path="/orders/:id/checkout" element={<CustomerLayout><OrderCheckout /></CustomerLayout>} />
          <Route
            path="/orders/:id/confirmation"
            element={<CustomerLayout><OrderConfirmation /></CustomerLayout>}
          />
          <Route path="/invoices" element={<CustomerLayout><Invoices /></CustomerLayout>} />
          <Route path="/invoices/:id" element={<CustomerLayout><InvoiceDetail /></CustomerLayout>} />
          <Route path="/profile" element={<CustomerLayout><Profile /></CustomerLayout>} />
          <Route
            path="/terms"
            element={
              <CustomerLayout>
                <Terms />
              </CustomerLayout>
            }
          />
          <Route
            path="/about"
            element={
              <CustomerLayout>
                <About />
              </CustomerLayout>
            }
          />
          <Route
            path="/contact"
            element={
              <CustomerLayout>
                <Contact />
              </CustomerLayout>
            }
          />

          {/* ERP Routes - Vendor Only */}
          <Route path="/erp" element={<VendorRoute><ErpDashboard /></VendorRoute>} />
          <Route path="/erp/orders/new" element={<VendorRoute><ErpNewOrder /></VendorRoute>} />
          <Route path="/erp/orders/:id" element={<VendorRoute><ErpOrderDetail /></VendorRoute>} />
          <Route path="/erp/invoices" element={<VendorRoute><ErpInvoices /></VendorRoute>} />
          <Route path="/erp/invoices/:id" element={<VendorRoute><ErpInvoiceDetail /></VendorRoute>} />
          <Route path="/erp/products" element={<VendorRoute><ErpProducts /></VendorRoute>} />
          <Route path="/erp/products/new" element={<VendorRoute><ErpProductForm /></VendorRoute>} />
          <Route path="/erp/products/:id/edit" element={<VendorRoute><ErpProductForm /></VendorRoute>} />
          <Route path="/erp/customers" element={<VendorRoute><ErpCustomers /></VendorRoute>} />
          <Route path="/erp/reports" element={<VendorRoute><ErpReports /></VendorRoute>} />
          <Route path="/erp/settings" element={<VendorRoute><ErpSettings /></VendorRoute>} />
          <Route path="/erp/profile" element={<VendorRoute><ErpSettings /></VendorRoute>} />

          {/* Admin Routes - Admin Only */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/vendors" element={<AdminRoute><AdminVendors /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          <Route path="/admin/profile" element={<AdminRoute><AdminProfile /></AdminRoute>} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
