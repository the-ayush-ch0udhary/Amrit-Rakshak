/*
  # Create medicine tracking tables

  1. New Tables
    - `organizations`
      - `id` (uuid, primary key)
      - `name` (text)
      - `role` (text)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
    - `medicines`
      - `id` (uuid, primary key)
      - `medicine_name` (text)
      - `composition` (text)
      - `batch_id` (text)
      - `quantity` (integer)
      - `price` (numeric)
      - `expiry_date` (date)
      - `status` (text)
      - `organization_id` (uuid, foreign key)
      - `organization_name` (text)
      - `date_added` (timestamp)
      - `stock_type` (text) -- 'manufacturer', 'wholesaler', 'hospital'
    - `requests`
      - `id` (uuid, primary key)
      - `medicine` (text)
      - `quantity` (integer)
      - `requester_org` (text)
      - `requester_id` (uuid)
      - `target_org` (text)
      - `target_id` (uuid)
      - `type` (text)
      - `status` (text)
      - `date_requested` (timestamp)
    - `shipments`
      - `id` (uuid, primary key)
      - `tracking_number` (text)
      - `medicine` (text)
      - `batch_id` (text)
      - `quantity` (integer)
      - `from_org` (text)
      - `from_id` (uuid)
      - `to_org` (text)
      - `to_id` (uuid)
      - `status` (text)
      - `date_shipped` (timestamp)
    - `transactions`
      - `id` (uuid, primary key)
      - `action` (text)
      - `medicine` (text)
      - `batch_id` (text)
      - `quantity` (integer)
      - `organization_id` (uuid)
      - `organization_name` (text)
      - `details` (text)
      - `timestamp` (timestamp)
    - `stock_trends`
      - `id` (uuid, primary key)
      - `timestamp` (timestamp)
      - `medicine_name` (text)
      - `quantity` (integer)
      - `action` (text)
      - `organization_id` (uuid)

  2. Security
    - No RLS policies as requested
    - Simple table structure for easy access
*/

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('manufacturer', 'wholesaler', 'hospital')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Medicines table
CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_name text NOT NULL,
  composition text NOT NULL,
  batch_id text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  expiry_date date NOT NULL,
  status text NOT NULL DEFAULT 'In Stock',
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  organization_name text NOT NULL,
  date_added timestamptz DEFAULT now(),
  stock_type text NOT NULL CHECK (stock_type IN ('manufacturer', 'wholesaler', 'hospital'))
);

-- Requests table
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine text NOT NULL,
  quantity integer NOT NULL,
  requester_org text NOT NULL,
  requester_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  target_org text NOT NULL,
  target_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('manufacturer_request', 'wholesaler_request')),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved')),
  date_requested timestamptz DEFAULT now()
);

-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number text NOT NULL,
  medicine text NOT NULL,
  batch_id text NOT NULL,
  quantity integer NOT NULL,
  from_org text NOT NULL,
  from_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  to_org text NOT NULL,
  to_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'In Transit' CHECK (status IN ('In Transit', 'Delivered')),
  date_shipped timestamptz DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  medicine text NOT NULL,
  batch_id text NOT NULL,
  quantity integer NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  organization_name text NOT NULL,
  details text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Stock trends table
CREATE TABLE IF NOT EXISTS stock_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  medicine_name text NOT NULL,
  quantity integer NOT NULL,
  action text NOT NULL CHECK (action IN ('add', 'remove')),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medicines_organization_id ON medicines(organization_id);
CREATE INDEX IF NOT EXISTS idx_medicines_stock_type ON medicines(stock_type);
CREATE INDEX IF NOT EXISTS idx_requests_target_id ON requests(target_id);
CREATE INDEX IF NOT EXISTS idx_requests_requester_id ON requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_shipments_from_id ON shipments(from_id);
CREATE INDEX IF NOT EXISTS idx_shipments_to_id ON shipments(to_id);
CREATE INDEX IF NOT EXISTS idx_transactions_organization_id ON transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_trends_organization_id ON stock_trends(organization_id);