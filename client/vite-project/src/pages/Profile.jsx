import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function Profile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'CUSTOMER') {
            navigate('/');
            return;
        }

        // Fetch user profile data
        api.get('/users/me')
            .then((r) => setProfileData(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-600">Failed to load profile</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-4xl mx-auto px-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                            {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                {profileData.firstName} {profileData.lastName}
                            </h1>
                            <p className="text-lg text-slate-600">{profileData.email}</p>
                            <div className="mt-2">
                                <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                                    {profileData.role}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Information */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
                        Account Information
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">First Name</label>
                            <p className="text-base font-semibold text-slate-900">{profileData.firstName}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Last Name</label>
                            <p className="text-base font-semibold text-slate-900">{profileData.lastName}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Email Address</label>
                            <p className="text-base font-semibold text-slate-900">{profileData.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Account Type</label>
                            <p className="text-base font-semibold text-slate-900">{profileData.role}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Member Since</label>
                            <p className="text-base font-semibold text-slate-900">
                                {new Date(profileData.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Account Status</label>
                            <p className="text-base font-semibold text-green-600">Active</p>
                        </div>
                    </div>
                </div>

                {/* Additional Details */}
                {profileData.phone && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
                            Contact Information
                        </h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Phone Number</label>
                                <p className="text-base font-semibold text-slate-900">{profileData.phone || 'Not provided'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Address</label>
                                <p className="text-base font-semibold text-slate-900">{profileData.address || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Activity Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
                        Account Activity
                    </h2>
                    <div className="grid grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                            <p className="text-3xl font-bold text-teal-600 mb-2">{profileData.ordersCount ?? 0}</p>
                            <p className="text-sm text-slate-600">Total Orders</p>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                            <p className="text-3xl font-bold text-teal-600 mb-2">{profileData.activeRentalsCount ?? 0}</p>
                            <p className="text-sm text-slate-600">Active Rentals</p>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                            <p className="text-3xl font-bold text-teal-600 mb-2">{profileData.wishlistCount ?? 0}</p>
                            <p className="text-sm text-slate-600">Wishlist Items</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
