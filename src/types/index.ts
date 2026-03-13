export interface Organization {
  id: string;
  name: string;
  password: string;
  role: 'manufacturer' | 'wholesaler' | 'hospital';
  email?: string;
  address?: string;
}

export interface Medicine {
  id: string;
  medicineName: string;
  composition: string;
  batchId: string;
  quantity: number;
  price: number;
  expiryDate: string;
  status: string;
  organizationId: string;
  organizationName: string;
  dateAdded: string;
}

export interface Request {
  id: string;
  medicine: string;
  quantity: number;
  requesterOrg: string;
  requesterId: string;
  targetOrg: string;
  targetId: string;
  type: 'manufacturer_request' | 'wholesaler_request';
  status: 'Pending' | 'Approved';
  dateRequested: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  medicine: string;
  batchId: string;
  quantity: number;
  fromOrg: string;
  fromId: string;
  toOrg: string;
  toId: string;
  status: 'In Transit' | 'Delivered';
  dateShipped: string;
}

export interface Transaction {
  id: string;
  action: string;
  medicine: string;
  batchId: string;
  quantity: number;
  organizationId: string;
  organizationName: string;
  details: string;
  timestamp: string;
}

export interface Alert {
  type: 'low_stock' | 'expiry' | 'pending_request';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface StockTrend {
  timestamp: string;
  medicineName: string;
  quantity: number;
  action: 'add' | 'remove';
  organizationId: string;
}

export interface TrendAnalysis {
  medicineName: string;
  currentStock: number;
  averageConsumption: number;
  expectedStockoutDate: string | null;
  recommendedRestockDate: string | null;
  trend: 'increasing' | 'decreasing' | 'stable';
}