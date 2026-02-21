import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { validateCompany, sanitizeString } from '../lib/validation';

const useStore = create(
  persist(
    (set, get) => ({
      // UI State
      activeTab: 'rates',
      headerCollapsed: false,
      rotateOverlayDismissed: false,
      loading: false,
      loadingMessage: 'Loading...',
      initialLoading: true, // For skeleton loading on first load

      // Service Type Selections
      serviceType: null,
      listType: null,
      region: null,
      companiesServiceType: 'SMS',
      meetingsServiceType: 'SMS',
      clientOffersServiceType: 'SMS',
      ourOffersServiceType: 'SMS',

      // Data
      data: {},
      companies: [],
      meetings: [],
      customOptions: {
        product: [],
        network: [],
        traffic: []
      },

      // Meeting Date
      currentMeetingDate: new Date().toISOString().split('T')[0],

      // Track deleted IDs
      deletedRateIds: [],
      deletedCompanyIds: [],
      deletedMeetingIds: [],

      // Toast
      toast: null,

      // Modals
      importModalOpen: false,
      calendarOpen: false,
      scheduleModalOpen: false,
      meetingModalOpen: false,
      comparisonModalOpen: false,
      schedulingCompanyId: null,
      editingMeetingId: null,

      // Comparison data
      comparisonData: [],
      comparisonType: 'clientOffers', // 'clientOffers' or 'ourOffers'

      // Pending data for modals
      pendingImportData: null,
      pendingMeetingFiles: [],
      pendingLinkedRates: [],

      // Calendar view state
      calendarViewMonth: new Date().getMonth(),
      calendarViewYear: new Date().getFullYear(),

      // Rates search/filter state
      ratesSearchTerm: '',
      ratesFilterColumn: '', // Which column to filter by

      // Actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      setHeaderCollapsed: (collapsed) => set({ headerCollapsed: collapsed }),
      setRotateOverlayDismissed: (dismissed) => set({ rotateOverlayDismissed: dismissed }),
      setLoading: (loading, message = 'Loading...') => set({ loading, loadingMessage: message }),
      setInitialLoading: (initialLoading) => set({ initialLoading }),

      setServiceType: (type) => set({ serviceType: type }),
      setListType: (type) => set({ listType: type }),
      setRegion: (region) => set({ region }),
      setCompaniesServiceType: (type) => set({ companiesServiceType: type }),
      setMeetingsServiceType: (type) => set({ meetingsServiceType: type }),
      setClientOffersServiceType: (type) => set({ clientOffersServiceType: type }),
      setOurOffersServiceType: (type) => set({ ourOffersServiceType: type }),

      setCurrentMeetingDate: (date) => set({ currentMeetingDate: date }),

      // Rates search/filter actions
      setRatesSearchTerm: (term) => set({ ratesSearchTerm: term }),
      setRatesFilterColumn: (column) => set({ ratesFilterColumn: column }),
      clearRatesSearch: () => set({ ratesSearchTerm: '', ratesFilterColumn: '' }),

      // Toast
      showToast: (message, type = 'success', duration = 3000) => {
        set({ toast: { message, type } });
        setTimeout(() => set({ toast: null }), duration);
      },

      // Modal actions
      openImportModal: () => set({ importModalOpen: true }),
      closeImportModal: () => set({ importModalOpen: false, pendingImportData: null }),
      setPendingImportData: (data) => set({ pendingImportData: data }),

      openCalendar: () => set({ calendarOpen: true }),
      closeCalendar: () => set({ calendarOpen: false }),
      setCalendarView: (month, year) => set({ calendarViewMonth: month, calendarViewYear: year }),

      openScheduleModal: (companyId) => set({ scheduleModalOpen: true, schedulingCompanyId: companyId }),
      closeScheduleModal: () => set({ scheduleModalOpen: false, schedulingCompanyId: null }),

      openMeetingModal: (meetingId) => set({ meetingModalOpen: true, editingMeetingId: meetingId }),
      closeMeetingModal: () => set({
        meetingModalOpen: false,
        editingMeetingId: null,
        pendingMeetingFiles: [],
        pendingLinkedRates: []
      }),

      openComparisonModal: (data, type) => set({
        comparisonModalOpen: true,
        comparisonData: data,
        comparisonType: type
      }),
      closeComparisonModal: () => set({
        comparisonModalOpen: false,
        comparisonData: [],
        comparisonType: 'clientOffers'
      }),

      setPendingMeetingFiles: (files) => set({ pendingMeetingFiles: files }),
      setPendingLinkedRates: (rates) => set({ pendingLinkedRates: rates }),

      // Data key helper
      getDataKey: () => {
        const { serviceType, listType, region } = get();
        return `${serviceType}_${listType}_${region}`;
      },

      getCurrentData: () => {
        const key = get().getDataKey();
        return get().data[key] || [];
      },

      setCurrentData: (newData) => {
        const key = get().getDataKey();
        set((state) => ({
          data: { ...state.data, [key]: newData }
        }));
      },

      // Rate operations
      addRow: () => {
        const { serviceType } = get();
        const newRow = serviceType === 'VOICE'
          ? { id: `rate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, destination: '', product: '', breakout: '', rate: '', billingIncrement: '', display: '', acd: '', asr: '', hop: '' }
          : { id: `rate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, designation: '', product: '', network: '', rate: '', traffic: '', display: '', tps: '', cap: '', hop: '' };

        const currentData = get().getCurrentData();
        get().setCurrentData([...currentData, newRow]);
      },

      updateCell: (index, field, value) => {
        const currentData = get().getCurrentData();
        const newData = [...currentData];
        newData[index] = { ...newData[index], [field]: value };
        get().setCurrentData(newData);
      },

      deleteRow: (index) => {
        const currentData = get().getCurrentData();
        const rowToDelete = currentData[index];
        if (rowToDelete?.id) {
          set((state) => ({
            deletedRateIds: [...state.deletedRateIds, rowToDelete.id]
          }));
        }
        const newData = currentData.filter((_, i) => i !== index);
        get().setCurrentData(newData);
      },

      // Company operations
      addCompany: (company) => {
        // Validate company data
        const validation = validateCompany(company);
        if (!validation.valid) {
          get().showToast(validation.errors[0], 'error');
          return false;
        }

        const newCompany = {
          id: `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: sanitizeString(company.name),
          phone: sanitizeString(company.phone || ''),
          email: sanitizeString(company.email || ''),
          contactPerson: sanitizeString(company.contactPerson || ''),
          skype: sanitizeString(company.skype || ''),
          whatsapp: sanitizeString(company.whatsapp || ''),
          serviceType: company.serviceType || 'SMS',
          createdBy: sanitizeString(company.createdBy || '')
        };
        set((state) => ({
          companies: [...state.companies, newCompany]
        }));
        // Auto-save to Supabase
        get().saveSingleCompanyToSupabase(newCompany);
        return true;
      },

      updateCompany: (companyId, updates) => {
        // Sanitize string inputs
        const sanitizedUpdates = {};
        for (const [key, value] of Object.entries(updates)) {
          sanitizedUpdates[key] = typeof value === 'string' ? sanitizeString(value) : value;
        }

        set((state) => ({
          companies: state.companies.map((c) =>
            c.id === companyId ? { ...c, ...sanitizedUpdates } : c
          )
        }));
        // Auto-save to Supabase
        const updatedCompany = get().companies.find(c => c.id === companyId);
        if (updatedCompany) {
          get().saveSingleCompanyToSupabase(updatedCompany);
        }
      },

      deleteCompany: async (companyId) => {
        set((state) => ({
          companies: state.companies.filter((c) => c.id !== companyId),
          deletedCompanyIds: [...state.deletedCompanyIds, companyId]
        }));
        // Delete from Supabase
        try {
          await supabase.from('companies').delete().eq('id', companyId);
        } catch (error) {
          get().showToast('Error deleting company', 'error');
        }
      },

      // Meeting operations
      addMeeting: (meeting) => {
        const newMeeting = {
          ...meeting,
          id: meeting.id || `meeting_${Date.now()}`
        };
        set((state) => ({
          meetings: [...state.meetings, newMeeting]
        }));
      },

      updateMeeting: (meetingId, updates) => {
        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.id === meetingId ? { ...m, ...updates } : m
          )
        }));
        // Auto-save to Supabase
        const updatedMeeting = get().meetings.find(m => m.id === meetingId);
        if (updatedMeeting) {
          get().saveSingleMeetingToSupabase(updatedMeeting);
        }
      },

      deleteMeeting: async (meetingId) => {
        set((state) => ({
          meetings: state.meetings.filter((m) => m.id !== meetingId),
          deletedMeetingIds: [...state.deletedMeetingIds, meetingId]
        }));
        // Delete from Supabase
        try {
          await supabase.from('meetings').delete().eq('id', meetingId);
        } catch (error) {
          get().showToast('Error deleting meeting', 'error');
        }
      },

      getMeetingsForDate: (dateStr) => {
        const { meetings, meetingsServiceType } = get();
        return meetings.filter((m) =>
          m.date === dateStr && m.serviceType === meetingsServiceType
        );
      },

      // Custom options
      addCustomOption: (field, value) => {
        if (!value || value.trim() === '') return;
        set((state) => {
          const existing = state.customOptions[field] || [];
          if (existing.includes(value.trim())) return state;
          return {
            customOptions: {
              ...state.customOptions,
              [field]: [...existing, value.trim()]
            }
          };
        });
      },

      // Clear all data for current selection
      clearAllData: () => {
        const currentData = get().getCurrentData();
        const idsToDelete = currentData.filter(r => r.id).map(r => r.id);
        set((state) => ({
          deletedRateIds: [...state.deletedRateIds, ...idsToDelete]
        }));
        get().setCurrentData([]);
      },

      // Load from Supabase
      loadFromSupabase: async () => {
        get().setLoading(true, 'Loading data...');
        try {
          // Load rates
          const { data: ratesData, error: ratesError } = await supabase
            .from('rates')
            .select('*')
            .order('created_at', { ascending: true });

          // Errors handled by general catch block

          // Helper to check if a rate row has meaningful data
          const isRowEmpty = (rate) => {
            if (rate.service_type === 'SMS') {
              return !rate.designation && !rate.product && !rate.network && !rate.rate;
            } else {
              return !rate.destination && !rate.product && !rate.breakout && !rate.rate;
            }
          };

          // Reconstruct data from individual rate rows, filtering out empty ones
          const newData = {};
          if (ratesData && ratesData.length > 0) {
            ratesData.forEach((rate) => {
              // Skip empty rows
              if (isRowEmpty(rate)) return;

              const key = `${rate.service_type}_${rate.list_type}_${rate.region}`;
              if (!newData[key]) {
                newData[key] = [];
              }

              const rateObj = { id: rate.id };
              if (rate.service_type === 'SMS') {
                rateObj.designation = rate.designation || '';
                rateObj.product = rate.product || '';
                rateObj.network = rate.network || '';
                rateObj.rate = rate.rate || '';
                rateObj.traffic = rate.traffic || '';
                rateObj.display = rate.display || '';
                rateObj.tps = rate.tps || '';
                rateObj.cap = rate.cap || '';
                rateObj.hop = rate.hop || '';
              } else {
                rateObj.destination = rate.destination || '';
                rateObj.product = rate.product || '';
                rateObj.breakout = rate.breakout || '';
                rateObj.rate = rate.rate || '';
                rateObj.billingIncrement = rate.billing_increment || '';
                rateObj.display = rate.display || '';
                rateObj.acd = rate.acd || '';
                rateObj.asr = rate.asr || '';
                rateObj.hop = rate.hop || '';
              }
              newData[key].push(rateObj);
            });
          }

          // Load companies
          const { data: companiesData, error: companiesError } = await supabase
            .from('companies')
            .select('*')
            .order('created_at', { ascending: true });

          // Errors handled by general catch block

          const companies = (companiesData || []).map((c) => ({
            id: c.id,
            name: c.company_name,
            phone: c.phone || '',
            email: c.email || '',
            contactPerson: c.contact_person || '',
            skype: c.skype || '',
            whatsapp: c.whatsapp || '',
            serviceType: c.service_type,
            createdBy: c.created_by || ''
          }));

          // Load meetings
          const { data: meetingsData, error: meetingsError } = await supabase
            .from('meetings')
            .select('*')
            .order('date', { ascending: true });

          // Errors handled by general catch block

          // Debug logging removed for production security

          // Load meeting files
          const { data: filesData } = await supabase
            .from('meeting_files')
            .select('*');

          // Group files by meeting_id
          const filesByMeetingId = {};
          if (filesData) {
            filesData.forEach((f) => {
              if (!filesByMeetingId[f.meeting_id]) {
                filesByMeetingId[f.meeting_id] = [];
              }
              filesByMeetingId[f.meeting_id].push({
                id: f.id,
                name: f.file_name,
                size: f.file_size,
                type: f.file_type,
                storagePath: f.storage_path || null,
                url: f.file_url || null,
                data: f.file_data || null // Legacy base64 data
              });
            });
          }

          const meetings = (meetingsData || []).map((m) => ({
            id: m.id,
            companyId: m.company_id,
            companyName: m.company,
            date: m.date,
            startTime: m.start_time,
            endTime: m.end_time,
            serviceType: m.service_type,
            status: m.status || 'scheduled',
            subject: m.subject || '',
            contactPerson: m.contact_person || '',
            email: m.email || '',
            phone: m.phone || '',
            skype: m.skype || '',
            whatsapp: m.whatsapp || '',
            scheduledBy: m.scheduled_by || '',
            strongRegion: m.strong_region || '',
            lookingFor: m.looking_for || '',
            notes: m.notes || '',
            activeStatus: m.active_status || '',
            reason: m.reason || '',
            payable: m.payable || '',
            dealProposals: m.deal_proposals || '',
            routeIssue: m.route_issue || '',
            files: filesByMeetingId[m.id] || [],
            linkedRates: m.linked_rates || [],
            clientOffers: m.client_offers || []
          }));

          // Load custom options
          const { data: optionsData } = await supabase
            .from('custom_options')
            .select('*');

          const customOptions = { product: [], network: [], traffic: [] };
          if (optionsData) {
            optionsData.forEach((opt) => {
              if (customOptions[opt.type]) {
                customOptions[opt.type].push(opt.value);
              }
            });
          }

          set({
            data: newData,
            companies,
            meetings,
            customOptions,
            deletedRateIds: [],
            deletedCompanyIds: [],
            deletedMeetingIds: []
          });

          get().showToast('Data loaded successfully', 'success');
        } catch (error) {
          get().showToast('Error loading data', 'error');
        } finally {
          get().setLoading(false);
          set({ initialLoading: false });
        }
      },

      // Save single company
      saveSingleCompanyToSupabase: async (company) => {
        try {
          const record = {
            id: company.id,
            company_name: company.name,
            phone: company.phone || '',
            email: company.email || '',
            contact_person: company.contactPerson || '',
            skype: company.skype || '',
            whatsapp: company.whatsapp || '',
            service_type: company.serviceType,
            created_by: company.createdBy || ''
          };

          await supabase.from('companies').upsert(record, { onConflict: 'id' });
        } catch (error) {
          get().showToast('Error saving company', 'error');
        }
      },

      // Save single meeting
      saveSingleMeetingToSupabase: async (meeting) => {
        try {
          // Note: files are stored in separate meeting_files table, not here
          const record = {
            id: meeting.id,
            company_id: meeting.companyId,
            company: meeting.companyName,
            date: meeting.date,
            start_time: meeting.startTime,
            end_time: meeting.endTime,
            service_type: meeting.serviceType,
            status: meeting.status || 'scheduled',
            subject: meeting.subject || '',
            contact_person: meeting.contactPerson || '',
            email: meeting.email || '',
            phone: meeting.phone || '',
            skype: meeting.skype || '',
            whatsapp: meeting.whatsapp || '',
            scheduled_by: meeting.scheduledBy || '',
            strong_region: meeting.strongRegion || '',
            looking_for: meeting.lookingFor || '',
            notes: meeting.notes || '',
            active_status: meeting.activeStatus || '',
            reason: meeting.reason || '',
            payable: meeting.payable || '',
            deal_proposals: meeting.dealProposals || '',
            route_issue: meeting.routeIssue || '',
            linked_rates: meeting.linkedRates || [],
            client_offers: meeting.clientOffers || [],
            updated_at: new Date().toISOString()
          };

          const { error } = await supabase.from('meetings').upsert(record, { onConflict: 'id' });

          if (error) {
            get().showToast('Error saving meeting to database', 'error');
            return false;
          }

          // Handle meeting files separately (stored in meeting_files table)
          if (meeting.files && meeting.files.length > 0) {
            await supabase.from('meeting_files').delete().eq('meeting_id', meeting.id);
            const fileRecords = meeting.files.map(f => ({
              meeting_id: meeting.id,
              file_name: f.name,
              file_size: f.size,
              file_type: f.type,
              storage_path: f.storagePath || null, // Use Supabase Storage path
              file_url: f.url || null,
              file_data: f.storagePath ? null : f.data // Only store base64 if no storage path (legacy)
            }));
            await supabase.from('meeting_files').insert(fileRecords);
          }

          return true;
        } catch (error) {
          get().showToast('Error saving meeting', 'error');
          return false;
        }
      },

      // Save all rates
      saveRatesToSupabase: async () => {
        const { data, deletedRateIds } = get();

        try {
          // Delete removed rates
          if (deletedRateIds.length > 0) {
            await supabase.from('rates').delete().in('id', deletedRateIds);
          }

          // Prepare rate records
          const rateRecords = [];
          for (const key of Object.keys(data)) {
            const [serviceType, listType, region] = key.split('_');
            const rows = data[key] || [];

            rows.forEach((row) => {
              if (!row.id) {
                row.id = 'rate_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
              }

              const record = {
                id: row.id,
                service_type: serviceType,
                list_type: listType,
                region: region,
                designation: row.designation || null,
                destination: row.destination || null,
                product: row.product || null,
                network: row.network || null,
                breakout: row.breakout || null,
                rate: row.rate || null,
                traffic: row.traffic || null,
                billing_increment: row.billingIncrement || null,
                display: row.display || null,
                tps: row.tps || null,
                cap: row.cap || null,
                acd: row.acd || null,
                asr: row.asr || null,
                hop: row.hop || null
              };

              rateRecords.push(record);
            });
          }

          // Batch upsert
          for (let i = 0; i < rateRecords.length; i += 100) {
            const batch = rateRecords.slice(i, i + 100);
            await supabase.from('rates').upsert(batch, { onConflict: 'id' });
          }

          set({ deletedRateIds: [] });
        } catch (error) {
          throw error;
        }
      },

      // Save state (main save function)
      saveState: async () => {
        get().setLoading(true, 'Saving...');
        try {
          await get().saveRatesToSupabase();
          get().showToast('Data saved successfully', 'success');
        } catch (error) {
          get().showToast('Error saving data', 'error');
        } finally {
          get().setLoading(false);
        }
      },

      // Export rates to Excel
      exportRatesToExcel: async () => {
        const XLSX = await import('xlsx');
        const { serviceType, listType, region, getCurrentData } = get();
        const data = getCurrentData();

        if (!data || data.length === 0) {
          get().showToast('No data to export', 'error');
          return;
        }

        // Prepare data for export
        const exportData = data.map(row => {
          const { id, ...rest } = row;
          return rest;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Rates');

        const fileName = `${serviceType}_${listType}_${region}_rates_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        get().showToast('Rates exported successfully', 'success');
      },

      // Export all regions to Excel
      exportAllRegionsToExcel: async () => {
        const XLSX = await import('xlsx');
        const { data, serviceType, listType } = get();

        if (!serviceType || !listType) {
          get().showToast('Please select service type and list type first', 'error');
          return;
        }

        const wb = XLSX.utils.book_new();
        let totalRows = 0;

        // Get all regions for current serviceType and listType
        const regionKeys = Object.keys(data).filter(key => {
          const [type, list] = key.split('_');
          return type === serviceType && list === listType;
        });

        if (regionKeys.length === 0) {
          get().showToast('No data to export for current selection', 'error');
          return;
        }

        regionKeys.forEach(key => {
          const [, , region] = key.split('_');
          const regionData = data[key] || [];

          if (regionData.length > 0) {
            const exportData = regionData.map(row => {
              const { id, ...rest } = row;
              return rest;
            });

            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, region);
            totalRows += regionData.length;
          }
        });

        if (totalRows === 0) {
          get().showToast('No data to export', 'error');
          return;
        }

        const fileName = `${serviceType}_${listType}_all_regions_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        get().showToast(`Exported ${totalRows} rows from ${regionKeys.length} regions`, 'success');
      },

      // Export Our Offers to Excel
      exportOurOffersToExcel: async () => {
        const XLSX = await import('xlsx');
        const { meetings, ourOffersServiceType, data } = get();

        // Helper to resolve linkedRates
        const resolveRate = (linkedRate) => {
          if (!linkedRate) return null;
          if (linkedRate.fullData) return linkedRate.fullData;
          if (linkedRate.designation || linkedRate.destination || linkedRate.rate) return linkedRate;
          if (linkedRate.key && typeof linkedRate.index === 'number') {
            const rateData = data[linkedRate.key]?.[linkedRate.index];
            if (rateData) {
              const [serviceType, listType, region] = linkedRate.key.split('_');
              return { ...rateData, serviceType, listType, region };
            }
          }
          return linkedRate;
        };

        const exportData = [];
        meetings.forEach(meeting => {
          if ((meeting.serviceType || 'SMS') !== ourOffersServiceType) return;
          const linkedRates = meeting.linkedRates || [];
          if (!Array.isArray(linkedRates) || linkedRates.length === 0) return;

          linkedRates.forEach(lr => {
            const rate = resolveRate(lr);
            if (!rate) return;

            exportData.push({
              Company: meeting.companyName,
              Date: meeting.date,
              Time: meeting.startTime,
              Type: rate.serviceType || ourOffersServiceType,
              Region: rate.region || '',
              Designation: rate.designation || rate.destination || '',
              Product: rate.product || '',
              Rate: rate.rate || '',
              Network: rate.network || rate.breakout || '',
              Traffic: rate.traffic || rate.billingIncrement || ''
            });
          });
        });

        if (exportData.length === 0) {
          get().showToast('No Our Offers data to export', 'error');
          return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Our Offers');

        const fileName = `our_offers_${ourOffersServiceType}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        get().showToast('Our Offers exported successfully', 'success');
      },

      // Export Client Offers to Excel
      exportClientOffersToExcel: async () => {
        const XLSX = await import('xlsx');
        const { meetings, clientOffersServiceType } = get();

        const exportData = [];
        meetings.forEach(meeting => {
          if ((meeting.serviceType || 'SMS') !== clientOffersServiceType) return;
          const clientOffers = meeting.clientOffers || [];
          if (!Array.isArray(clientOffers) || clientOffers.length === 0) return;

          clientOffers.forEach(offer => {
            if (clientOffersServiceType === 'SMS') {
              exportData.push({
                Company: meeting.companyName,
                Date: meeting.date,
                Designation: offer.designation || '',
                Product: offer.product || '',
                Network: offer.network || '',
                Rate: offer.rate || '',
                Traffic: offer.traffic || '',
                Display: offer.display || '',
                TPS: offer.tps || '',
                CAP: offer.cap || '',
                HOP: offer.hop || ''
              });
            } else {
              exportData.push({
                Company: meeting.companyName,
                Date: meeting.date,
                Destination: offer.destination || '',
                Product: offer.product || '',
                Breakout: offer.breakout || '',
                Rate: offer.rate || '',
                BillingIncrement: offer.billingIncrement || '',
                Display: offer.display || '',
                ACD: offer.acd || '',
                ASR: offer.asr || '',
                HOP: offer.hop || ''
              });
            }
          });
        });

        if (exportData.length === 0) {
          get().showToast('No Client Offers data to export', 'error');
          return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Client Offers');

        const fileName = `client_offers_${clientOffersServiceType}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        get().showToast('Client Offers exported successfully', 'success');
      },

      // Download template
      downloadTemplate: async () => {
        const XLSX = await import('xlsx');
        const { serviceType } = get();

        const headers = serviceType === 'VOICE'
          ? ['Destination', 'Product', 'Breakout', 'Rate', 'BillingIncrement', 'Display', 'ACD', 'ASR', 'HOP']
          : ['Designation', 'Product', 'Network', 'Rate', 'Traffic', 'Display', 'TPS', 'CAP', 'HOP'];

        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');

        const fileName = `${serviceType || 'SMS'}_rates_template.xlsx`;
        XLSX.writeFile(wb, fileName);
        get().showToast('Template downloaded', 'success');
      },

      // ==================== MEETING REMINDERS ====================
      notifiedMeetings: new Set(),
      reminderInterval: null,

      // Request notification permission
      requestNotificationPermission: () => {
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      },

      // Start meeting reminder system
      startMeetingReminders: () => {
        // Request permission first
        get().requestNotificationPermission();

        // Clear existing interval
        if (get().reminderInterval) {
          clearInterval(get().reminderInterval);
        }

        // Check every minute
        const interval = setInterval(() => {
          get().checkMeetingReminders();
        }, 60000);

        set({ reminderInterval: interval });

        // Check immediately
        get().checkMeetingReminders();
      },

      // Stop meeting reminders
      stopMeetingReminders: () => {
        if (get().reminderInterval) {
          clearInterval(get().reminderInterval);
          set({ reminderInterval: null });
        }
      },

      // Check for upcoming meetings
      checkMeetingReminders: () => {
        const { meetings, notifiedMeetings, showMeetingReminder, openMeetingModal } = get();
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Only check meetings for today
        const todaysMeetings = meetings.filter(m => m.date === today);

        todaysMeetings.forEach(meeting => {
          if (!meeting.startTime) return;

          const [hours, minutes] = meeting.startTime.split(':').map(Number);
          const meetingTime = new Date();
          meetingTime.setHours(hours, minutes, 0, 0);

          const diffMs = meetingTime - now;
          const diffMinutes = diffMs / 60000;

          // 15 minutes before
          if (diffMinutes > 10 && diffMinutes <= 15) {
            const key = `${meeting.id}_15min`;
            if (!notifiedMeetings.has(key)) {
              notifiedMeetings.add(key);
              set({ notifiedMeetings: new Set(notifiedMeetings) });
              showMeetingReminder(meeting, Math.round(diffMinutes), false);
            }
          }

          // 5 minutes before
          if (diffMinutes > 0 && diffMinutes <= 5) {
            const key = `${meeting.id}_5min`;
            if (!notifiedMeetings.has(key)) {
              notifiedMeetings.add(key);
              set({ notifiedMeetings: new Set(notifiedMeetings) });
              showMeetingReminder(meeting, Math.round(diffMinutes), true);
            }
          }

          // Meeting starting now (within 1 minute)
          if (diffMinutes >= -1 && diffMinutes <= 1) {
            const key = `${meeting.id}_now`;
            if (!notifiedMeetings.has(key)) {
              notifiedMeetings.add(key);
              set({ notifiedMeetings: new Set(notifiedMeetings) });
              showMeetingReminder(meeting, 0, true);
            }
          }
        });
      },

      // Show meeting reminder
      showMeetingReminder: (meeting, minutesUntil, isUrgent = false) => {
        const { showToast, openMeetingModal } = get();

        let title, message;
        if (minutesUntil <= 0) {
          title = 'Meeting Starting Now!';
          message = `Meeting with ${meeting.companyName} is starting now!`;
        } else if (minutesUntil <= 5) {
          title = 'Meeting in ' + minutesUntil + ' minutes';
          message = `Meeting with ${meeting.companyName} starts in ${minutesUntil} minutes!`;
        } else {
          title = 'Upcoming Meeting';
          message = `Meeting with ${meeting.companyName} in ${minutesUntil} minutes`;
        }

        // Show in-app toast
        showToast(message, isUrgent ? 'error' : 'info', 6000);

        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification(title, {
            body: message,
            icon: '/logo.gif',
            tag: meeting.id,
            requireInteraction: isUrgent
          });

          notification.onclick = () => {
            window.focus();
            openMeetingModal(meeting.id);
            notification.close();
          };
        }
      }
    }),
    {
      name: 'teleroute-storage',
      partialize: (state) => ({
        activeTab: state.activeTab,
        serviceType: state.serviceType,
        listType: state.listType,
        region: state.region,
        rotateOverlayDismissed: state.rotateOverlayDismissed
      })
    }
  )
);

export default useStore;
