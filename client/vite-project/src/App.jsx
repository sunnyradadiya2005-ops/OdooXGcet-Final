import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterVendor from './pages/RegisterVendor';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Customer site
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import OrderCheckout from './pages/OrderCheckout';
import OrderConfirmation from './pages/OrderConfirmation';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
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

function CustomerLayout({ children }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/vendor" element={<RegisterVendor />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/"
            element={
              <CustomerLayout>
                <Home />
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

          <Route path="/erp" element={<ErpDashboard />} />
          <Route path="/erp/orders/new" element={<ErpNewOrder />} />
          <Route path="/erp/orders/:id" element={<ErpOrderDetail />} />
          <Route path="/erp/invoices" element={<ErpInvoices />} />
          <Route path="/erp/invoices/:id" element={<ErpInvoiceDetail />} />
          <Route path="/erp/products" element={<ErpProducts />} />
          <Route path="/erp/products/new" element={<ErpProductForm />} />
          <Route path="/erp/products/:id/edit" element={<ErpProductForm />} />
          <Route path="/erp/customers" element={<ErpCustomers />} />
          <Route path="/erp/reports" element={<ErpReports />} />
          <Route path="/erp/settings" element={<ErpSettings />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
