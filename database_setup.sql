-- Database Setup for Shruti Jewellers
-- Copy and run this script in your InsForge / Supabase SQL Editor

-- 1. Create Bills Table
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  total_amount NUMERIC NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Items Table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  weight NUMERIC NOT NULL,
  cost NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable row level security (Optional, for production)
-- ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 4. Create Public Access Policy (If needed for anon access during dev)
-- CREATE POLICY "Public Access" ON bills FOR ALL USING (true);
-- CREATE POLICY "Public Access" ON items FOR ALL USING (true);
