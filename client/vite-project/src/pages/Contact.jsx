export default function Contact() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Contact Us</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <p className="text-slate-600">
          <strong>Email:</strong> support@kirayakart.com
        </p>
        <p className="text-slate-600">
          <strong>Phone:</strong> +91 98765 43210
        </p>
        <p className="text-slate-600">
          <strong>Address:</strong> 123 Business Park, Mumbai, Maharashtra 400001
        </p>
        <p className="text-slate-500 text-sm mt-4">
          For customer support, vendor inquiries, or partnership opportunities, please reach out via
          email. We typically respond within 24 hours.
        </p>
      </div>
    </div>
  );
}
