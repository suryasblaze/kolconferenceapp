import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { Trash } from '@phosphor-icons/react';
import useStore from '../../store/useStore';
import { SkeletonTable } from '../ui/Skeleton';
import {
  SMS_COLUMNS,
  SMS_HEADERS,
  VOICE_COLUMNS,
  VOICE_HEADERS,
  DEFAULT_PRODUCT_OPTIONS,
  DEFAULT_NETWORK_OPTIONS,
  DEFAULT_TRAFFIC_OPTIONS,
  REGION_COUNTRIES
} from '../../data/constants';

// Memoized Table Cell component to prevent unnecessary re-renders
const TableCell = memo(function TableCell({
  col,
  value,
  rowIndex,
  isDropdown,
  isCountry,
  onUpdate,
  onBlur,
  onCountryInput,
  fieldOptions
}) {
  if (isDropdown) {
    return (
      <>
        <input
          type="text"
          list={`datalist-${col}`}
          defaultValue={value}
          onBlur={(e) => {
            if (e.target.value !== value) {
              onUpdate(rowIndex, col, e.target.value);
            }
            onBlur(col, e.target.value);
          }}
          placeholder={col}
        />
        <datalist id={`datalist-${col}`}>
          {fieldOptions.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      </>
    );
  }

  if (isCountry) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onCountryInput(e, rowIndex, col)}
        placeholder={col}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <input
      type="text"
      defaultValue={value}
      onBlur={(e) => {
        if (e.target.value !== value) {
          onUpdate(rowIndex, col, e.target.value);
        }
      }}
      placeholder={col}
    />
  );
});

// Memoized Table Row component
const TableRow = memo(function TableRow({
  row,
  displayIndex,
  actualIndex,
  columns,
  onDelete,
  onUpdate,
  onBlur,
  onCountryInput,
  getFieldOptions,
  isDropdownColumn,
  isCountryColumn
}) {
  return (
    <tr>
      <td className="text-center text-xs text-slate-400 border-b border-slate-200">
        {displayIndex + 1}
      </td>
      {columns.map((col) => (
        <td key={col} className="border-b border-slate-200">
          <TableCell
            col={col}
            value={row[col] || ''}
            rowIndex={actualIndex}
            isDropdown={isDropdownColumn(col)}
            isCountry={isCountryColumn(col)}
            onUpdate={onUpdate}
            onBlur={onBlur}
            onCountryInput={onCountryInput}
            fieldOptions={isDropdownColumn(col) ? getFieldOptions(col) : []}
          />
        </td>
      ))}
      <td className="text-center border-b border-slate-200">
        <button
          onClick={() => onDelete(actualIndex)}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
        >
          <Trash size={16} />
        </button>
      </td>
    </tr>
  );
});

export default function RatesTab() {
  const {
    serviceType,
    listType,
    region,
    getCurrentData,
    updateCell,
    deleteRow,
    customOptions,
    addCustomOption,
    ratesSearchTerm,
    ratesFilterColumn,
    initialLoading
  } = useStore();

  const [countryAutocomplete, setCountryAutocomplete] = useState({
    show: false,
    x: 0,
    y: 0,
    suggestions: [],
    rowIndex: null,
    col: null
  });

  const tableRef = useRef(null);

  // Close country autocomplete on click outside - MUST be before any early returns
  useEffect(() => {
    const handleClick = () => {
      setCountryAutocomplete(prev => prev.show ? { ...prev, show: false } : prev);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Memoize columns/headers/data to avoid recalculation
  const columns = useMemo(() => serviceType === 'VOICE' ? VOICE_COLUMNS : SMS_COLUMNS, [serviceType]);
  const headers = useMemo(() => serviceType === 'VOICE' ? VOICE_HEADERS : SMS_HEADERS, [serviceType]);
  const rawData = getCurrentData();

  // Filter data based on search term and filter column
  const data = useMemo(() => {
    if (!ratesSearchTerm) return rawData;

    const searchLower = ratesSearchTerm.toLowerCase();
    return rawData.map((row, index) => ({
      ...row,
      _originalIndex: index
    })).filter((row) => {
      if (ratesFilterColumn) {
        const value = row[ratesFilterColumn] || '';
        return value.toString().toLowerCase().includes(searchLower);
      } else {
        return columns.some(col => {
          const value = row[col] || '';
          return value.toString().toLowerCase().includes(searchLower);
        });
      }
    });
  }, [rawData, ratesSearchTerm, ratesFilterColumn, columns]);

  // Memoize field options to avoid recalculation
  const getFieldOptions = useCallback((field) => {
    let defaultOpts = [];
    const customOpts = customOptions[field] || [];

    switch (field) {
      case 'product':
        defaultOpts = DEFAULT_PRODUCT_OPTIONS;
        break;
      case 'network':
        defaultOpts = DEFAULT_NETWORK_OPTIONS;
        break;
      case 'traffic':
        defaultOpts = DEFAULT_TRAFFIC_OPTIONS;
        break;
      default:
        return [];
    }

    return [...new Set([...defaultOpts, ...customOpts])];
  }, [customOptions]);

  // Memoize column type checks
  const isDropdownColumn = useCallback((col) => {
    return ['product', 'network', 'traffic'].includes(col);
  }, []);

  const isCountryColumn = useCallback((col) => {
    return col === 'designation' || col === 'destination';
  }, []);

  // Memoize handlers
  const handleCountryInput = useCallback((e, rowIndex, col) => {
    const value = e.target.value;
    updateCell(rowIndex, col, value);

    if (value.length >= 1) {
      const countries = REGION_COUNTRIES[region] || [];
      const suggestions = countries.filter(c =>
        c.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);

      if (suggestions.length > 0) {
        const rect = e.target.getBoundingClientRect();
        setCountryAutocomplete({
          show: true,
          x: rect.left,
          y: rect.bottom,
          suggestions,
          rowIndex,
          col
        });
      } else {
        setCountryAutocomplete(prev => ({ ...prev, show: false }));
      }
    } else {
      setCountryAutocomplete(prev => ({ ...prev, show: false }));
    }
  }, [region, updateCell]);

  const selectCountry = useCallback((country) => {
    updateCell(countryAutocomplete.rowIndex, countryAutocomplete.col, country);
    setCountryAutocomplete(prev => ({ ...prev, show: false }));
  }, [countryAutocomplete.rowIndex, countryAutocomplete.col, updateCell]);

  const handleBlur = useCallback((field, value) => {
    if (['product', 'network', 'traffic'].includes(field) && value && value.trim()) {
      const options = getFieldOptions(field);
      if (!options.includes(value.trim())) {
        addCustomOption(field, value.trim());
      }
    }
  }, [getFieldOptions, addCustomOption]);

  // If no selection, show empty state
  if (!serviceType || !listType || !region) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">📊</span>
        </div>
        <h3 className="text-lg font-bold text-slate-700 mb-2">Select Options Above</h3>
        <p className="text-sm text-slate-500 max-w-xs">
          Choose service type, list type, and region to start managing rates
        </p>
      </div>
    );
  }

  // Show skeleton during initial loading
  if (initialLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden p-4">
        <SkeletonTable rows={10} cols={columns.length} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Table Container */}
      <div className="flex-1 overflow-auto" ref={tableRef}>
        <table className="data-table w-full">
          <thead>
            <tr>
              <th className="text-white text-xs font-semibold px-2 py-3 text-center w-10">#</th>
              {headers.map((header, i) => (
                <th key={i} className="text-white text-xs font-semibold px-2 py-3 text-left">
                  {header}
                </th>
              ))}
              <th className="text-white text-xs font-semibold px-2 py-3 text-center w-12"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, displayIndex) => {
              const actualIndex = row._originalIndex !== undefined ? row._originalIndex : displayIndex;

              return (
                <TableRow
                  key={row.id || displayIndex}
                  row={row}
                  displayIndex={displayIndex}
                  actualIndex={actualIndex}
                  columns={columns}
                  onDelete={deleteRow}
                  onUpdate={updateCell}
                  onBlur={handleBlur}
                  onCountryInput={handleCountryInput}
                  getFieldOptions={getFieldOptions}
                  isDropdownColumn={isDropdownColumn}
                  isCountryColumn={isCountryColumn}
                />
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="text-center py-8 text-slate-400">
                  {ratesSearchTerm ? `No results for "${ratesSearchTerm}"` : 'No data yet. Click "Add Row" to start.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Country Autocomplete Dropdown */}
      {countryAutocomplete.show && (
        <div
          className="country-autocomplete show"
          style={{
            left: countryAutocomplete.x,
            top: countryAutocomplete.y
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {countryAutocomplete.suggestions.map((country) => (
            <div
              key={country}
              className="country-option"
              onClick={() => selectCountry(country)}
            >
              {country}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
