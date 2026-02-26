-- =============================================
-- PWA Push Notifications Setup for Nexus
-- =============================================
-- STEP 1: First enable extensions from Supabase Dashboard:
--   Dashboard > Database > Extensions > enable "pg_cron" and "pg_net"
--
-- STEP 2: Run PART A below in SQL Editor
-- STEP 3: Run PART B below in SQL Editor (after extensions are enabled)
-- =============================================

-- ============ PART A: Tables (run this first) ============

-- 1. Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY DEFAULT 'pushsub_' || floor(random() * 1000000000000)::text,
    endpoint TEXT NOT NULL UNIQUE,
    keys_p256dh TEXT NOT NULL,
    keys_auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on push_subscriptions" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- 2. Create notification_log table (prevents duplicate notifications)
CREATE TABLE IF NOT EXISTS notification_log (
    id TEXT PRIMARY KEY DEFAULT 'notif_' || floor(random() * 1000000000000)::text,
    meeting_id TEXT NOT NULL,
    reminder_type TEXT NOT NULL, -- '15min', '5min', 'now'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meeting_id, reminder_type)
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on notification_log" ON notification_log FOR ALL USING (true) WITH CHECK (true);


-- ============ PART B: Cron Jobs (run AFTER enabling pg_cron and pg_net extensions) ============

-- 3. Schedule Edge Function every 5 minutes
SELECT cron.schedule(
    'meeting-reminder-check',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://cjtnbhnwdiprajdrkaai.supabase.co/functions/v1/meeting-reminder',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdG5iaG53ZGlwcmFqZHJrYWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMTk5MjYsImV4cCI6MjA4NTU5NTkyNn0.6Tqy1jW_CYRxg5JX4t0teB4aTg6Fyj0O0Paszsn8ThY'
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);

-- 4. Daily cleanup of old notification logs (older than 7 days)
SELECT cron.schedule(
    'cleanup-notification-logs',
    '0 0 * * *',
    $$
    DELETE FROM notification_log WHERE sent_at < NOW() - INTERVAL '7 days';
    $$
);
