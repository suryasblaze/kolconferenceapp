import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ChatText,
  Phone,
  CaretDown,
  CaretUp,
  DotsThreeVertical,
  FileArrowDown,
  FileArrowUp,
  Trash,
  ArrowsOut,
  Plus,
  FloppyDisk,
  MagnifyingGlass,
  Funnel,
  X
} from '@phosphor-icons/react';
import useStore from '../../store/useStore';
import { regions, SERVICE_TYPES, LIST_TYPES, SMS_COLUMNS, VOICE_COLUMNS } from '../../data/constants';

export default function Header() {
  const {
    serviceType,
    listType,
    region,
    headerCollapsed,
    setServiceType,
    setListType,
    setRegion,
    setHeaderCollapsed,
    openImportModal,
    getCurrentData,
    addRow,
    clearAllData,
    saveState,
    exportRatesToExcel,
    exportAllRegionsToExcel,
    downloadTemplate,
    ratesSearchTerm,
    ratesFilterColumn,
    setRatesSearchTerm,
    setRatesFilterColumn,
    clearRatesSearch
  } = useStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(ratesSearchTerm);
  const menuRef = useRef(null);
  const filterRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Debounced search - updates store after 200ms of no typing
  const handleSearchChange = useCallback((value) => {
    setLocalSearchTerm(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setRatesSearchTerm(value);
    }, 200);
  }, [setRatesSearchTerm]);

  // Sync local state when store changes (e.g., when cleared)
  useEffect(() => {
    setLocalSearchTerm(ratesSearchTerm);
  }, [ratesSearchTerm]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilter(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleExport = () => {
    exportRatesToExcel();
    setMenuOpen(false);
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
    setMenuOpen(false);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data for this selection?')) {
      clearAllData();
    }
    setMenuOpen(false);
  };

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
    setMenuOpen(false);
  };

  const currentData = getCurrentData();
  const rowCount = currentData.length;

  return (
    <header className="bg-[#005461] text-white safe-top">
      {/* Logo Row */}
      <div className="flex items-center justify-between px-4 py-2">
        <img src={`${import.meta.env.BASE_URL}logo.gif`} alt="Nexus" className="h-12 rounded-lg" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHeaderCollapsed(!headerCollapsed)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {headerCollapsed ? <CaretDown size={20} /> : <CaretUp size={20} />}
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <DotsThreeVertical size={20} weight="bold" />
            </button>
            {menuOpen && (
              <div className="action-menu show">
                <button onClick={handleDownloadTemplate}>
                  <FileArrowDown size={18} />
                  Download Template
                </button>
                <button onClick={openImportModal}>
                  <FileArrowUp size={18} />
                  Import Excel
                </button>
                <button onClick={handleExport}>
                  <FileArrowDown size={18} />
                  Export Excel
                </button>
                <button onClick={() => { exportAllRegionsToExcel(); setMenuOpen(false); }}>
                  <FileArrowDown size={18} />
                  Export All Regions
                </button>
                <hr />
                <button onClick={handleFullscreen}>
                  <ArrowsOut size={18} />
                  {document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen'}
                </button>
                <hr />
                <button onClick={handleClearData} className="text-red-500">
                  <Trash size={18} />
                  Clear Data
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapsed Summary */}
      {headerCollapsed && serviceType && listType && region && (
        <div
          className="collapsed-summary show cursor-pointer"
          onClick={() => setHeaderCollapsed(false)}
        >
          <div className="flex items-center gap-2">
            {serviceType === 'SMS' ? <ChatText size={14} /> : <Phone size={14} />}
            <span>{serviceType}</span>
            <span className="badge">{listType}</span>
            <span className="badge">{regions.find(r => r.id === region)?.label}</span>
          </div>
          <span className="badge">{rowCount} rows</span>
        </div>
      )}

      {/* Expandable Content */}
      <div className={`header-content ${headerCollapsed ? 'collapsed' : ''}`}>
        {/* Service Type Toggle */}
        <div className="px-4 pb-3">
          <div className="flex gap-2">
            {SERVICE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setServiceType(type)}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  serviceType === type
                    ? 'bg-white text-[#005461]'
                    : 'bg-white/10 text-white/70'
                }`}
              >
                {type === 'SMS' ? <ChatText size={18} weight="bold" /> : <Phone size={18} weight="bold" />}
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* List Type Toggle */}
        {serviceType && (
          <div className="px-4 pb-3">
            <div className="flex gap-2">
              {LIST_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setListType(type)}
                  className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-all ${
                    listType === type
                      ? 'bg-[#3BC1A8] text-white'
                      : 'bg-white/5 text-white/60'
                  }`}
                >
                  {type === 'TARGET' ? 'Target List' : 'Push List'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Region Grid */}
        {serviceType && listType && (
          <div className="px-4 pb-3">
            <div className="grid grid-cols-3 gap-2">
              {regions.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRegion(r.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    region === r.id
                      ? 'bg-white text-[#005461]'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      {serviceType && listType && region && (
        <div className="px-4 py-2 bg-[#0C7779] flex items-center justify-between gap-2">
          <div className="text-xs text-white/80">
            <span className="font-semibold">{rowCount}</span> rates
          </div>
          <div className="flex items-center gap-2">
            {/* Search - expandable */}
            {showSearch ? (
              <div className="flex items-center gap-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={localSearchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    autoFocus
                    className="w-32 px-2 py-1.5 pl-7 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder-white/50 focus:outline-none focus:bg-white/20 focus:border-white/40"
                  />
                  <MagnifyingGlass size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50" />
                </div>
                {/* Filter Dropdown */}
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setShowFilter(!showFilter)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      ratesFilterColumn ? 'bg-[#3BC1A8] text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    <Funnel size={14} />
                  </button>
                  {showFilter && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg z-50 min-w-[120px] py-1">
                      <button
                        onClick={() => { setRatesFilterColumn(''); setShowFilter(false); }}
                        className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-100 ${!ratesFilterColumn ? 'text-[#3BC1A8] font-semibold' : 'text-slate-600'}`}
                      >
                        All Columns
                      </button>
                      {(serviceType === 'SMS' ? SMS_COLUMNS : VOICE_COLUMNS).map((col) => (
                        <button
                          key={col}
                          onClick={() => { setRatesFilterColumn(col); setShowFilter(false); }}
                          className={`w-full px-3 py-1.5 text-left text-xs capitalize hover:bg-slate-100 ${ratesFilterColumn === col ? 'text-[#3BC1A8] font-semibold' : 'text-slate-600'}`}
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setShowSearch(false); clearRatesSearch(); }}
                  className="p-1.5 bg-white/10 rounded-lg text-white/70 hover:bg-white/20"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className={`p-1.5 rounded-lg transition-colors ${
                  localSearchTerm ? 'bg-[#3BC1A8] text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <MagnifyingGlass size={14} />
              </button>
            )}
            <button
              onClick={addRow}
              className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-white/20 transition-colors"
            >
              <Plus size={14} weight="bold" />
              Add Row
            </button>
            <button
              onClick={saveState}
              className="px-3 py-1.5 bg-[#3BC1A8] rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-[#249E94] transition-colors"
            >
              <FloppyDisk size={14} weight="bold" />
              Save
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
