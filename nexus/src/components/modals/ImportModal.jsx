import { useRef } from 'react';
import { X, FileXls, Upload } from '@phosphor-icons/react';
import * as XLSX from 'xlsx';
import useStore from '../../store/useStore';
import { SMS_COLUMNS, VOICE_COLUMNS } from '../../data/constants';

export default function ImportModal() {
  const {
    importModalOpen,
    closeImportModal,
    pendingImportData,
    setPendingImportData,
    serviceType,
    setCurrentData,
    getCurrentData,
    showToast
  } = useStore();

  const dropzoneRef = useRef(null);

  if (!importModalOpen) return null;

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (jsonData.length < 2) {
          showToast('File is empty or has no data rows', 'error');
          return;
        }

        // Get headers from first row
        const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
        const columns = serviceType === 'VOICE' ? VOICE_COLUMNS : SMS_COLUMNS;

        // Map column indices
        const columnMap = {};
        columns.forEach(col => {
          const idx = headers.findIndex(h =>
            h === col.toLowerCase() ||
            h.includes(col.toLowerCase()) ||
            col.toLowerCase().includes(h)
          );
          if (idx !== -1) {
            columnMap[col] = idx;
          }
        });

        // Parse data rows
        const parsedData = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.every(cell => !cell)) continue; // Skip empty rows

          const rowObj = { id: `rate_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}` };
          columns.forEach(col => {
            const idx = columnMap[col];
            rowObj[col] = idx !== undefined && row[idx] !== undefined ? String(row[idx]) : '';
          });
          parsedData.push(rowObj);
        }

        setPendingImportData(parsedData);
        showToast(`Found ${parsedData.length} rows to import`, 'info');
      } catch (error) {
        console.error('Error parsing file:', error);
        showToast('Error parsing file. Please check the format.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzoneRef.current?.classList.remove('border-[#3BC1A8]', 'bg-blue-50');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzoneRef.current?.classList.add('border-[#3BC1A8]', 'bg-blue-50');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzoneRef.current?.classList.remove('border-[#3BC1A8]', 'bg-blue-50');
  };

  const confirmImport = () => {
    if (!pendingImportData || pendingImportData.length === 0) {
      showToast('No data to import', 'error');
      return;
    }

    const currentData = getCurrentData();
    setCurrentData([...currentData, ...pendingImportData]);
    showToast(`Imported ${pendingImportData.length} rows`, 'success');
    closeImportModal();
  };

  return (
    <div className="import-modal show" onClick={closeImportModal}>
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Import Excel</h3>
          <button onClick={closeImportModal} className="p-2 text-slate-400 hover:text-slate-600">
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Preview */}
        {pendingImportData && pendingImportData.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-slate-600 mb-2">
              Preview (<span className="font-semibold">{pendingImportData.length}</span> rows):
            </p>
            <div className="bg-slate-50 rounded-lg p-3 max-h-40 overflow-y-auto text-xs font-mono">
              {pendingImportData.slice(0, 5).map((row, i) => (
                <div key={i} className="mb-1 truncate">
                  {Object.values(row).slice(1, 4).join(' | ')}...
                </div>
              ))}
              {pendingImportData.length > 5 && (
                <div className="text-slate-400">...and {pendingImportData.length - 5} more</div>
              )}
            </div>
          </div>
        )}

        {/* Dropzone */}
        <div
          ref={dropzoneRef}
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center mb-4 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <FileXls size={48} className="mx-auto mb-3 text-slate-400" />
          <p className="text-sm text-slate-600 mb-2">Drop Excel file here or</p>
          <label className="inline-block px-4 py-2 bg-[#3BC1A8] text-white rounded-lg font-semibold text-sm cursor-pointer active:bg-[#249E94]">
            Browse Files
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <p className="text-[10px] text-slate-400 mt-3">Supports .xlsx and .xls files</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={closeImportModal}
            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={confirmImport}
            disabled={!pendingImportData || pendingImportData.length === 0}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import Data
          </button>
        </div>
      </div>
    </div>
  );
}
