import { useState, useMemo, useCallback } from 'react';
import {
  ChatText,
  Phone,
  Funnel,
  Export,
  Scales,
  CaretDown,
  CaretUp,
  X,
  Calendar,
  Globe,
  User,
  Envelope,
  DeviceMobile,
  Clock
} from '@phosphor-icons/react';
import useStore from '../../store/useStore';
import { SkeletonOffersList } from '../ui/Skeleton';

export default function OurOffersTab() {
  const {
    meetings,
    ourOffersServiceType,
    setOurOffersServiceType,
    openMeetingModal,
    data, // For resolving rate references
    exportOurOffersToExcel,
    openComparisonModal,
    initialLoading
  } = useStore();

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ company: '', region: '', date: '' });
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [expandedCards, setExpandedCards] = useState({});

  // Helper to resolve a linkedRate reference to full rate data - memoized
  const resolveRate = useCallback((linkedRate) => {
    if (!linkedRate) return null;

    // If it has fullData stored, use that
    if (linkedRate.fullData) {
      return linkedRate.fullData;
    }

    // If it has direct properties like designation/destination/rate, it's already resolved
    if (linkedRate.designation || linkedRate.destination || linkedRate.rate) {
      return linkedRate;
    }

    // Old format: resolve from data using key and index
    if (linkedRate.key && typeof linkedRate.index === 'number') {
      const rateData = data[linkedRate.key]?.[linkedRate.index];
      if (rateData) {
        // Parse the key to get serviceType and region
        const [serviceType, listType, region] = linkedRate.key.split('_');
        return {
          ...rateData,
          serviceType,
          listType,
          region
        };
      }
    }

    return linkedRate;
  }, [data]);

  // Get meetings with our offers (linked rates)
  // Filter by meeting.serviceType AND check if linkedRates array has items
  const offersData = useMemo(() => {
    return meetings
      .filter(m => {
        // Filter meetings by serviceType
        if ((m.serviceType || 'SMS') !== ourOffersServiceType) return false;
        const linkedRates = m.linkedRates || [];
        return Array.isArray(linkedRates) && linkedRates.length > 0;
      })
      .filter(m => {
        if (filters.company && !m.companyName?.toLowerCase().includes(filters.company.toLowerCase())) return false;
        if (filters.date && m.date !== filters.date) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [meetings, ourOffersServiceType, filters]);

  const formatDate = useCallback((dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const toggleExpand = useCallback((meetingId) => {
    setExpandedCards(prev => ({
      ...prev,
      [meetingId]: !prev[meetingId]
    }));
  }, []);

  const toggleComparison = useCallback((meetingId, rateIndex) => {
    const key = `${meetingId}_${rateIndex}`;
    setSelectedForComparison(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, key];
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ company: '', region: '', date: '' });
  }, []);

  const getCompanyInitials = useCallback((name) => {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }, []);

  // Handle show comparison
  const handleShowComparison = useCallback(() => {
    if (selectedForComparison.length < 2) return;

    const comparisonItems = selectedForComparison.map(key => {
      const [meetingId, rateIndex] = key.split('_');
      const meeting = offersData.find(m => m.id === meetingId);
      if (!meeting) return null;

      const linkedRate = meeting.linkedRates?.[parseInt(rateIndex)];
      if (!linkedRate) return null;

      const rate = resolveRate(linkedRate);
      if (!rate) return null;

      return {
        companyName: meeting.companyName,
        date: meeting.date,
        serviceType: ourOffersServiceType,
        offer: rate
      };
    }).filter(Boolean);

    if (comparisonItems.length >= 2) {
      openComparisonModal(comparisonItems, 'ourOffers');
      setComparisonMode(false);
      setSelectedForComparison([]);
    }
  }, [selectedForComparison, offersData, ourOffersServiceType, resolveRate, openComparisonModal]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        {/* Title & Actions */}
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Our Offers</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg ${showFilters ? 'bg-[#3BC1A8] text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              <Funnel size={18} />
            </button>
            <button
              onClick={() => setComparisonMode(!comparisonMode)}
              className={`p-2 rounded-lg ${comparisonMode ? 'bg-[#3BC1A8] text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              <Scales size={18} />
            </button>
            <button
              onClick={exportOurOffersToExcel}
              className="p-2 rounded-lg bg-[#3BC1A8] text-white"
              title="Export to Excel"
            >
              <Export size={18} />
            </button>
          </div>
        </div>

        {/* Service Type Toggle */}
        <div className="flex gap-2 p-3">
          {['SMS', 'VOICE'].map((type) => (
            <button
              key={type}
              onClick={() => setOurOffersServiceType(type)}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                ourOffersServiceType === type
                  ? 'bg-[#005461] text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {type === 'SMS' ? <ChatText size={16} /> : <Phone size={16} />}
              {type}
            </button>
          ))}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-3 bg-slate-50 border-t border-slate-100">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Filter by company..."
                value={filters.company}
                onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            {(filters.company || filters.date) && (
              <button
                onClick={clearFilters}
                className="text-xs text-[#3BC1A8] font-semibold flex items-center gap-1"
              >
                <X size={12} />
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Comparison Bar */}
        {comparisonMode && selectedForComparison.length > 0 && (
          <div className="p-3 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
            <span className="text-sm text-emerald-700">
              {selectedForComparison.length} selected for comparison
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedForComparison([])}
                className="px-3 py-1 bg-white text-slate-600 rounded-lg text-xs font-semibold"
              >
                Clear
              </button>
              <button
                onClick={handleShowComparison}
                className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                disabled={selectedForComparison.length < 2}
              >
                Compare
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Offers List */}
      <div className="flex-1 overflow-auto p-4">
        {initialLoading ? (
          <SkeletonOffersList />
        ) : offersData.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📤</span>
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">No Offers Sent</h3>
            <p className="text-sm text-slate-500">
              Linked rates from meetings will appear here
            </p>
          </div>
        ) : (
          offersData.map((meeting) => {
            const linkedRates = meeting.linkedRates || [];
            const isExpanded = expandedCards[meeting.id];

            return (
              <div key={meeting.id} className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden border border-slate-200">
                {/* Card Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleExpand(meeting.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="company-avatar">
                        {getCompanyInitials(meeting.companyName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{meeting.companyName}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            ourOffersServiceType === 'SMS'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {ourOffersServiceType}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">
                        {linkedRates.length} rates
                      </span>
                      {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                    </div>
                  </div>

                  {/* Company Details Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Calendar size={12} className="text-emerald-600" />
                      <span>{formatDate(meeting.date)}</span>
                    </div>
                    {meeting.strongRegion && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Globe size={12} className="text-emerald-600" />
                        <span><strong>Region:</strong> {meeting.strongRegion}</span>
                      </div>
                    )}
                    {meeting.contactPerson && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <User size={12} className="text-emerald-600" />
                        <span>{meeting.contactPerson}</span>
                      </div>
                    )}
                    {meeting.email && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Envelope size={12} className="text-emerald-600" />
                        <span className="text-emerald-600">{meeting.email}</span>
                      </div>
                    )}
                    {meeting.phone && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <DeviceMobile size={12} className="text-emerald-600" />
                        <span className="text-emerald-600">{meeting.phone}</span>
                      </div>
                    )}
                    {meeting.scheduledBy && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock size={12} className="text-emerald-600" />
                        <span>Scheduled by: {meeting.scheduledBy}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rates Table */}
                {isExpanded && linkedRates.length > 0 && (
                  <div className="border-t border-slate-100 overflow-x-auto">
                    <table className="linked-rates-table">
                      <thead>
                        <tr>
                          {comparisonMode && <th className="w-10"></th>}
                          <th>Type</th>
                          <th>Region</th>
                          <th>{ourOffersServiceType === 'SMS' ? 'Designation' : 'Destination'}</th>
                          <th>Product</th>
                          <th>Rate</th>
                          {ourOffersServiceType === 'SMS' ? (
                            <>
                              <th>Network</th>
                              <th>Traffic</th>
                            </>
                          ) : (
                            <>
                              <th>Breakout</th>
                              <th>Billing</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {linkedRates.map((linkedRate, idx) => {
                          const rate = resolveRate(linkedRate);
                          if (!rate) return null;

                          return (
                            <tr key={idx}>
                              {comparisonMode && (
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={selectedForComparison.includes(`${meeting.id}_${idx}`)}
                                    onChange={() => toggleComparison(meeting.id, idx)}
                                  />
                                </td>
                              )}
                              <td>
                                <span className={`rate-type-badge ${(rate.serviceType || ourOffersServiceType)?.toLowerCase()}`}>
                                  {rate.serviceType || ourOffersServiceType}
                                </span>
                              </td>
                              <td>{rate.region || '-'}</td>
                              <td>{rate.designation || rate.destination || '-'}</td>
                              <td>{rate.product || '-'}</td>
                              <td className="font-semibold text-emerald-600">{rate.rate || '-'}</td>
                              {ourOffersServiceType === 'SMS' ? (
                                <>
                                  <td>{rate.network || '-'}</td>
                                  <td>{rate.traffic || '-'}</td>
                                </>
                              ) : (
                                <>
                                  <td>{rate.breakout || '-'}</td>
                                  <td>{rate.billingIncrement || '-'}</td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Card Footer */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={() => openMeetingModal(meeting.id)}
                    className="text-xs text-[#3BC1A8] font-semibold"
                  >
                    View Meeting Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-white border-t border-slate-200">
        <span className="text-xs text-slate-500">
          {offersData.length} meetings with {ourOffersServiceType} offers
        </span>
      </div>
    </div>
  );
}
