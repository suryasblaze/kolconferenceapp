-- TeleRoute App - FINAL FIXED Supabase Database Schema
-- This version uses TEXT for IDs to match your app's format
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension (just in case)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables
DROP TABLE IF EXISTS meeting_files CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS custom_options CASCADE;
DROP TABLE IF EXISTS rates CASCADE;

-- ========================================
-- 1. RATES TABLE
-- ========================================
CREATE TABLE rates (
    id TEXT PRIMARY KEY DEFAULT 'rate_' || floor(random() * 1000000000000)::text,
    user_id UUID DEFAULT auth.uid(),

    -- Context
    service_type TEXT NOT NULL,
    list_type TEXT NOT NULL,  -- Removed CHECK constraint to allow any value
    region TEXT NOT NULL,

    -- SMS Fields
    designation TEXT,

    -- VOICE Fields
    destination TEXT,

    -- Common Fields
    product TEXT,
    network TEXT,
    breakout TEXT,
    rate TEXT,
    traffic TEXT,
    billing_increment TEXT,
    display TEXT,
    tps TEXT,
    cap TEXT,
    acd TEXT,
    asr TEXT,
    hop TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. COMPANIES TABLE
-- ========================================
CREATE TABLE companies (
    id TEXT PRIMARY KEY,  -- Changed to TEXT to match your app's IDs
    user_id UUID DEFAULT auth.uid(),

    company_name TEXT NOT NULL,
    service_type TEXT NOT NULL,

    -- Contact Information
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    skype TEXT,
    whatsapp TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. MEETINGS TABLE
-- ========================================
CREATE TABLE meetings (
    id TEXT PRIMARY KEY,  -- Changed to TEXT to match your app's IDs
    user_id UUID DEFAULT auth.uid(),

    -- Company Reference (nullable)
    company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,

    -- Meeting Details
    company TEXT NOT NULL,
    subject TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    service_type TEXT NOT NULL,
    status TEXT DEFAULT 'scheduled',

    -- Contact Information
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    skype TEXT,
    whatsapp TEXT,

    -- Meeting Notes & Details
    strong_region TEXT,
    looking_for TEXT,
    active_status TEXT,
    reason TEXT,
    payable TEXT,
    deal_proposals TEXT,
    route_issue TEXT,
    notes TEXT,

    -- Client Offers (JSONB array)
    client_offers JSONB DEFAULT '[]'::jsonb,

    -- Linked Rates (JSONB array)
    linked_rates JSONB DEFAULT '[]'::jsonb,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. MEETING FILES TABLE
-- ========================================
CREATE TABLE meeting_files (
    id TEXT PRIMARY KEY DEFAULT 'file_' || floor(random() * 1000000000000)::text,
    meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,

    file_name TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    file_url TEXT,
    file_data TEXT,  -- Base64 encoded

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5. CUSTOM OPTIONS TABLE
-- ========================================
CREATE TABLE custom_options (
    id TEXT PRIMARY KEY DEFAULT 'option_' || floor(random() * 1000000000000)::text,
    user_id UUID DEFAULT auth.uid(),

    option_type TEXT NOT NULL CHECK (option_type IN ('product', 'network', 'traffic')),
    option_value TEXT NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, option_type, option_value)
);

-- ========================================
-- INDEXES for Performance
-- ========================================
CREATE INDEX idx_rates_service_list_region ON rates(user_id, service_type, list_type, region);
CREATE INDEX idx_rates_designation ON rates(designation) WHERE designation IS NOT NULL;
CREATE INDEX idx_rates_destination ON rates(destination) WHERE destination IS NOT NULL;

CREATE INDEX idx_companies_user_service ON companies(user_id, service_type);
CREATE INDEX idx_companies_name ON companies(company_name);

CREATE INDEX idx_meetings_user_date ON meetings(user_id, date DESC);
CREATE INDEX idx_meetings_company_id ON meetings(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_meetings_company_name ON meetings(company);

CREATE INDEX idx_meeting_files_meeting ON meeting_files(meeting_id);

CREATE INDEX idx_custom_options_user_type ON custom_options(user_id, option_type);

-- ========================================
-- ENABLE ROW LEVEL SECURITY
-- ========================================
ALTER TABLE rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_options ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES (Allow all for now)
-- ========================================
CREATE POLICY "Allow all operations on rates" ON rates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on companies" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on meetings" ON meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on meeting_files" ON meeting_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on custom_options" ON custom_options FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- AUTO-UPDATE TRIGGERS
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rates_updated_at BEFORE UPDATE ON rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '✅ Database schema created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Key Changes:';
    RAISE NOTICE '  - IDs are TEXT (not UUID) to match your app';
    RAISE NOTICE '  - list_type accepts any value (not just Target/AFR)';
    RAISE NOTICE '  - All proper columns for rates, companies, meetings';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Now run the migration script!';
END $$;
