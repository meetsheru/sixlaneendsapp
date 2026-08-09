-- ============================================
-- EARNINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS earnings (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    time TIME NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT earnings_date_time_unique UNIQUE (date, time)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_earnings_date ON earnings(date);
CREATE INDEX IF NOT EXISTS idx_earnings_date_time ON earnings(date, time);

-- ============================================
-- AUDIT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS earnings_audit (
    id SERIAL PRIMARY KEY,
    entry_id INTEGER NOT NULL,
    action VARCHAR(10) NOT NULL,
    old_amount DECIMAL(10, 2),
    new_amount DECIMAL(10, 2),
    old_description TEXT,
    new_description TEXT,
    old_time TIME,
    new_time TIME,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(50) DEFAULT 'system'
);

-- Create indexes for audit
CREATE INDEX IF NOT EXISTS idx_audit_entry_id ON earnings_audit(entry_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON earnings_audit(changed_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON earnings_audit(action);

-- ============================================
-- SAMPLE DATA
-- ============================================
INSERT INTO earnings (date, time, amount, description) VALUES 
    (CURRENT_DATE - INTERVAL '2 days', '12:30:00', 250.00, 'Monday lunch sales'),
    (CURRENT_DATE - INTERVAL '2 days', '18:45:00', 200.50, 'Monday dinner sales'),
    (CURRENT_DATE - INTERVAL '1 day', '13:15:00', 320.00, 'Tuesday lunch sales'),
    (CURRENT_DATE - INTERVAL '1 day', '19:30:00', 200.50, 'Tuesday dinner sales'),
    (CURRENT_DATE, '12:00:00', 180.75, 'Today lunch sales'),
    (CURRENT_DATE, '19:00:00', 200.00, 'Today dinner sales')
ON CONFLICT (date, time) DO NOTHING;

-- ============================================
-- TRIGGER FUNCTION FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_earnings_updated_at ON earnings;
CREATE TRIGGER update_earnings_updated_at
    BEFORE UPDATE ON earnings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUDIT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION log_earnings_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO earnings_audit (entry_id, action, new_amount, new_description, new_time)
        VALUES (NEW.id, 'CREATE', NEW.amount, NEW.description, NEW.time);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO earnings_audit (entry_id, action, 
            old_amount, new_amount, 
            old_description, new_description,
            old_time, new_time)
        VALUES (OLD.id, 'UPDATE', 
            OLD.amount, NEW.amount,
            OLD.description, NEW.description,
            OLD.time, NEW.time);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO earnings_audit (entry_id, action, 
            old_amount, old_description, old_time)
        VALUES (OLD.id, 'DELETE', 
            OLD.amount, OLD.description, OLD.time);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger
DROP TRIGGER IF EXISTS earnings_audit_trigger ON earnings;
CREATE TRIGGER earnings_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON earnings
FOR EACH ROW EXECUTE FUNCTION log_earnings_changes();

-- ============================================
-- ADD SAMPLE AUDIT DATA (for testing)
-- ============================================
-- This creates some initial audit records based on the sample data
INSERT INTO earnings_audit (entry_id, action, new_amount, new_description, new_time, changed_at)
SELECT 
    id, 
    'CREATE', 
    amount, 
    description, 
    time,
    created_at
FROM earnings 
WHERE id IN (1, 2, 3, 4, 5, 6)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFY SETUP
-- ============================================
SELECT '✅ Audit table created successfully!' as status;
SELECT COUNT(*) as audit_records FROM earnings_audit;