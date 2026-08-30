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

CREATE INDEX IF NOT EXISTS idx_earnings_date ON earnings(date);
CREATE INDEX IF NOT EXISTS idx_earnings_date_time ON earnings(date, time);

-- ============================================
-- EARNINGS AUDIT TABLE
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

CREATE INDEX IF NOT EXISTS idx_earnings_audit_entry_id ON earnings_audit(entry_id);
CREATE INDEX IF NOT EXISTS idx_earnings_audit_changed_at ON earnings_audit(changed_at);
CREATE INDEX IF NOT EXISTS idx_earnings_audit_action ON earnings_audit(action);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    time TIME NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_date_time ON expenses(date, time);

-- ============================================
-- INVENTORY PURCHASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_purchases (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    time TIME NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    cost_per_unit DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    supplier VARCHAR(255),
    category VARCHAR(100),
    notes TEXT,
    receipt_filename VARCHAR(255),
    receipt_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_purchases_date ON inventory_purchases(date);
CREATE INDEX IF NOT EXISTS idx_inventory_purchases_category ON inventory_purchases(category);
CREATE INDEX IF NOT EXISTS idx_inventory_purchases_item ON inventory_purchases(item_name);

-- ============================================
-- INVENTORY AUDIT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_audit (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL,
    action VARCHAR(10) NOT NULL,
    item_name VARCHAR(255),
    quantity DECIMAL(10, 2),
    unit VARCHAR(50),
    cost_per_unit DECIMAL(10, 2),
    total_cost DECIMAL(10, 2),
    supplier VARCHAR(255),
    category VARCHAR(100),
    notes TEXT,
    receipt_filename VARCHAR(255),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_audit_purchase_id ON inventory_audit(purchase_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_changed_at ON inventory_audit(changed_at);

-- ============================================
-- INVENTORY STOCK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_stock (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL UNIQUE,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_stock_category ON inventory_stock(category);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_item ON inventory_stock(item_name);

-- ============================================
-- SAMPLE DATA - EARNINGS
-- ============================================
INSERT INTO earnings (date, time, amount, description) VALUES 
    (CURRENT_DATE - INTERVAL '3 days', '12:30:00', 250.00, 'Monday lunch sales'),
    (CURRENT_DATE - INTERVAL '3 days', '18:45:00', 200.50, 'Monday dinner sales'),
    (CURRENT_DATE - INTERVAL '2 days', '13:15:00', 320.00, 'Tuesday lunch sales'),
    (CURRENT_DATE - INTERVAL '2 days', '19:30:00', 200.50, 'Tuesday dinner sales'),
    (CURRENT_DATE - INTERVAL '1 day', '12:00:00', 180.75, 'Wednesday lunch sales'),
    (CURRENT_DATE - INTERVAL '1 day', '19:00:00', 200.00, 'Wednesday dinner sales')
ON CONFLICT (date, time) DO NOTHING;

-- ============================================
-- SAMPLE DATA - EXPENSES
-- ============================================
INSERT INTO expenses (date, time, amount, reason) VALUES 
    (CURRENT_DATE - INTERVAL '2 days', '10:00:00', 50.00, 'Staff lunch'),
    (CURRENT_DATE - INTERVAL '1 day', '09:00:00', 30.00, 'Ingredients purchase'),
    (CURRENT_DATE, '08:30:00', 15.00, 'Cleaning supplies')
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE DATA - INVENTORY
-- ============================================
INSERT INTO inventory_purchases (date, time, item_name, quantity, unit, cost_per_unit, total_cost, supplier, category) VALUES 
    (CURRENT_DATE - INTERVAL '3 days', '10:30:00', 'Chicken Breast', 10, 'kg', 8.50, 85.00, 'Local Farm', 'Meat'),
    (CURRENT_DATE - INTERVAL '3 days', '10:45:00', 'Rice', 25, 'kg', 2.20, 55.00, 'Wholesale', 'Grains'),
    (CURRENT_DATE - INTERVAL '2 days', '11:00:00', 'Tomatoes', 8, 'kg', 3.50, 28.00, 'Market', 'Vegetables'),
    (CURRENT_DATE - INTERVAL '2 days', '11:15:00', 'Onions', 10, 'kg', 1.80, 18.00, 'Market', 'Vegetables'),
    (CURRENT_DATE - INTERVAL '1 day', '09:00:00', 'Cooking Oil', 15, 'liters', 2.50, 37.50, 'Wholesale', 'Pantry')
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE DATA - INVENTORY STOCK
-- ============================================
INSERT INTO inventory_stock (item_name, quantity, unit, category)
VALUES 
    ('Chicken Breast', 10, 'kg', 'Meat'),
    ('Rice', 25, 'kg', 'Grains'),
    ('Tomatoes', 8, 'kg', 'Vegetables'),
    ('Onions', 10, 'kg', 'Vegetables'),
    ('Cooking Oil', 15, 'liters', 'Pantry')
ON CONFLICT (item_name) DO UPDATE SET 
    quantity = EXCLUDED.quantity,
    last_updated = CURRENT_TIMESTAMP;

-- ============================================
-- TRIGGER: UPDATE UPDATED_AT FOR EARNINGS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_earnings_updated_at ON earnings;
CREATE TRIGGER update_earnings_updated_at
    BEFORE UPDATE ON earnings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory_purchases;
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER: EARNINGS AUDIT
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

DROP TRIGGER IF EXISTS earnings_audit_trigger ON earnings;
CREATE TRIGGER earnings_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON earnings
FOR EACH ROW EXECUTE FUNCTION log_earnings_changes();

-- ============================================
-- TRIGGER: INVENTORY AUDIT
-- ============================================
CREATE OR REPLACE FUNCTION log_inventory_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO inventory_audit (purchase_id, action, item_name, quantity, unit, cost_per_unit, total_cost, supplier, category, notes, receipt_filename)
        VALUES (NEW.id, 'CREATE', NEW.item_name, NEW.quantity, NEW.unit, NEW.cost_per_unit, NEW.total_cost, NEW.supplier, NEW.category, NEW.notes, NEW.receipt_filename);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO inventory_audit (purchase_id, action, item_name, quantity, unit, cost_per_unit, total_cost, supplier, category, notes, receipt_filename)
        VALUES (OLD.id, 'DELETE', OLD.item_name, OLD.quantity, OLD.unit, OLD.cost_per_unit, OLD.total_cost, OLD.supplier, OLD.category, OLD.notes, OLD.receipt_filename);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inventory_audit_trigger ON inventory_purchases;
CREATE TRIGGER inventory_audit_trigger
AFTER INSERT OR DELETE ON inventory_purchases
FOR EACH ROW EXECUTE FUNCTION log_inventory_changes();

-- ============================================
-- TRIGGER: UPDATE INVENTORY STOCK
-- ============================================
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO inventory_stock (item_name, quantity, unit, category, last_updated)
    VALUES (NEW.item_name, NEW.quantity, NEW.unit, NEW.category, CURRENT_TIMESTAMP)
    ON CONFLICT (item_name) 
    DO UPDATE SET 
        quantity = inventory_stock.quantity + NEW.quantity,
        unit = EXCLUDED.unit,
        category = EXCLUDED.category,
        last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inventory_stock_trigger ON inventory_purchases;
CREATE TRIGGER inventory_stock_trigger
AFTER INSERT ON inventory_purchases
FOR EACH ROW
EXECUTE FUNCTION update_inventory_stock();

-- ============================================
-- INITIAL AUDIT DATA
-- ============================================
-- Add existing earnings to audit
INSERT INTO earnings_audit (entry_id, action, new_amount, new_description, new_time, changed_at)
SELECT 
    id, 
    'CREATE', 
    amount, 
    description, 
    time,
    created_at
FROM earnings 
WHERE id IN (SELECT id FROM earnings)
ON CONFLICT DO NOTHING;

-- Add existing inventory to audit
INSERT INTO inventory_audit (purchase_id, action, item_name, quantity, unit, cost_per_unit, total_cost, supplier, category, notes, receipt_filename, changed_at)
SELECT 
    id, 
    'CREATE', 
    item_name, 
    quantity, 
    unit, 
    cost_per_unit, 
    total_cost, 
    supplier, 
    category, 
    notes, 
    receipt_filename,
    created_at
FROM inventory_purchases
WHERE id IN (SELECT id FROM inventory_purchases)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFY SETUP
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup complete!';
    RAISE NOTICE '📊 Tables created: earnings, earnings_audit, expenses, inventory_purchases, inventory_audit, inventory_stock';
END $$;