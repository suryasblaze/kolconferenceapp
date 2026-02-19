import { useState, useEffect, useMemo } from 'react';
import {
  X,
  PencilSimple,
  FloppyDisk,
  Trash,
  Paperclip,
  File,
  Eye,
  Plus,
  MagnifyingGlass,
  Buildings,
  CalendarPlus,
  Info,
  Export,
  Download,
  NotePencil,
  Link
} from '@phosphor-icons/react';
import useStore from '../../store/useStore';

export default function MeetingModal() {
  const {
    meetingModalOpen,
    closeMeetingModal,
    editingMeetingId,
    meetings,
    companies,
    updateMeeting,
    deleteMeeting,
    saveSingleMeetingToSupabase,
    showToast,
    data // For rate search
  } = useStore();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    strongRegion: '',
    lookingFor: '',
    activeStatus: 'active',
    reason: '',
    payable: '',
    dealProposals: '',
    routeIssue: '',
    notes: ''
  });
  const [rateSearch, setRateSearch] = useState('');
  const [showRateSuggestions, setShowRateSuggestions] = useState(false);
  const [linkedRates, setLinkedRates] = useState([]);
  const [clientOffers, setClientOffers] = useState([]);
  const [files, setFiles] = useState([]);
  const [previewRate, setPreviewRate] = useState(null);

  const meeting = meetings.find(m => m.id === editingMeetingId);
  const company = meeting ? companies.find(c => c.id === meeting.companyId) : null;

  useEffect(() => {
    if (meeting && meetingModalOpen) {
      setFormData({
        strongRegion: meeting.strongRegion || '',
        lookingFor: meeting.lookingFor || '',
        activeStatus: meeting.activeStatus || 'active',
        reason: meeting.reason || '',
        payable: meeting.payable || '',
        dealProposals: meeting.dealProposals || '',
        routeIssue: meeting.routeIssue || '',
        notes: meeting.notes || ''
      });
      setLinkedRates(meeting.linkedRates || []);
      setClientOffers(meeting.clientOffers || []);
      setFiles(meeting.files || []);

      // Auto-enter edit mode for meetings with no content (newly scheduled)
      const hasContent = meeting.notes?.trim() || meeting.clientOffers?.length > 0 ||
                        meeting.files?.length > 0 || meeting.linkedRates?.length > 0 ||
                        meeting.strongRegion?.trim() || meeting.lookingFor?.trim() ||
                        meeting.reason?.trim() || meeting.payable?.trim() ||
                        meeting.dealProposals?.trim() || meeting.routeIssue?.trim();
      setEditMode(!hasContent);
    }
  }, [meeting, meetingModalOpen]);

  // Get all rates for search
  const allRates = useMemo(() => {
    const rates = [];
    Object.entries(data).forEach(([key, rows]) => {
      const [serviceType, listType, region] = key.split('_');
      rows.forEach((row, index) => {
        rates.push({
          ...row,
          key,
          index,
          serviceType,
          listType,
          region
        });
      });
    });
    return rates;
  }, [data]);

  // Filter rates by search
  const filteredRates = useMemo(() => {
    if (!rateSearch) return [];
    const search = rateSearch.toLowerCase();
    return allRates.filter(r => {
      const name = r.designation || r.destination || '';
      return name.toLowerCase().includes(search) ||
        r.product?.toLowerCase().includes(search) ||
        r.region?.toLowerCase().includes(search);
    }).slice(0, 10);
  }, [rateSearch, allRates]);

  if (!meetingModalOpen || !meeting) return null;

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getStatus = () => {
    const hasContent = meeting.notes?.trim() || meeting.clientOffers?.length > 0 ||
                       meeting.files?.length > 0 || meeting.linkedRates?.length > 0 ||
                       meeting.strongRegion?.trim() || meeting.lookingFor?.trim();
    if (hasContent) return { label: 'COMPLETED', class: 'completed' };
    return { label: 'SCHEDULED', class: 'scheduled' };
  };

  const status = getStatus();

  const handleSave = async () => {
    const updatedMeeting = {
      ...meeting,
      ...formData,
      linkedRates,
      clientOffers,
      files
    };

    updateMeeting(meeting.id, updatedMeeting);
    await saveSingleMeetingToSupabase(updatedMeeting);

    showToast('Meeting updated', 'success');
    setEditMode(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      deleteMeeting(meeting.id);
      showToast('Meeting deleted', 'success');
      closeMeetingModal();
    }
  };

  const addLinkedRate = (rate) => {
    // Store as reference format for compatibility
    const linkedRate = {
      key: rate.key,
      index: rate.index,
      fullData: rate // Also store full data for display
    };

    if (linkedRates.find(r => r.key === rate.key && r.index === rate.index)) {
      showToast('Rate already linked', 'info');
      return;
    }
    setLinkedRates([...linkedRates, linkedRate]);
    setRateSearch('');
    setShowRateSuggestions(false);
    showToast('Rate linked', 'success');
  };

  const removeLinkedRate = (idx) => {
    setLinkedRates(linkedRates.filter((_, i) => i !== idx));
  };

  // Resolve linked rate to display data
  const resolveRate = (linkedRate) => {
    if (linkedRate.fullData) return linkedRate.fullData;
    if (linkedRate.key && typeof linkedRate.index === 'number') {
      const rateData = data[linkedRate.key]?.[linkedRate.index];
      if (rateData) {
        const [serviceType, listType, region] = linkedRate.key.split('_');
        return { ...rateData, serviceType, listType, region };
      }
    }
    return linkedRate;
  };

  // Client offers management
  const addClientOfferRow = () => {
    const serviceType = meeting.serviceType || 'SMS';
    const newRow = serviceType === 'SMS'
      ? { designation: '', product: '', network: '', rate: '', traffic: '', display: '', tps: '', cap: '', hop: '' }
      : { destination: '', product: '', breakout: '', rate: '', billingIncrement: '', display: '', acd: '', asr: '', hop: '' };
    setClientOffers([...clientOffers, newRow]);
  };

  const updateClientOffer = (index, field, value) => {
    const updated = [...clientOffers];
    updated[index] = { ...updated[index], [field]: value };
    setClientOffers(updated);
  };

  const removeClientOfferRow = (index) => {
    setClientOffers(clientOffers.filter((_, i) => i !== index));
  };

  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    const newFiles = uploadedFiles.map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      data: URL.createObjectURL(file)
    }));
    setFiles([...files, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setFiles(files.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const serviceType = meeting.serviceType || 'SMS';
  const smsColumns = ['designation', 'product', 'network', 'rate', 'traffic', 'display', 'tps', 'cap', 'hop'];
  const voiceColumns = ['destination', 'product', 'breakout', 'rate', 'billingIncrement', 'display', 'acd', 'asr', 'hop'];
  const columns = serviceType === 'SMS' ? smsColumns : voiceColumns;
  const headers = serviceType === 'SMS'
    ? ['Designation', 'Product', 'Network', 'Rate', 'Traffic', 'Display', 'TPS', 'CAP', 'HOP']
    : ['Destination', 'Product', 'Breakout', 'Rate', 'Billing Inc.', 'Display', 'ACD', 'ASR', 'HOP'];

  return (
    <div className="meeting-modal show">
      <div className="meeting-modal-content">
        {/* Header */}
        <div className="modal-header">
          <h3 className="text-lg font-bold text-slate-800">
            Meeting Details
          </h3>
          <button onClick={closeMeetingModal} className="p-2 text-slate-400 hover:text-slate-600">
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="modal-body">
          {editMode ? (
            /* ============ EDIT VIEW ============ */
            <>
              {/* Meeting Info Header */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
                <div className="company-avatar">
                  {getInitials(meeting.companyName)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{meeting.companyName}</p>
                  <p className="text-xs text-slate-500">
                    {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                  </p>
                  <p className="text-xs text-blue-600">
                    {company?.createdBy && (
                      <span><Buildings size={12} className="inline" /> Company added by: {company.createdBy}<br /></span>
                    )}
                    {meeting.scheduledBy && (
                      <span><CalendarPlus size={12} className="inline" /> Scheduled by: {meeting.scheduledBy}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Meeting Details Form */}
              <div className="form-group">
                <label>Meeting Details</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Strong Region</span>
                    <textarea
                      value={formData.strongRegion}
                      onChange={(e) => setFormData({ ...formData, strongRegion: e.target.value })}
                      placeholder="Enter strong regions..."
                      className="meeting-detail-textarea"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Looking For</span>
                    <textarea
                      value={formData.lookingFor}
                      onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })}
                      placeholder="What they're looking for..."
                      className="meeting-detail-textarea"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Status</span>
                    <select
                      value={formData.activeStatus}
                      onChange={(e) => setFormData({ ...formData, activeStatus: e.target.value })}
                      className="w-full"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Reason</span>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Reason..."
                      className="meeting-detail-textarea"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Payable/Receivable</span>
                    <textarea
                      value={formData.payable}
                      onChange={(e) => setFormData({ ...formData, payable: e.target.value })}
                      placeholder="Payment terms..."
                      className="meeting-detail-textarea"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Deal Proposals</span>
                    <textarea
                      value={formData.dealProposals}
                      onChange={(e) => setFormData({ ...formData, dealProposals: e.target.value })}
                      placeholder="Deal proposals..."
                      className="meeting-detail-textarea"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Route Issue</span>
                  <textarea
                    value={formData.routeIssue}
                    onChange={(e) => setFormData({ ...formData, routeIssue: e.target.value })}
                    placeholder="Any route issues..."
                    className="meeting-detail-textarea"
                  />
                </div>
              </div>

              {/* Our Offers (Link Rates) */}
              <div className="form-group">
                <label className="text-emerald-600 flex items-center gap-1">
                  <Export size={14} /> Our Offers (Link Rate Data)
                </label>
                <div className="rate-search-container">
                  <div className="relative">
                    <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search rates by destination, product..."
                      value={rateSearch}
                      onChange={(e) => {
                        setRateSearch(e.target.value);
                        setShowRateSuggestions(true);
                      }}
                      onFocus={() => setShowRateSuggestions(true)}
                      className="pl-9"
                    />
                  </div>
                  {showRateSuggestions && filteredRates.length > 0 && (
                    <div className="rate-suggestions">
                      {filteredRates.map((rate, idx) => (
                        <div
                          key={idx}
                          className="rate-suggestion-item"
                        >
                          <div className="rate-suggestion-info flex-1">
                            <div className="font-semibold text-blue-600">
                              {rate.designation || rate.destination} - {rate.product}
                              <span className="text-slate-600 font-normal ml-1">
                                Rate: {rate.rate || '-'}
                              </span>
                              <span className="text-slate-500 font-normal ml-1">
                                | {rate.network || rate.breakout || '-'} | {rate.traffic || rate.billingIncrement || '-'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPreviewRate(rate)}
                              className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold flex items-center gap-1"
                            >
                              <Eye size={12} /> View
                            </button>
                            <button
                              onClick={() => addLinkedRate(rate)}
                              className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold flex items-center gap-1"
                            >
                              <Plus size={12} /> Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Linked Rates Tags */}
                {linkedRates.length > 0 && (
                  <div className="linked-data mt-2">
                    {linkedRates.map((lr, idx) => {
                      const rate = resolveRate(lr);
                      return (
                        <span key={idx} className="linked-tag">
                          <Link size={12} /> {lr.listType || rate.listType} | {lr.region || rate.region} | {rate.designation || rate.destination} - {rate.product}
                          <button onClick={() => removeLinkedRate(idx)}>
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Client Offers */}
              <div className="form-group">
                <label className="text-[#3BC1A8] flex items-center gap-1">
                  <Download size={14} /> Client Offers
                </label>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i}><div className="px-3 py-2 text-white text-xs font-semibold">{h}</div></th>
                        ))}
                        <th><div className="px-2 py-2 text-white text-xs font-semibold w-8"></div></th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientOffers.map((offer, rowIdx) => (
                        <tr key={rowIdx}>
                          {columns.map((col) => (
                            <td key={col}>
                              <input
                                type="text"
                                value={offer[col] || ''}
                                onChange={(e) => updateClientOffer(rowIdx, col, e.target.value)}
                                placeholder={col}
                              />
                            </td>
                          ))}
                          <td className="text-center">
                            <button onClick={() => removeClientOfferRow(rowIdx)} className="p-1 text-red-500">
                              <Trash size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={addClientOfferRow}
                  className="mt-2 px-3 py-1.5 bg-[#3BC1A8] text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Plus size={12} weight="bold" /> Add Row
                </button>
              </div>

              {/* Attachments */}
              <div className="form-group">
                <label><Paperclip size={14} className="inline" /> Attachments</label>
                <label className="block w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-lg text-center cursor-pointer hover:border-[#3BC1A8] transition-colors">
                  <Paperclip size={20} className="inline mr-2 text-slate-400" />
                  <span className="text-sm text-slate-500">Click to attach files</span>
                  <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                </label>
                {files.length > 0 && (
                  <div className="file-list">
                    {files.map(file => (
                      <div key={file.id} className="file-item">
                        <File size={16} className="text-[#3BC1A8]" />
                        <span className="name">{file.name}</span>
                        <span className="text-xs text-slate-400">{formatFileSize(file.size)}</span>
                        <button onClick={() => removeFile(file.id)}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="form-group">
                <label><NotePencil size={14} className="inline" /> Notes</label>
                <textarea
                  placeholder="Meeting notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="py-3 px-4 bg-red-100 text-red-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Trash size={16} />
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-[#3BC1A8] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <FloppyDisk size={16} weight="bold" />
                  Save
                </button>
              </div>
            </>
          ) : (
            /* ============ DETAILS VIEW (Read-only) ============ */
            <>
              {/* Meeting Info Header */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
                <div className="company-avatar">
                  {getInitials(meeting.companyName)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{meeting.companyName}</p>
                  {meeting.subject && (
                    <p className="text-xs text-[#3BC1A8] font-medium">{meeting.subject}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                  </p>
                  <p className="text-xs text-blue-600">
                    {company?.createdBy && (
                      <span><Buildings size={12} className="inline" /> Company added by: {company.createdBy}<br /></span>
                    )}
                    {meeting.scheduledBy && (
                      <span><CalendarPlus size={12} className="inline" /> Scheduled by: {meeting.scheduledBy}</span>
                    )}
                  </p>
                </div>
                <span className={`meeting-status ${status.class}`}>{status.label}</span>
              </div>

              {/* Meeting Details Grid */}
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  <Info size={12} className="inline" /> Meeting Details
                </p>
                <div className="grid grid-cols-2 gap-2 p-3 bg-white border border-slate-200 rounded-xl text-xs">
                  <div><span className="text-slate-400">Strong Region:</span> <span className="font-medium">{meeting.strongRegion || '-'}</span></div>
                  <div><span className="text-slate-400">Looking For:</span> <span className="font-medium">{meeting.lookingFor || '-'}</span></div>
                  <div><span className="text-slate-400">Status:</span> <span className={`font-medium ${meeting.activeStatus === 'active' ? 'text-emerald-600' : ''}`}>{meeting.activeStatus === 'active' ? 'Active' : meeting.activeStatus || '-'}</span></div>
                  <div><span className="text-slate-400">Reason:</span> <span className="font-medium">{meeting.reason || '-'}</span></div>
                  <div><span className="text-slate-400">Payable/Receivable:</span> <span className="font-medium">{meeting.payable || '-'}</span></div>
                  <div><span className="text-slate-400">Deal Proposals:</span> <span className="font-medium">{meeting.dealProposals || '-'}</span></div>
                  <div className="col-span-2"><span className="text-slate-400">Route Issue:</span> <span className="font-medium">{meeting.routeIssue || '-'}</span></div>
                </div>
              </div>

              {/* Our Offers (Linked Rates) */}
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-wider text-emerald-600 font-semibold mb-2">
                  <Export size={12} className="inline" /> Our Offers
                </p>
                {linkedRates.length > 0 ? (
                  <>
                    <p className="text-xs text-slate-500 mb-2">{serviceType} RATES</p>
                    <div className="overflow-x-auto">
                      <table className="linked-rates-table">
                        <thead>
                          <tr>
                            {headers.map((h, i) => <th key={i}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {linkedRates.map((lr, idx) => {
                            const rate = resolveRate(lr);
                            return (
                              <tr key={idx}>
                                {columns.map((col) => (
                                  <td key={col} className={col === 'rate' ? 'font-semibold text-emerald-600' : ''}>
                                    {rate[col] || '-'}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 italic p-3 bg-white border border-slate-200 rounded-xl">No offers linked</p>
                )}
              </div>

              {/* Client Offers */}
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-wider text-[#3BC1A8] font-semibold mb-2">
                  <Download size={12} className="inline" /> Client Offers
                </p>
                {clientOffers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="linked-rates-table">
                      <thead>
                        <tr>
                          {headers.map((h, i) => <th key={i}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {clientOffers.map((offer, idx) => (
                          <tr key={idx}>
                            {columns.map((col) => (
                              <td key={col} className={col === 'rate' ? 'font-semibold text-[#3BC1A8]' : ''}>
                                {offer[col] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No client offers</p>
                )}
              </div>

              {/* Attachments Display */}
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  <Paperclip size={12} className="inline" /> Attachments
                </p>
                {files.length > 0 ? (
                  <div className="space-y-2">
                    {files.map(file => (
                      <div key={file.id} className="file-display-item" onClick={() => window.open(file.data)}>
                        <File size={24} className="text-[#3BC1A8]" />
                        <div className="file-info">
                          <div className="file-name">{file.name}</div>
                          <div className="file-size">{formatFileSize(file.size)}</div>
                        </div>
                        <Eye size={16} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic p-3 bg-white border border-slate-200 rounded-xl">No attachments</p>
                )}
              </div>

              {/* Notes Display */}
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  <NotePencil size={12} className="inline" /> Notes
                </p>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 min-h-[40px]">
                  {meeting.notes || <span className="text-slate-400 italic">No notes</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeMeetingModal}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => setEditMode(true)}
                  className="flex-1 py-3 bg-[#3BC1A8] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <PencilSimple size={16} weight="bold" />
                  Edit
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Rate Preview Panel */}
      {previewRate && (
        <div className={`rate-preview-panel ${previewRate ? 'show' : ''}`}>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h4 className="font-bold text-slate-800">Rate Details</h4>
            <button onClick={() => setPreviewRate(null)} className="p-2 text-slate-400 hover:text-slate-600">
              <X size={20} weight="bold" />
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-400 text-xs">Destination</span>
                <p className="font-semibold text-slate-800">{previewRate.designation || previewRate.destination || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Product</span>
                <p className="font-semibold text-slate-800">{previewRate.product || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Rate</span>
                <p className="font-semibold text-emerald-600">{previewRate.rate || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Network</span>
                <p className="font-semibold text-slate-800">{previewRate.network || previewRate.breakout || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Traffic</span>
                <p className="font-semibold text-slate-800">{previewRate.traffic || previewRate.billingIncrement || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Display</span>
                <p className="font-semibold text-slate-800">{previewRate.display || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">{serviceType === 'SMS' ? 'TPS' : 'ACD'}</span>
                <p className="font-semibold text-slate-800">{previewRate.tps || previewRate.acd || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">{serviceType === 'SMS' ? 'CAP' : 'ASR'}</span>
                <p className="font-semibold text-slate-800">{previewRate.cap || previewRate.asr || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">HOP</span>
                <p className="font-semibold text-slate-800">{previewRate.hop || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Region</span>
                <p className="font-semibold text-slate-800">{previewRate.region || '-'}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setPreviewRate(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  addLinkedRate(previewRate);
                  setPreviewRate(null);
                }}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add to Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
