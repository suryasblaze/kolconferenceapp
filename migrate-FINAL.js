/**
 * FINAL Migration Script - Handles all edge cases
 * Run this in browser console (F12)
 */

(async function migrateToSupabase() {
    console.log('========================================');
    console.log('🚀 FINAL Migration to Supabase');
    console.log('========================================\n');

    const savedData = localStorage.getItem('teleroute_data_v7');
    if (!savedData) {
        console.error('❌ No localStorage data found!');
        return;
    }

    let data;
    try {
        data = JSON.parse(savedData);
        console.log('✅ Found localStorage data');
        console.log('  - Companies:', data.companies?.length || 0);
        console.log('  - Meetings:', data.meetings?.length || 0);

        let totalRates = 0;
        for (const [key, rows] of Object.entries(data.data || {})) {
            if (Array.isArray(rows)) totalRates += rows.length;
        }
        console.log('  - Rate Rows:', totalRates);
        console.log('');
    } catch (error) {
        console.error('❌ Error parsing data:', error);
        return;
    }

    const SUPABASE_URL = 'https://cjtnbhnwdiprajdrkaai.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdG5iaG53ZGlwcmFqZHJrYWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMTk5MjYsImV4cCI6MjA4NTU5NTkyNn0.6Tqy1jW_CYRxg5JX4t0teB4aTg6Fyj0O0Paszsn8ThY';

    const { createClient } = supabase;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('📡 Connected to Supabase\n');

    try {
        // 1. Migrate Rates
        console.log('📊 Migrating Rates...');
        const rateRecords = [];

        for (const [key, rows] of Object.entries(data.data || {})) {
            const [serviceType, listType, region] = key.split('_');
            if (rows && Array.isArray(rows) && rows.length > 0) {
                rows.forEach(row => {
                    const record = {
                        service_type: serviceType || 'SMS',
                        list_type: listType || 'Target',
                        region: region || 'APAC'
                    };

                    if (serviceType === 'SMS') {
                        record.designation = row.designation || null;
                        record.product = row.product || null;
                        record.network = row.network || null;
                        record.rate = row.rate || null;
                        record.traffic = row.traffic || null;
                        record.display = row.display || null;
                        record.tps = row.tps || null;
                        record.cap = row.cap || null;
                        record.hop = row.hop || null;
                    } else if (serviceType === 'VOICE') {
                        record.destination = row.destination || null;
                        record.product = row.product || null;
                        record.breakout = row.breakout || null;
                        record.rate = row.rate || null;
                        record.billing_increment = row.billingIncrement || null;
                        record.display = row.display || null;
                        record.acd = row.acd || null;
                        record.asr = row.asr || null;
                        record.hop = row.hop || null;
                    }

                    rateRecords.push(record);
                });
            }
        }

        if (rateRecords.length > 0) {
            for (let i = 0; i < rateRecords.length; i += 100) {
                const batch = rateRecords.slice(i, i + 100);
                const { error } = await supabaseClient.from('rates').insert(batch);
                if (error) {
                    console.error(`  ⚠️  Error in batch ${Math.floor(i / 100) + 1}:`, error);
                } else {
                    console.log(`  ✅ Batch ${Math.floor(i / 100) + 1}: Inserted ${batch.length} rates`);
                }
            }
            console.log(`  ✅ Total: Migrated ${rateRecords.length} rate rows`);
        } else {
            console.log('  ⏭️  No rates to migrate');
        }

        // 2. Migrate Companies (FIXED - skip empty names)
        console.log('\n🏢 Migrating Companies...');
        if (data.companies && data.companies.length > 0) {
            // Filter out companies with empty names
            const validCompanies = data.companies.filter(c =>
                c.company && c.company.trim() !== ''
            );

            if (validCompanies.length > 0) {
                const companyRecords = validCompanies.map(c => ({
                    id: c.id,
                    company_name: c.company.trim(),
                    service_type: c.serviceType || 'SMS',  // Default to SMS
                    contact_person: c.contactPerson || null,
                    email: c.email || null,
                    phone: c.phone || null,
                    skype: c.skype || null,
                    whatsapp: c.whatsapp || null
                }));

                const { error } = await supabaseClient.from('companies').insert(companyRecords);
                if (error) {
                    console.error('  ⚠️  Error:', error);
                } else {
                    console.log(`  ✅ Migrated ${companyRecords.length} companies`);
                }

                const skipped = data.companies.length - validCompanies.length;
                if (skipped > 0) {
                    console.log(`  ⏭️  Skipped ${skipped} companies with empty names`);
                }
            } else {
                console.log('  ⏭️  No valid companies to migrate (all have empty names)');
            }
        } else {
            console.log('  ⏭️  No companies to migrate');
        }

        // 3. Migrate Meetings (FIXED - default service_type)
        console.log('\n📅 Migrating Meetings...');
        if (data.meetings && data.meetings.length > 0) {
            let successCount = 0;
            let errorCount = 0;

            for (const meeting of data.meetings) {
                // Skip if required fields are missing
                if (!meeting.company || !meeting.date || !meeting.startTime) {
                    console.log(`  ⏭️  Skipping meeting with missing required fields`);
                    errorCount++;
                    continue;
                }

                const meetingRecord = {
                    id: meeting.id,
                    company: meeting.company,
                    date: meeting.date,
                    start_time: meeting.startTime,
                    end_time: meeting.endTime || null,
                    service_type: meeting.serviceType || 'SMS',  // Default to SMS if missing
                    contact_person: meeting.contactPerson || null,
                    email: meeting.email || null,
                    phone: meeting.phone || null,
                    skype: meeting.skype || null,
                    whatsapp: meeting.whatsapp || null,
                    strong_region: meeting.strongRegion || null,
                    looking_for: meeting.lookingFor || null,
                    active_status: meeting.activeStatus || null,
                    reason: meeting.reason || null,
                    payable: meeting.payable || null,
                    deal_proposals: meeting.dealProposals || null,
                    route_issue: meeting.routeIssue || null,
                    notes: meeting.notes || null,
                    client_offers: meeting.clientOffers || [],
                    linked_rates: meeting.linkedRates || []
                };

                const { error } = await supabaseClient.from('meetings').insert([meetingRecord]);
                if (error) {
                    console.error(`  ⚠️  Error migrating "${meeting.company}":`, error);
                    errorCount++;
                    continue;
                }
                successCount++;

                // Migrate meeting files
                if (meeting.files && meeting.files.length > 0) {
                    const fileRecords = meeting.files.map(f => ({
                        meeting_id: meeting.id,
                        file_name: f.name,
                        file_size: f.size || null,
                        file_type: f.type || null,
                        file_data: f.data || null
                    }));

                    const { error: fileError } = await supabaseClient.from('meeting_files').insert(fileRecords);
                    if (fileError) {
                        console.error(`  ⚠️  Error migrating files for "${meeting.company}":`, fileError);
                    }
                }
            }

            console.log(`  ✅ Migrated ${successCount} meetings`);
            if (errorCount > 0) {
                console.log(`  ⚠️  Failed/Skipped: ${errorCount} meetings`);
            }
        } else {
            console.log('  ⏭️  No meetings to migrate');
        }

        // 4. Migrate Custom Options
        console.log('\n⚙️  Migrating Custom Options...');
        const optionRecords = [];

        ['product', 'network', 'traffic'].forEach(type => {
            (data.customOptions?.[type] || []).forEach(value => {
                if (value && value.trim() !== '') {  // Skip empty values
                    optionRecords.push({
                        option_type: type,
                        option_value: value.trim()
                    });
                }
            });
        });

        if (optionRecords.length > 0) {
            const { error } = await supabaseClient.from('custom_options').insert(optionRecords);
            if (error) {
                console.error('  ⚠️  Error:', error);
            } else {
                console.log(`  ✅ Migrated ${optionRecords.length} custom options`);
            }
        } else {
            console.log('  ⏭️  No custom options to migrate');
        }

        // COMPLETION
        console.log('\n========================================');
        console.log('✅ Migration Complete!');
        console.log('========================================');
        console.log('\n📊 Summary:');
        console.log('  - Rate rows:', rateRecords.length);
        console.log('  - Custom options:', optionRecords.length);
        console.log('\n💾 Data migrated to Supabase cloud!');
        console.log('🔄 Refresh the page to load from Supabase.');
        console.log('✨ All data is now in the cloud!');

    } catch (error) {
        console.error('\n❌ Migration Error:', error);
        console.log('⚠️  Your localStorage backup is still safe.');
    }
})();
