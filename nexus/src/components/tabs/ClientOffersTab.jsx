import { useState, useMemo } from 'react';
import {
  ChatText,
  Phone,
  Funnel,
  Export,
  Scales,
  CaretDown,
  CaretUp,
  X,
  MagnifyingGlass
} from '@phosphor-icons/react';
import useStore from '../../store/useStore';
import { SkeletonOffersList } from '../ui/Skeleton';

export default function ClientOffersTab() {
  const {
    meetings,
    clientOffersServiceType,
    setClientOffersServiceType,
    openMeetingModal,
    exportClientOffersToExcel,
    openComparisonModal,
    initialLoading
  } = useStore();

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filters, setFilters] = useState({
    designation: '',
    product: '',
    network: '',
    rate: '',
    traffic: '',
    display: '',
    tps: '',
    cap: '',
    hop: ''
  });
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [expandedCards, setExpandedCards] = useState({});

  // Collect all unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const options = {
      designations: new Set(),
      products: new Set(),
      networks: new Set(),
      rates: new Set(),
      traffics: new Set(),
      displays: new Set(),
      tpss: new Set(),
      caps: new Set(),
      hops: new Set()
    };

    meetings.forEach(m => {
      if ((m.serviceType || 'SMS') !== clientOffersServiceType) return;
      if (!m.clientOffers || !Array.isArray(m.clientOffers)) return;

      m.clientOffers.forEach(offer => {
        if (clientOffersServiceType === 'SMS') {
          if (offer.designation) options.designations.add(offer.designation);
          if (offer.product) options.products.add(offer.product);
          if (offer.network) options.networks.add(offer.network);
          if (offer.rate) options.rates.add(offer.rate);
          if (offer.traffic) options.traffics.add(offer.traffic);
          if (offer.display) options.displays.add(offer.display);
          if (offer.tps) options.tpss.add(offer.tps);
          if (offer.cap) options.caps.add(offer.cap);
          if (offer.hop) options.hops.add(offer.hop);
        } else {
          if (offer.destination) options.designations.add(offer.destination);
          if (offer.product) options.products.add(offer.product);
          if (offer.breakout) options.networks.add(offer.breakout);
          if (offer.rate) options.rates.add(offer.rate);
          if (offer.billingIncrement) options.traffics.add(offer.billingIncrement);
          if (offer.display) options.displays.add(offer.display);
          if (offer.acd) options.tpss.add(offer.acd);
          if (offer.asr) options.caps.add(offer.asr);
          if (offer.hop) options.hops.add(offer.hop);
        }
      });
    });

    return options;
  }, [meetings, clientOffersServiceType]);

  // Get filtered offers data
  const offersData = useMemo(() => {
    const hasAnyFilter = searchTerm || dateFrom || dateTo ||
      Object.values(filters).some(v => v);

    return meetings
      .filter(m => {
        if ((m.serviceType || 'SMS') !== clientOffersServiceType) return false;
        const offers = m.clientOffers || [];
        if (!Array.isArray(offers) || offers.length === 0) return false;

        // Search filter
        if (searchTerm && !m.companyName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;

        // Date range filter
        if (dateFrom && m.date < dateFrom) return false;
        if (dateTo && m.date > dateTo) return false;

        // Column filters - check if any offer matches
        if (hasAnyFilter) {
          const hasMatch = offers.some(offer => {
            if (clientOffersServiceType === 'SMS') {
              if (filters.designation && offer.designation !== filters.designation) return false;
              if (filters.product && offer.product !== filters.product) return false;
              if (filters.network && offer.network !== filters.network) return false;
              if (filters.rate && offer.rate !== filters.rate) return false;
              if (filters.traffic && offer.traffic !== filters.traffic) return false;
              if (filters.display && offer.display !== filters.display) return false;
              if (filters.tps && offer.tps !== filters.tps) return false;
              if (filters.cap && offer.cap !== filters.cap) return false;
              if (filters.hop && offer.hop !== filters.hop) return false;
            } else {
              if (filters.designation && offer.destination !== filters.designation) return false;
              if (filters.product && offer.product !== filters.product) return false;
              if (filters.network && offer.breakout !== filters.network) return false;
              if (filters.rate && offer.rate !== filters.rate) return false;
              if (filters.traffic && offer.billingIncrement !== filters.traffic) return false;
              if (filters.display && offer.display !== filters.display) return false;
              if (filters.tps && offer.acd !== filters.tps) return false;
              if (filters.cap && offer.asr !== filters.cap) return false;
              if (filters.hop && offer.hop !== filters.hop) return false;
            }
            return true;
          });
          if (!hasMatch) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [meetings, clientOffersServiceType, searchTerm, dateFrom, dateTo, filters]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const toggleExpand = (meetingId) => {
    setExpandedCards(prev => ({
      ...prev,
      [meetingId]: !prev[meetingId]
    }));
  };

  const toggleComparison = (meetingId, offerIndex) => {
    const key = `${meetingId}_${offerIndex}`;
    setSelectedForComparison(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, key];
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setFilters({
      designation: '',
      product: '',
      network: '',
      rate: '',
      traffic: '',
      display: '',
      tps: '',
      cap: '',
      hop: ''
    });
  };

  const hasAnyFilter = searchTerm || dateFrom || dateTo || Object.values(filters).some(v => v);

  const getCompanyInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  // Handle show comparison
  const handleShowComparison = () => {
    if (selectedForComparison.length < 2) return;

    const comparisonItems = selectedForComparison.map(key => {
      const [meetingId, offerIndex] = key.split('_');
      const meeting = offersData.find(m => m.id === meetingId);
      if (!meeting) return null;

      const offer = meeting.clientOffers?.[parseInt(offerIndex)];
      if (!offer) return null;

      return {
        companyName: meeting.companyName,
        date: meeting.date,
        serviceType: clientOffersServiceType,
        offer
      };
    }).filter(Boolean);

    if (comparisonItems.length >= 2) {
      openComparisonModal(comparisonItems, 'clientOffers');
      setComparisonMode(false);
      setSelectedForComparison([]);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 flex-shrink-0">
        {/* Service Type Toggle */}
        <div className="flex gap-2 p-3 border-b border-slate-100">
          {['SMS', 'VOICE'].map((type) => (
            <button
              key={type}
              onClick={() => setClientOffersServiceType(type)}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                clientOffersServiceType === type
                  ? 'bg-[#005461] text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {type === 'SMS' ? <ChatText size={16} /> : <Phone size={16} />}
              {type}
            </button>
          ))}
        </div>

        {/* Title & Actions */}
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{clientOffersServiceType} Client Offers</h2>
            <p className="text-xs text-slate-500">View all client offers from all companies</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                showFilters ? 'bg-[#3BC1A8] text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Funnel size={16} />
              Filters
              <CaretDown size={12} />
            </button>
            <button
              onClick={exportClientOffersToExcel}
              className="px-3 py-2 bg-[#3BC1A8] text-white rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              <Export size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-3 bg-slate-50 border-b border-slate-100">
            {/* Search & Date */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search by company name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pl-9 border border-slate-200 rounded-lg text-sm"
                />
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                placeholder="From"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                placeholder="To"
              />
            </div>

            {/* Column Filters */}
            <div className="flex flex-wrap gap-2 mb-3">
              <select
                value={filters.designation}
                onChange={(e) => setFilters({ ...filters, designation: e.target.value })}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="">{clientOffersServiceType === 'SMS' ? 'All Designations' : 'All Destinations'}</option>
                {[...filterOptions.designations].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <select
                value={filters.product}
                onChange={(e) => setFilters({ ...filters, product: e.target.value })}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="">All Products</option>
                {[...filterOptions.products].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <select
                value={filters.network}
                onChange={(e) => setFilters({ ...filters, network: e.target.value })}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="">{clientOffersServiceType === 'SMS' ? 'All Networks' : 'All Breakouts'}</option>
                {[...filterOptions.networks].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <select
                value={filters.rate}
                onChange={(e) => setFilters({ ...filters, rate: e.target.value })}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="">All Rates</option>
                {[...filterOptions.rates].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <select
                value={filters.traffic}
                onChange={(e) => setFilters({ ...filters, traffic: e.target.value })}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="">{clientOffersServiceType === 'SMS' ? 'All Traffic' : 'All Billing'}</option>
                {[...filterOptions.traffics].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <select
                value={filters.display}
                onChange={(e) => setFilters({ ...filters, display: e.target.value })}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="">All Display</option>
                {[...filterOptions.displays].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <select
                value={filters.tps}
                onChange={(e) => setFilters({ ...filters, tps: e.target.value })}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="">{clientOffersServiceType === 'SMS' ? 'All TPS' : 'All ACD'}</option>
                {[...filterOptions.tpss].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <select
                value={filters.cap}
                onChange={(e) => setFilters({ ...filters, cap: e.target.value })}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="">{clientOffersServiceType === 'SMS' ? 'All CAP' : 'All ASR'}</option>
                {[...filterOptions.caps].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <select
                value={filters.hop}
                onChange={(e) => setFilters({ ...filters, hop: e.target.value })}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="">All HOP</option>
                {[...filterOptions.hops].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setComparisonMode(!comparisonMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                  comparisonMode ? 'bg-[#3BC1A8] text-white' : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                <Scales size={14} />
                Compare
              </button>
              {hasAnyFilter && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <X size={14} />
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Comparison Bar */}
        {comparisonMode && selectedForComparison.length > 0 && (
          <div className="p-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <span className="text-sm text-blue-700">
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
                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                disabled={selectedForComparison.length < 2}
              >
                Compare
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Offers List */}
      <div className="flex-1 overflow-y-auto p-4">
        {initialLoading ? (
          <SkeletonOffersList />
        ) : offersData.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">{hasAnyFilter ? '🔍' : '📥'}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">
              {hasAnyFilter ? 'No Results Found' : 'No Client Offers'}
            </h3>
            <p className="text-sm text-slate-500">
              {hasAnyFilter ? 'Try adjusting your filters' : 'Client offers from meetings will appear here'}
            </p>
          </div>
        ) : (
          offersData.map((meeting) => {
            const offers = meeting.clientOffers || [];
            const isExpanded = expandedCards[meeting.id];

            return (
              <div key={meeting.id} className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
                {/* Card Header */}
                <div
                  className="p-4 flex items-center gap-3 cursor-pointer"
                  onClick={() => toggleExpand(meeting.id)}
                >
                  <div className="company-avatar">
                    {getCompanyInitials(meeting.companyName)}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800">{meeting.companyName}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>📅 {meeting.date} - {meeting.startTime?.slice(0, 5)}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-4 mt-1">
                      {meeting.strongRegion && <span>🌍 Region: {meeting.strongRegion}</span>}
                      {meeting.phone && <span>📞 {meeting.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                      {clientOffersServiceType}
                    </span>
                    {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                  </div>
                </div>

                {/* Offers Table */}
                {isExpanded && offers.length > 0 && (
                  <div className="border-t border-slate-100 overflow-x-auto">
                    <table className="linked-rates-table">
                      <thead>
                        <tr>
                          {comparisonMode && <th className="w-10"></th>}
                          {clientOffersServiceType === 'SMS' ? (
                            <>
                              <th>Designation</th>
                              <th>Product</th>
                              <th>Network</th>
                              <th>Rate</th>
                              <th>Traffic</th>
                              <th>Display</th>
                              <th>TPS</th>
                              <th>CAP</th>
                              <th>HOP</th>
                            </>
                          ) : (
                            <>
                              <th>Destination</th>
                              <th>Product</th>
                              <th>Breakout</th>
                              <th>Rate</th>
                              <th>Billing Inc.</th>
                              <th>Display</th>
                              <th>ACD</th>
                              <th>ASR</th>
                              <th>HOP</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {offers.map((offer, idx) => (
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
                            {clientOffersServiceType === 'SMS' ? (
                              <>
                                <td>{offer.designation || '-'}</td>
                                <td>{offer.product || '-'}</td>
                                <td>{offer.network || '-'}</td>
                                <td className="font-semibold text-emerald-600">{offer.rate || '-'}</td>
                                <td>{offer.traffic || '-'}</td>
                                <td>{offer.display || '-'}</td>
                                <td>{offer.tps || '-'}</td>
                                <td>{offer.cap || '-'}</td>
                                <td>{offer.hop || '-'}</td>
                              </>
                            ) : (
                              <>
                                <td>{offer.destination || '-'}</td>
                                <td>{offer.product || '-'}</td>
                                <td>{offer.breakout || '-'}</td>
                                <td className="font-semibold text-emerald-600">{offer.rate || '-'}</td>
                                <td>{offer.billingIncrement || '-'}</td>
                                <td>{offer.display || '-'}</td>
                                <td>{offer.acd || '-'}</td>
                                <td>{offer.asr || '-'}</td>
                                <td>{offer.hop || '-'}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-white border-t border-slate-200 flex-shrink-0">
        <span className="text-xs text-slate-500">
          {offersData.length} meetings with {clientOffersServiceType} offers
        </span>
      </div>
    </div>
  );
}
