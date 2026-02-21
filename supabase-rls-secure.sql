-- TeleRoute App - SECURE Row Level Security Policies
-- Run this SQL in Supabase SQL Editor AFTER setting up authentication
-- This replaces the "allow all" policies with proper user-based access control

-- ========================================
-- STEP 1: DROP EXISTING INSECURE POLICIES
-- ========================================
DROP POLICY IF EXISTS "Allow all operations on rates" ON rates;
DROP POLICY IF EXISTS "Allow all operations on companies" ON companies;
DROP POLICY IF EXISTS "Allow all operations on meetings" ON meetings;
DROP POLICY IF EXISTS "Allow all operations on meeting_files" ON meeting_files;
DROP POLICY IF EXISTS "Allow all operations on custom_options" ON custom_options;

-- ========================================
-- STEP 2: CREATE SECURE RLS POLICIES
-- ========================================

-- RATES TABLE POLICIES
-- Users can only see their own rates
CREATE POLICY "Users can view own rates" ON rates
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert rates for themselves
CREATE POLICY "Users can insert own rates" ON rates
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own rates
CREATE POLICY "Users can update own rates" ON rates
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own rates
CREATE POLICY "Users can delete own rates" ON rates
    FOR DELETE
    USING (auth.uid() = user_id);

-- COMPANIES TABLE POLICIES
CREATE POLICY "Users can view own companies" ON companies
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companies" ON companies
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies" ON companies
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies" ON companies
    FOR DELETE
    USING (auth.uid() = user_id);

-- MEETINGS TABLE POLICIES
CREATE POLICY "Users can view own meetings" ON meetings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meetings" ON meetings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings" ON meetings
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meetings" ON meetings
    FOR DELETE
    USING (auth.uid() = user_id);

-- MEETING FILES TABLE POLICIES
-- Users can access files for meetings they own
CREATE POLICY "Users can view own meeting files" ON meeting_files
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM meetings
            WHERE meetings.id = meeting_files.meeting_id
            AND meetings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert files for own meetings" ON meeting_files
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM meetings
            WHERE meetings.id = meeting_files.meeting_id
            AND meetings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update files for own meetings" ON meeting_files
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM meetings
            WHERE meetings.id = meeting_files.meeting_id
            AND meetings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete files for own meetings" ON meeting_files
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM meetings
            WHERE meetings.id = meeting_files.meeting_id
            AND meetings.user_id = auth.uid()
        )
    );

-- CUSTOM OPTIONS TABLE POLICIES
CREATE POLICY "Users can view own custom options" ON custom_options
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom options" ON custom_options
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom options" ON custom_options
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom options" ON custom_options
    FOR DELETE
    USING (auth.uid() = user_id);

-- ========================================
-- STEP 3: VERIFICATION
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SECURE RLS POLICIES APPLIED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'All tables now require authentication.';
    RAISE NOTICE 'Users can only access their own data.';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: Before applying these policies:';
    RAISE NOTICE '1. Set up Supabase Authentication';
    RAISE NOTICE '2. Update your app to handle auth';
    RAISE NOTICE '3. Migrate existing data to have user_id set';
    RAISE NOTICE '';
    RAISE NOTICE 'To test: Try accessing data without auth -';
    RAISE NOTICE 'it should return empty results.';
END $$;
