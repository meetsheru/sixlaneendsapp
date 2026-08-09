-- Create table for earnings with time support
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

-- Insert sample data
INSERT INTO earnings (date, time, amount, description) VALUES 
    (CURRENT_DATE - INTERVAL '2 days', '12:30:00', 250.00, 'Monday lunch sales'),
    (CURRENT_DATE - INTERVAL '2 days', '18:45:00', 200.50, 'Monday dinner sales'),
    (CURRENT_DATE - INTERVAL '1 day', '13:15:00', 320.00, 'Tuesday lunch sales'),
    (CURRENT_DATE - INTERVAL '1 day', '19:30:00', 200.50, 'Tuesday dinner sales'),
    (CURRENT_DATE, '12:00:00', 180.75, 'Today lunch sales'),
    (CURRENT_DATE, '19:00:00', 200.00, 'Today dinner sales')
ON CONFLICT (date, time) DO NOTHING;

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at
CREATE TRIGGER update_earnings_updated_at
    BEFORE UPDATE ON earnings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();