import { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import {
  ChatText,
  Phone,
  Plus,
  CalendarPlus,
  CalendarCheck,
  CalendarX,
  Trash,
  Envelope,
  DeviceMobile,
  MapPin,
  UserCircle,
  Info,
  MagnifyingGlass,
  X
} from '@phosphor-icons/react';
import useStore from '../../store/useStore';
import { SkeletonCard } from '../ui/Skeleton';

// Memoized Company Card component
const CompanyCard = memo(function CompanyCard({
  company,
  hasMeeting,
  meeting,
  onSchedule,
  onViewMeeting,
  onDelete,
  getInitials
}) {
  return (
    <div className="company-card">
      <div className="company-avatar">
        {getInitials(company.name)}
      </div>
      <div className="company-info">
        <div className="company-name">{company.name}</div>
        {company.contactPerson && (
          <div className="company-contact">
            <MapPin size={12} />
            {company.contactPerson}
          </div>
        )}
        {company.email && (
          <div className="company-contact">
            <Envelope size={12} />
            {company.email}
          </div>
        )}
        {company.phone && (
          <div className="company-contact">
            <DeviceMobile size={12} />
            {company.phone}
          </div>
        )}
        {company.createdBy && (
          <div className="company-contact text-blue-600">
            <UserCircle size={12} />
            Added by: {company.createdBy}
          </div>
        )}
        {hasMeeting ? (
          <div className="company-contact text-emerald-600">
            <CalendarCheck size={12} />
            Meeting scheduled
          </div>
        ) : (
          <div className="company-contact text-slate-400">
            <CalendarX size={12} />
            No meeting
          </div>
        )}
      </div>
      <div className="company-actions">
        {hasMeeting ? (
          <button
            onClick={() => onViewMeeting(meeting.id)}
            className="btn-details"
          >
            <Info size={14} weight="bold" />
            Details
          </button>
        ) : (
          <button
            onClick={() => onSchedule(company.id)}
            className="btn-schedule"
          >
            <CalendarPlus size={14} />
            Schedule
          </button>
        )}
        <button
          onClick={() => onDelete(company.id)}
          className="btn-icon danger"
        >
          <Trash size={16} />
        </button>
      </div>
    </div>
  );
});

export default function CompaniesTab() {
  const {
    companies,
    meetings,
    companiesServiceType,
    setCompaniesServiceType,
    addCompany,
    deleteCompany,
    openScheduleModal,
    openMeetingModal,
    showToast,
    initialLoading
  } = useStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', phone: '', email: '' });
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimeoutRef = useRef(null);

  // Debounce search
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 200);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Memoize meetings map for O(1) lookup - by companyId AND companyName
  const { meetingsById, meetingsByName } = useMemo(() => {
    const byId = new Map();
    const byName = new Map();
    meetings.forEach(m => {
      if (m.companyId) {
        byId.set(m.companyId, m);
      }
      if (m.companyName) {
        // Store by lowercase name for case-insensitive matching
        byName.set(m.companyName.toLowerCase(), m);
      }
    });
    return { meetingsById: byId, meetingsByName: byName };
  }, [meetings]);

  // Get meeting for a company - check by companyId first, then by companyName
  const getCompanyMeeting = useCallback((companyId, companyName) => {
    // First try by companyId
    const byId = meetingsById.get(companyId);
    if (byId) return byId;

    // Fallback: try by company name (case-insensitive)
    if (companyName) {
      return meetingsByName.get(companyName.toLowerCase());
    }
    return undefined;
  }, [meetingsById, meetingsByName]);

  // Filter with case-insensitive matching and debounced search
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const companyType = (c.serviceType || '').toUpperCase();
      if (companyType !== companiesServiceType) return false;

      // Apply search filter using debounced value
      if (debouncedSearch) {
        const search = debouncedSearch.toLowerCase();
        return (
          (c.name || '').toLowerCase().includes(search) ||
          (c.email || '').toLowerCase().includes(search) ||
          (c.phone || '').toLowerCase().includes(search) ||
          (c.contactPerson || '').toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [companies, companiesServiceType, debouncedSearch]);

  const handleAddCompany = useCallback(() => {
    if (!newCompany.name.trim()) {
      showToast('Company name is required', 'error');
      return;
    }

    addCompany({
      ...newCompany,
      serviceType: companiesServiceType
    });

    setNewCompany({ name: '', phone: '', email: '' });
    setShowAddForm(false);
    showToast('Company added successfully', 'success');
  }, [newCompany, companiesServiceType, addCompany, showToast]);

  const handleDeleteCompany = useCallback((companyId) => {
    if (confirm('Are you sure you want to delete this company?')) {
      deleteCompany(companyId);
      showToast('Company deleted', 'success');
    }
  }, [deleteCompany, showToast]);

  const getInitials = useCallback((name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        {/* Service Type Toggle */}
        <div className="flex gap-2 p-3 border-b border-slate-100">
          {['SMS', 'VOICE'].map((type) => (
            <button
              key={type}
              onClick={() => setCompaniesServiceType(type)}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                companiesServiceType === type
                  ? 'bg-[#005461] text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {type === 'SMS' ? <ChatText size={16} /> : <Phone size={16} />}
              {type}
            </button>
          ))}
        </div>

        {/* Title Row */}
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{companiesServiceType} Companies</h2>
            <p className="text-xs text-slate-500">Manage companies & schedule meetings</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search Toggle */}
            {showSearch ? (
              <div className="flex items-center gap-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    autoFocus
                    className="w-32 px-2 py-1.5 pl-7 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#3BC1A8]"
                  />
                  <MagnifyingGlass size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <button
                  onClick={() => { setShowSearch(false); setSearchTerm(''); setDebouncedSearch(''); }}
                  className="p-1.5 bg-slate-100 rounded-lg text-slate-500 hover:bg-slate-200"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className={`p-2 rounded-lg transition-colors ${
                  searchTerm ? 'bg-[#3BC1A8] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <MagnifyingGlass size={16} />
              </button>
            )}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-2 bg-[#3BC1A8] text-white rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              <Plus size={16} weight="bold" />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Add Company Form */}
      {showAddForm && (
        <div className="add-company-form mx-4 mt-4">
          <input
            type="text"
            placeholder="Company Name *"
            value={newCompany.name}
            onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={newCompany.phone}
            onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email Address"
            value={newCompany.email}
            onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCompany}
              className="flex-1 py-3 bg-[#3BC1A8] text-white rounded-lg font-semibold text-sm"
            >
              Save Company
            </button>
          </div>
        </div>
      )}

      {/* Companies List */}
      <div className="flex-1 overflow-auto p-4">
        {initialLoading ? (
          <>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">{searchTerm ? '🔍' : '🏢'}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">
              {searchTerm ? `No results for "${searchTerm}"` : 'No Companies Yet'}
            </h3>
            <p className="text-sm text-slate-500">
              {searchTerm
                ? 'Try a different search term'
                : `Add your first ${companiesServiceType} company to get started`
              }
            </p>
          </div>
        ) : (
          filteredCompanies.map((company) => {
            const companyMeeting = getCompanyMeeting(company.id, company.name);
            const hasMeeting = !!companyMeeting;

            return (
              <CompanyCard
                key={company.id}
                company={company}
                hasMeeting={hasMeeting}
                meeting={companyMeeting}
                onSchedule={openScheduleModal}
                onViewMeeting={openMeetingModal}
                onDelete={handleDeleteCompany}
                getInitials={getInitials}
              />
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {filteredCompanies.length} {companiesServiceType} companies
        </span>
        <span className="text-xs text-slate-400">
          Tap schedule to book meeting
        </span>
      </div>
    </div>
  );
}
