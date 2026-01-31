import ErpLayout from '../../components/ErpLayout';

export default function ErpSettings() {
  return (
    <ErpLayout>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        <p>ERP settings - company profile, notifications, integrations</p>
      </div>
    </ErpLayout>
  );
}
