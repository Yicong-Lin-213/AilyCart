CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  font_size_preference INT CHECK (font_size_preference >= 18 AND font_size_preference <= 48) DEFAULT 20,
  voice_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  total_amount DECIMAL(10,2) CHECK (total_amount >= 0),
  image_url TEXT NOT NULL, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE inventory_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INT CHECK (quantity >= 0) DEFAULT 1,
  status TEXT CHECK (status IN ('sufficient', 'low', 'out')) DEFAULT 'sufficient',
  unit_price DECIMAL(10,2) CHECK (unit_price >= 0),
  expiry_date DATE,
  last_purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE VIEW product_consumption_rates AS
SELECT 
    user_id,
    item_name,
    COUNT(*) as purchase_count,
    MAX(created_at) - MIN(created_at) / NULLIF(COUNT(*)-1, 0) as avg_interval
FROM inventory
GROUP BY user_id, item_name;