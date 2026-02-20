import { X } from '@phosphor-icons/react';
import useStore from '../../store/useStore';

export default function ComparisonModal() {
  const {
    comparisonModalOpen,
    closeComparisonModal,
    comparisonData,
    comparisonType // 'clientOffers' or 'ourOffers'
  } = useStore();

  if (!comparisonModalOpen || !comparisonData || comparisonData.length < 2) return null;

  const isClientOffers = comparisonType === 'clientOffers';
  const serviceType = comparisonData[0]?.serviceType || 'SMS';

  // Get all unique fields for comparison
  const getFields = () => {
    if (serviceType === 'SMS') {
      return isClientOffers
        ? ['designation', 'product', 'network', 'rate', 'traffic', 'display', 'tps', 'cap', 'hop']
        : ['designation', 'product', 'network', 'rate', 'traffic', 'display', 'tps', 'cap', 'hop'];
    } else {
      return isClientOffers
        ? ['destination', 'product', 'breakout', 'rate', 'billingIncrement', 'display', 'acd', 'asr', 'hop']
        : ['destination', 'product', 'breakout', 'rate', 'billingIncrement', 'display', 'acd', 'asr', 'hop'];
    }
  };

  const getHeaders = () => {
    if (serviceType === 'SMS') {
      return ['Designation', 'Product', 'Network', 'Rate', 'Traffic', 'Display', 'TPS', 'CAP', 'HOP'];
    } else {
      return ['Destination', 'Product', 'Breakout', 'Rate', 'Billing Inc.', 'Display', 'ACD', 'ASR', 'HOP'];
    }
  };

  const fields = getFields();
  const headers = getHeaders();

  // Check if values differ across items
  const isDifferent = (field) => {
    const values = comparisonData.map(item => item.offer?.[field] || item[field] || '-');
    return new Set(values).size > 1;
  };

  return (
    <div className="meeting-modal show" onClick={closeComparisonModal}>
      <div
        className="bg-white rounded-t-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-[#005461] to-[#0C7779]">
          <div>
            <h3 className="text-lg font-bold text-white">
              Compare {isClientOffers ? 'Client' : 'Our'} Offers
            </h3>
            <p className="text-xs text-white/70">
              Comparing {comparisonData.length} items | Differences highlighted in yellow
            </p>
          </div>
          <button
            onClick={closeComparisonModal}
            className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-auto max-h-[calc(90vh-120px)]">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                <th className="p-3 text-left font-semibold text-slate-600 border-b border-slate-200 min-w-[100px]">
                  Field
                </th>
                {comparisonData.map((item, idx) => (
                  <th
                    key={idx}
                    className="p-3 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[150px]"
                  >
                    <div className="text-xs text-[#3BC1A8] font-normal mb-1">
                      {item.companyName || `Item ${idx + 1}`}
                    </div>
                    {item.date && (
                      <div className="text-[10px] text-slate-400">{item.date}</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((field, fieldIdx) => {
                const different = isDifferent(field);
                return (
                  <tr
                    key={field}
                    className={`${different ? 'bg-amber-50' : ''} ${fieldIdx % 2 === 0 ? '' : 'bg-slate-50'}`}
                  >
                    <td className="p-3 font-medium text-slate-600 border-b border-slate-100">
                      {headers[fieldIdx]}
                      {different && (
                        <span className="ml-2 text-[10px] text-amber-600 font-normal">
                          (differs)
                        </span>
                      )}
                    </td>
                    {comparisonData.map((item, idx) => {
                      const value = item.offer?.[field] || item[field] || '-';
                      const isRate = field === 'rate';
                      return (
                        <td
                          key={idx}
                          className={`p-3 border-b border-slate-100 ${
                            isRate ? 'font-semibold text-emerald-600' : 'text-slate-700'
                          } ${different ? 'bg-amber-50' : ''}`}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={closeComparisonModal}
            className="w-full py-3 bg-[#3BC1A8] text-white rounded-xl font-semibold text-sm"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
