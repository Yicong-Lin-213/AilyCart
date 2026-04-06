
CREATE TABLE standard_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  barcorde TEXT UNIQUE,
  category TEXT,
  full_name TEXT UNIQUE NOT NULL,
  common_unit TEXT DEFAULT 'ea',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE abbreviation_mapping (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  raw_text TEXT NOT NULL,
  standard_text TEXT NOT NULL,
  user_id UUID REFERENCES auth.users,
  is_global BOOLEAN DEFAULT TRUE,
  hit_count INT DEFAULT 0,
  UNIQUE(raw_text, user_id)
);


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
  standard_product_id UUID REFERENCES standard_products(id),
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
    (MAX(last_purchased_at) - MIN(last_purchased_at)) / NULLIF(COUNT(*)-1, 0) as avg_interval
FROM inventory_items
GROUP BY user_id, item_name;
