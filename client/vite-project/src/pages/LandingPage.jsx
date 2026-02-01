import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import Header from '../components/Header';

export default function LandingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect authenticated users
    useEffect(() => {
        if (user) {
            navigate(user.role === 'CUSTOMER' ? '/shop' : '/erp', { replace: true });
        }
    }, [user, navigate]);

    if (user) return null;

    return (
        <div className="min-h-screen bg-white">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="text-2xl font-bold text-teal-600 hover:text-teal-700 transition-colors">
                            KirayaKart
                        </Link>
                        <nav className="flex items-center gap-8">
                            <a href="#features" className="text-base text-slate-700 hover:text-teal-600 font-medium transition-colors">
                                Features
                            </a>
                            <a href="#how-it-works" className="text-base text-slate-700 hover:text-teal-600 font-medium transition-colors">
                                How It Works
                            </a>
                            <a href="#roles" className="text-base text-slate-700 hover:text-teal-600 font-medium transition-colors">
                                For Teams
                            </a>
                            <Link to="/contact" className="text-base text-slate-700 hover:text-teal-600 font-medium transition-colors">
                                Contact
                            </Link>
                            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200">
                                <Link
                                    to="/login"
                                    className="px-6 py-2 text-slate-700 font-medium hover:text-teal-600 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors shadow-sm"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h1 className="text-5xl font-bold text-slate-900 mb-6">
                        KirayaKart – Smart Rental Management Platform
                    </h1>
                    <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto">
                        Manage rentals, inventory, orders, and payments in one unified ERP system.
                        Built for businesses that need professional rental management.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            to="/register"
                            className="px-8 py-4 bg-teal-600 text-white text-lg font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-lg"
                        >
                            Get Started
                        </Link>
                        <Link
                            to="/login"
                            className="px-8 py-4 bg-white text-slate-700 text-lg font-semibold rounded-lg border-2 border-slate-300 hover:border-teal-600 hover:text-teal-600 transition-colors"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">Powerful Features</h2>
                        <p className="text-lg text-slate-600">Everything you need to manage your rental business</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 hover:shadow-lg transition-shadow">
                            <div className="w-14 h-14 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-3">Rental Lifecycle Management</h3>
                            <p className="text-slate-600">
                                Track every stage from quotation to pickup, rental period, return, and invoicing with complete visibility.
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 hover:shadow-lg transition-shadow">
                            <div className="w-14 h-14 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-3">Inventory & Reservations</h3>
                            <p className="text-slate-600">
                                Real-time stock tracking, reservation management, and availability checks to prevent double-bookings.
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 hover:shadow-lg transition-shadow">
                            <div className="w-14 h-14 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-3">Invoicing & Payments</h3>
                            <p className="text-slate-600">
                                Automated invoice generation, payment tracking, and financial reporting for complete transparency.
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 hover:shadow-lg transition-shadow">
                            <div className="w-14 h-14 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-3">Multi-Role Dashboards</h3>
                            <p className="text-slate-600">
                                Separate interfaces for customers, vendors, and admins with role-specific features and permissions.
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 hover:shadow-lg transition-shadow">
                            <div className="w-14 h-14 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-3">ERP-Style Reporting</h3>
                            <p className="text-slate-600">
                                Comprehensive analytics, revenue reports, and business insights to make data-driven decisions.
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 hover:shadow-lg transition-shadow">
                            <div className="w-14 h-14 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-3">Configurable Settings</h3>
                            <p className="text-slate-600">
                                Customize tax rates, late fees, company details, and system preferences to match your business needs.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
                        <p className="text-lg text-slate-600">Simple rental process from start to finish</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                1
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Browse Products</h3>
                            <p className="text-sm text-slate-600">
                                Explore available rental items with detailed descriptions and pricing
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                2
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Select Period</h3>
                            <p className="text-sm text-slate-600">
                                Choose rental dates and duration with real-time availability
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                3
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirm Order</h3>
                            <p className="text-sm text-slate-600">
                                Review quotation and confirm your rental order
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                4
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Pickup & Return</h3>
                            <p className="text-sm text-slate-600">
                                Collect your items and return them on schedule
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                5
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Invoice & Pay</h3>
                            <p className="text-sm text-slate-600">
                                Receive invoice and complete payment securely
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Role-Based Section */}
            <section id="roles" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">Built for Every Role</h2>
                        <p className="text-lg text-slate-600">Tailored experiences for customers, vendors, and administrators</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-xl p-8 border-2 border-slate-200 hover:border-teal-600 transition-colors">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">For Customers</h3>
                            <ul className="space-y-3 text-slate-600">
                                <li className="flex items-start">
                                    <span className="text-teal-600 mr-2">✓</span>
                                    <span>Browse and rent products easily</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-teal-600 mr-2">✓</span>
                                    <span>Track orders and rental status</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-teal-600 mr-2">✓</span>
                                    <span>View invoices and payment history</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-teal-600 mr-2">✓</span>
                                    <span>Manage wishlist and cart</span>
                                </li>
                            </ul>
                            <Link
                                to="/register"
                                className="mt-6 block text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                            >
                                Sign Up as Customer
                            </Link>
                        </div>

                        <div className="bg-white rounded-xl p-8 border-2 border-slate-200 hover:border-teal-600 transition-colors">
                            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">For Vendors</h3>
                            <ul className="space-y-3 text-slate-600">
                                <li className="flex items-start">
                                    <span className="text-teal-600 mr-2">✓</span>
                                    <span>Manage product inventory</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-teal-600 mr-2">✓</span>
                                    <span>Process rental orders</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-teal-600 mr-2">✓</span>
                                    <span>Track revenue and earnings</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-teal-600 mr-2">✓</span>
                                    <span>Generate reports and analytics</span>
                                </li>
                            </ul>
                            <Link
                                to="/register/vendor"
                                className="mt-6 block text-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors"
                            >
                                Become a Vendor
                            </Link>
                        </div>

                        <div className="bg-white rounded-xl p-8 border-2 border-slate-200 hover:border-teal-600 transition-colors">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">For Admins</h3>
                            <ul className="space-y-3 text-slate-600">
                                <li className="flex items-start">
                                    <span className="text-teal-600 mr-2">✓</span>
                                    <span>Full system control and oversight</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-teal-600 mr-2">✓</span>
                                    <span>Manage vendors and customers</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-teal-600 mr-2">✓</span>
                                    <span>Configure system settings</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-teal-600 mr-2">✓</span>
                                    <span>Access comprehensive reports</span>
                                </li>
                            </ul>
                            <div className="mt-6 block text-center px-6 py-3 bg-slate-100 text-slate-500 rounded-lg font-medium cursor-not-allowed">
                                Admin Access Only
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-teal-400 mb-4">KirayaKart</h3>
                            <p className="text-slate-400 text-sm">
                                Professional rental management platform for modern businesses.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><a href="#features" className="hover:text-teal-400 transition-colors">Features</a></li>
                                <li><a href="#how-it-works" className="hover:text-teal-400 transition-colors">How It Works</a></li>
                                <li><a href="#roles" className="hover:text-teal-400 transition-colors">For Teams</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><Link to="/about" className="hover:text-teal-400 transition-colors">About</Link></li>
                                <li><Link to="/contact" className="hover:text-teal-400 transition-colors">Contact</Link></li>
                                <li><Link to="/terms" className="hover:text-teal-400 transition-colors">Terms & Conditions</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Get Started</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><Link to="/login" className="hover:text-teal-400 transition-colors">Login</Link></li>
                                <li><Link to="/register" className="hover:text-teal-400 transition-colors">Sign Up</Link></li>
                                <li><Link to="/register/vendor" className="hover:text-teal-400 transition-colors">Become a Vendor</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
                        <p>&copy; 2026 KirayaKart. All rights reserved. Built for Odoo Hackathon.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
