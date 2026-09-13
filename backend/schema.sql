-- ============================================================
-- LOAN CONSULTING CRM — DATABASE SCHEMA (SQLite)
-- ============================================================

-- Unified Contacts table: Leads, Connectors/Sources, and Bankers
-- all live here, tagged by role, so the same person can hold
-- multiple roles and autocomplete/duplicate-detection works
-- against one search.
CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL CHECK (role IN ('lead', 'connector', 'banker')),
    name TEXT NOT NULL,
    mobile TEXT,
    location TEXT,
    -- Lead-specific fields (NULL for connector/banker rows)
    lead_date TEXT,
    qualification_status TEXT CHECK (qualification_status IN
        ('Valid','Eligible','Not Eligible','No Response','Invalid')),
    priority TEXT CHECK (priority IN ('Low','Medium','High')),
    source TEXT CHECK (source IN ('FB Ads','Referral','Direct')),
    campaign_name TEXT,          -- shown only when source = FB Ads
    referred_by_contact_id INTEGER REFERENCES contacts(id), -- link to Connector
    cibil_score INTEGER,
    profile_type TEXT,           -- Salaried / Self-employed / Business
    profile_detail TEXT,         -- sector, years, etc.
    monthly_income REAL,         -- used for eligibility ratio checks
    loan_category TEXT,          -- captured at first enquiry (before a Loan File exists)
    loan_subcategory TEXT,
    loan_amount REAL,
    property_usage TEXT,         -- Residential / Commercial; only meaningful for Home Loan & Mortgage Loan categories
    additional_info TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Loan Files: separate from Leads, linked back to the Lead contact.
-- One Lead can have 0..N Loan Files.
CREATE TABLE loan_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_contact_id INTEGER NOT NULL REFERENCES contacts(id),
    loan_category TEXT NOT NULL,      -- Home/Mortgage/Personal/Business/Others
    loan_subcategory TEXT,            -- Fresh/Resell/BT/BT+TopUp
    loan_amount REAL,
    property_category TEXT,           -- Corporation/Gram Panchayat/Gaothan/Chawl
    property_type TEXT,               -- Residential Flat/Plot/Bungalow/Commercial/Godown
    banker_contact_id INTEGER REFERENCES contacts(id),
    bank_name TEXT,
    current_stage TEXT NOT NULL DEFAULT 'File Prep',
    -- single continuous stage list, File Login is the pivot to bank-side stages
    commission_expected REAL,
    commission_status TEXT CHECK (commission_status IN
        ('Pending','Partially Received','Received')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Applicants on a Loan File: Main / Co-Applicant / Guarantor
-- Determines which document tier applies to each person.
CREATE TABLE file_applicants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_file_id INTEGER NOT NULL REFERENCES loan_files(id),
    contact_id INTEGER REFERENCES contacts(id),   -- optional link if they're also a saved contact
    name TEXT NOT NULL,
    mobile TEXT,
    applicant_role TEXT NOT NULL CHECK (applicant_role IN
        ('Main Applicant','Co-Applicant','Guarantor')),
    document_tier TEXT NOT NULL CHECK (document_tier IN ('Full Set','KYC Only'))
    -- Main Applicant & Guarantor always 'Full Set' (enforced in app logic)
);

-- Document checklist rules — editable per bank + loan category
-- property_type / profile_type are optional (NULL = applies regardless);
-- when set, that rule ADDS extra documents on top of the general list
-- for files/applicants matching that specific property type or profile.
CREATE TABLE doc_checklist_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_name TEXT NOT NULL,
    loan_category TEXT NOT NULL,
    loan_subcategory TEXT,
    document_tier TEXT NOT NULL CHECK (document_tier IN ('Full Set','KYC Only')),
    document_name TEXT NOT NULL,
    applies_to_common BOOLEAN DEFAULT 0,   -- 1 = applies once per file, not per applicant (e.g. Property Docs)
    property_type TEXT,        -- NULL = any property type
    profile_type TEXT          -- NULL = any profile; only evaluated for Main Applicant
);

-- Eligibility rules — configurable per loan category, drive the
-- Banker Discussion Summary's auto-suggested red flags.
CREATE TABLE eligibility_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_category TEXT NOT NULL,        -- or 'Any' to apply to all categories
    condition_type TEXT NOT NULL CHECK (condition_type IN
        ('min_cibil', 'max_loan_to_income_ratio')),
    threshold REAL NOT NULL,
    message TEXT NOT NULL,              -- shown when the rule is triggered
    active BOOLEAN DEFAULT 1
);

-- Follow-ups: forward-looking scheduled tasks, multi-party
CREATE TABLE follow_ups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_file_id INTEGER REFERENCES loan_files(id),
    lead_contact_id INTEGER REFERENCES contacts(id),  -- for follow-ups before a file exists
    party_type TEXT NOT NULL CHECK (party_type IN ('Lead','Source','Bank')),
    method TEXT NOT NULL CHECK (method IN ('Call','WhatsApp','Visit','Backend')),
    -- 'Backend' = internal/admin work, may or may not relate to a specific lead/file
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Done')),
    notes TEXT,
    priority_tag TEXT CHECK (priority_tag IS NULL OR priority_tag IN ('Urgent','Important','Top Priority')),
    -- Manual flag, shown as its own colored label on task cards — independent of
    -- (and no longer overrides) the automatic Overdue/Today/Upcoming color strip.
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Queries: raised by Bank/Lead/Connector, tracked to resolution
CREATE TABLE queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_file_id INTEGER NOT NULL REFERENCES loan_files(id),
    raised_by TEXT NOT NULL CHECK (raised_by IN ('Bank','Lead','Connector')),
    priority TEXT NOT NULL CHECK (priority IN ('Low','Medium','High')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN
        ('Open','Closed','Rejected','Sanctioned','Disbursed')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT
);

-- Communication Log: historical record of actual conversations
-- (separate from Follow-ups, which are forward-looking tasks)
CREATE TABLE communication_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_file_id INTEGER NOT NULL REFERENCES loan_files(id),
    party_type TEXT NOT NULL CHECK (party_type IN ('Lead','Source','Bank')),
    mode TEXT NOT NULL CHECK (mode IN ('Call','WhatsApp','Visit','Email')),
    log_date TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail: change history log across key tables
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    field_changed TEXT,
    old_value TEXT,
    new_value TEXT,
    changed_at TEXT DEFAULT CURRENT_TIMESTAMP
);
