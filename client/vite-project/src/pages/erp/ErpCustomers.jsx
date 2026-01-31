import ErpLayout from '../../components/ErpLayout';

export default function ErpCustomers() {
  return (
    <ErpLayout>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Customers</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        <p>Customer list - extend via API to fetch users with role CUSTOMER</p>
      </div>
    </ErpLayout>
  );
}
