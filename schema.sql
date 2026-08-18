-- ============================================================
-- 24LIBRARY — PRODUCTION POSTGRESQL / SUPABASE DATABASE SCHEMA
-- ============================================================
-- Features:
-- 1. GiST Exclusion Constraints for ZERO double-booking race conditions
-- 2. Multi-Branch Isolation & Foreign Key Cascades
-- 3. Row Level Security (RLS) policies
-- 4. Real-time publication replication for live turnstiles
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 1. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY DEFAULT ('org_' || substr(md5(random()::text), 1, 10)),
    name TEXT NOT NULL,
    tagline TEXT,
    subscription_plan TEXT DEFAULT 'PREMIUM' CHECK (subscription_plan IN ('FREE', 'PREMIUM', 'ENTERPRISE')),
    contact_email TEXT,
    support_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BRANCHES
CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY DEFAULT ('br_' || substr(md5(random()::text), 1, 10)),
    org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE, -- e.g. 'MUM-01'
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    contact_person TEXT,
    capacity INTEGER DEFAULT 36,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SHIFTS
CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY DEFAULT ('sh_' || substr(md5(random()::text), 1, 10)),
    branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_time TIME NOT NULL, -- e.g. '06:00:00'
    end_time TIME NOT NULL,   -- e.g. '12:00:00'
    default_price NUMERIC(10, 2) NOT NULL DEFAULT 1500.00,
    color TEXT DEFAULT '#3b82f6',
    active BOOLEAN DEFAULT TRUE,
    shift_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SEATS / DESKS
CREATE TABLE IF NOT EXISTS seats (
    id TEXT PRIMARY KEY DEFAULT ('seat_' || substr(md5(random()::text), 1, 10)),
    branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- e.g. 'A-01'
    row_num INTEGER DEFAULT 1,
    col_num INTEGER DEFAULT 1,
    zone TEXT NOT NULL CHECK (zone IN ('AC Quiet', 'Standard', 'Deluxe Cubicle', 'Discussion')),
    type TEXT DEFAULT 'FIXED' CHECK (type IN ('FIXED', 'FLOATING')),
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'BLOCKED')),
    is_blocked BOOLEAN DEFAULT FALSE,
    block_reason TEXT,
    power_socket BOOLEAN DEFAULT TRUE,
    has_locker BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (branch_id, label)
);

-- 5. MEMBERSHIP PLANS
CREATE TABLE IF NOT EXISTS membership_plans (
    id TEXT PRIMARY KEY, -- e.g. 'plan_1m', 'plan_3m'
    name TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MEMBERS / SCHOLARS
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY DEFAULT ('mem_' || substr(md5(random()::text), 1, 10)),
    member_code TEXT NOT NULL UNIQUE, -- e.g. '24L-MUM-1001'
    branch_id TEXT REFERENCES branches(id) ON DELETE RESTRICT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    emergency_contact TEXT,
    id_proof_number TEXT,
    target_exam TEXT DEFAULT 'General Study',
    photo_url TEXT,
    joined_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRING', 'EXPIRED', 'BLOCKED')),
    notes TEXT,
    qr_token TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MEMBERSHIPS
CREATE TABLE IF NOT EXISTS memberships (
    id TEXT PRIMARY KEY DEFAULT ('msh_' || substr(md5(random()::text), 1, 10)),
    member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES membership_plans(id),
    branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE,
    shift_id TEXT REFERENCES shifts(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRING', 'EXPIRED', 'CANCELLED')),
    total_fee NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) DEFAULT 0,
    due_amount NUMERIC(10, 2) DEFAULT 0,
    payment_status TEXT DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PARTIAL', 'OVERDUE', 'REFUNDED')),
    auto_renew BOOLEAN DEFAULT FALSE,
    last_renewed_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SEAT ASSIGNMENTS (WITH GiST EXCLUSION CONSTRAINT)
-- Guarantee at database level that no two members can claim the same seat in the same shift on overlapping dates!
CREATE TABLE IF NOT EXISTS seat_assignments (
    id TEXT PRIMARY KEY DEFAULT ('asgn_' || substr(md5(random()::text), 1, 10)),
    member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
    seat_id TEXT REFERENCES seats(id) ON DELETE CASCADE,
    shift_id TEXT REFERENCES shifts(id) ON DELETE CASCADE,
    branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE,
    membership_id TEXT REFERENCES memberships(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TRANSFERRED', 'EXPIRED', 'RELEASED')),
    assigned_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- The Mathematical Exclusion Lock:
    CONSTRAINT no_overlapping_seat_shift_assignment 
    EXCLUDE USING gist (
        seat_id WITH =,
        shift_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
    ) WHERE (status = 'ACTIVE')
);

-- 9. PAYMENTS & FEE TRANSACTIONS
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY DEFAULT ('pay_' || substr(md5(random()::text), 1, 10)),
    receipt_no TEXT NOT NULL UNIQUE, -- e.g. 'RCP-2026-0042'
    member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
    membership_id TEXT REFERENCES memberships(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    method TEXT NOT NULL CHECK (method IN ('CASH', 'UPI_GPAY', 'UPI_PHONEPE', 'UPI_PAYTM', 'CARD', 'NETBANKING')),
    reference_txn_id TEXT,
    notes TEXT,
    invoice_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ATTENDANCE & STUDY TRACKER
CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY DEFAULT ('att_' || substr(md5(random()::text), 1, 10)),
    member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
    branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE,
    shift_id TEXT REFERENCES shifts(id) ON DELETE SET NULL,
    date DATE DEFAULT CURRENT_DATE,
    check_in_time TIME NOT NULL,
    check_out_time TIME,
    duration_minutes INTEGER,
    method TEXT DEFAULT 'QR_SCAN' CHECK (method IN ('QR_SCAN', 'MANUAL_STAFF', 'BIOMETRIC')),
    status TEXT DEFAULT 'INSIDE' CHECK (status IN ('INSIDE', 'COMPLETED', 'AUTO_CHECKOUT')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. GATE ACCESS TELEMETRY LOGS
CREATE TABLE IF NOT EXISTS access_logs (
    id TEXT PRIMARY KEY DEFAULT ('log_' || substr(md5(random()::text), 1, 10)),
    member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
    member_code TEXT,
    member_name TEXT,
    branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    result TEXT NOT NULL CHECK (result IN ('ALLOWED', 'DENIED')),
    reason TEXT NOT NULL,
    gate_id TEXT DEFAULT 'TURNSTILE-01',
    shift_id TEXT REFERENCES shifts(id) ON DELETE SET NULL
);

-- 12. OPERATING OVERHEAD EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY DEFAULT ('exp_' || substr(md5(random()::text), 1, 10)),
    branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('RENT', 'ELECTRICITY', 'WIFI_INTERNET', 'CLEANING', 'MAINTENANCE', 'SALARY', 'TEA_COFFEE', 'OTHER')),
    title TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'UPI_GPAY',
    recorded_by TEXT DEFAULT 'Admin Desk',
    receipt_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. WAITLIST
CREATE TABLE IF NOT EXISTS waitlist_entries (
    id TEXT PRIMARY KEY DEFAULT ('wt_' || substr(md5(random()::text), 1, 10)),
    member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
    branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE,
    preferred_shift_id TEXT REFERENCES shifts(id) ON DELETE CASCADE,
    preferred_seat_id TEXT REFERENCES seats(id) ON DELETE SET NULL,
    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'OFFERED', 'CONVERTED', 'EXPIRED')),
    requested_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notification_logs (
    id TEXT PRIMARY KEY DEFAULT ('notif_' || substr(md5(random()::text), 1, 10)),
    member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    type TEXT NOT NULL,
    channel TEXT DEFAULT 'WHATSAPP',
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'SENT'
);

-- ============================================================
-- INDEXES FOR HIGH-THROUGHPUT SEARCH & PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_code ON members(member_code);
CREATE INDEX IF NOT EXISTS idx_members_branch ON members(branch_id);
CREATE INDEX IF NOT EXISTS idx_memberships_end_date ON memberships(end_date);
CREATE INDEX IF NOT EXISTS idx_seat_assignments_active ON seat_assignments(seat_id, shift_id) WHERE (status = 'ACTIVE');
CREATE INDEX IF NOT EXISTS idx_attendance_inside ON attendance_records(branch_id, date) WHERE (status = 'INSIDE');
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- ============================================================
-- REAL-TIME SUBSCRIPTION REPLICATION
-- Enable Supabase Realtime for instant turnstile & multi-device sync
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE seat_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE access_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE members;
ALTER PUBLICATION supabase_realtime ADD TABLE memberships;

-- Enable Row Level Security (RLS) with permissive defaults for public anon key
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read all" ON organizations FOR ALL USING (true);
CREATE POLICY "Allow anon read branches" ON branches FOR ALL USING (true);
CREATE POLICY "Allow anon read shifts" ON shifts FOR ALL USING (true);
CREATE POLICY "Allow anon read seats" ON seats FOR ALL USING (true);
CREATE POLICY "Allow anon read plans" ON membership_plans FOR ALL USING (true);
CREATE POLICY "Allow anon read members" ON members FOR ALL USING (true);
CREATE POLICY "Allow anon read memberships" ON memberships FOR ALL USING (true);
CREATE POLICY "Allow anon read assignments" ON seat_assignments FOR ALL USING (true);
CREATE POLICY "Allow anon read payments" ON payments FOR ALL USING (true);
CREATE POLICY "Allow anon read attendance" ON attendance_records FOR ALL USING (true);
CREATE POLICY "Allow anon read logs" ON access_logs FOR ALL USING (true);
CREATE POLICY "Allow anon read expenses" ON expenses FOR ALL USING (true);
CREATE POLICY "Allow anon read waitlist" ON waitlist_entries FOR ALL USING (true);
CREATE POLICY "Allow anon read notifications" ON notification_logs FOR ALL USING (true);
