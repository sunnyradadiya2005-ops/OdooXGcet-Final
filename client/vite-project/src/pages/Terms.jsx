export default function Terms() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Terms of Service</h1>
      <div className="prose prose-slate max-w-none">
        <p className="text-slate-600 mb-4">
          KirayaKart provides a rental management platform. By using our services, you agree to
          comply with these terms.
        </p>
        <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-2">1. Rental Agreement</h2>
        <p className="text-slate-600 mb-4">
          All rentals are subject to the terms agreed at checkout. Rental periods, pricing, and
          conditions are binding once the order is confirmed.
        </p>
        <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-2">2. Returns & Late Fees</h2>
        <p className="text-slate-600 mb-4">
          Items must be returned by the agreed end date. Late returns may incur additional fees as
          specified by the vendor.
        </p>
        <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-2">3. Cancellations</h2>
        <p className="text-slate-600 mb-4">
          Cancellation policies vary by vendor. Please contact the vendor for specific
          cancellation terms before placing an order.
        </p>
      </div>
    </div>
  );
}
