export default function About() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">About KirayaKart</h1>
      <p className="text-slate-600 mb-4">
        KirayaKart is a full-stack rental management platform that connects customers with vendors
        for equipment, furniture, electronics, and more.
      </p>
      <p className="text-slate-600 mb-4">
        Our platform supports flexible rental periods, secure payments via Razorpay, and a
        comprehensive ERP for vendors and administrators.
      </p>
      <p className="text-slate-600">
        Built with React, Node.js, PostgreSQL, and modern best practices for a seamless rental
        experience.
      </p>
    </div>
  );
}
