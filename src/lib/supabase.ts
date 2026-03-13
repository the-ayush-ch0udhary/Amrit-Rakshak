import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Log instead of crashing the app
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables missing.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          role: 'manufacturer' | 'wholesaler' | 'hospital';
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          role: 'manufacturer' | 'wholesaler' | 'hospital';
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: 'manufacturer' | 'wholesaler' | 'hospital';
          user_id?: string;
          created_at?: string;
        };
      };
      medicines: {
        Row: {
          id: string;
          medicine_name: string;
          composition: string;
          batch_id: string;
          quantity: number;
          price: number;
          expiry_date: string;
          status: string;
          organization_id: string;
          organization_name: string;
          date_added: string;
          stock_type: 'manufacturer' | 'wholesaler' | 'hospital';
        };
        Insert: {
          id?: string;
          medicine_name: string;
          composition: string;
          batch_id: string;
          quantity: number;
          price: number;
          expiry_date: string;
          status?: string;
          organization_id: string;
          organization_name: string;
          date_added?: string;
          stock_type: 'manufacturer' | 'wholesaler' | 'hospital';
        };
        Update: {
          id?: string;
          medicine_name?: string;
          composition?: string;
          batch_id?: string;
          quantity?: number;
          price?: number;
          expiry_date?: string;
          status?: string;
          organization_id?: string;
          organization_name?: string;
          date_added?: string;
          stock_type?: 'manufacturer' | 'wholesaler' | 'hospital';
        };
      };
      requests: {
        Row: {
          id: string;
          medicine: string;
          quantity: number;
          requester_org: string;
          requester_id: string;
          target_org: string;
          target_id: string;
          type: 'manufacturer_request' | 'wholesaler_request';
          status: 'Pending' | 'Approved';
          date_requested: string;
        };
        Insert: {
          id?: string;
          medicine: string;
          quantity: number;
          requester_org: string;
          requester_id: string;
          target_org: string;
          target_id: string;
          type: 'manufacturer_request' | 'wholesaler_request';
          status?: 'Pending' | 'Approved';
          date_requested?: string;
        };
        Update: {
          id?: string;
          medicine?: string;
          quantity?: number;
          requester_org?: string;
          requester_id?: string;
          target_org?: string;
          target_id?: string;
          type?: 'manufacturer_request' | 'wholesaler_request';
          status?: 'Pending' | 'Approved';
          date_requested?: string;
        };
      };
      shipments: {
        Row: {
          id: string;
          tracking_number: string;
          medicine: string;
          batch_id: string;
          quantity: number;
          from_org: string;
          from_id: string;
          to_org: string;
          to_id: string;
          status: 'In Transit' | 'Delivered';
          date_shipped: string;
        };
        Insert: {
          id?: string;
          tracking_number: string;
          medicine: string;
          batch_id: string;
          quantity: number;
          from_org: string;
          from_id: string;
          to_org: string;
          to_id: string;
          status?: 'In Transit' | 'Delivered';
          date_shipped?: string;
        };
        Update: {
          id?: string;
          tracking_number?: string;
          medicine?: string;
          batch_id?: string;
          quantity?: number;
          from_org?: string;
          from_id?: string;
          to_org?: string;
          to_id?: string;
          status?: 'In Transit' | 'Delivered';
          date_shipped?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          action: string;
          medicine: string;
          batch_id: string;
          quantity: number;
          organization_id: string;
          organization_name: string;
          details: string;
          timestamp: string;
        };
        Insert: {
          id?: string;
          action: string;
          medicine: string;
          batch_id: string;
          quantity: number;
          organization_id: string;
          organization_name: string;
          details: string;
          timestamp?: string;
        };
        Update: {
          id?: string;
          action?: string;
          medicine?: string;
          batch_id?: string;
          quantity?: number;
          organization_id?: string;
          organization_name?: string;
          details?: string;
          timestamp?: string;
        };
      };
      stock_trends: {
        Row: {
          id: string;
          timestamp: string;
          medicine_name: string;
          quantity: number;
          action: 'add' | 'remove';
          organization_id: string;
        };
        Insert: {
          id?: string;
          timestamp?: string;
          medicine_name: string;
          quantity: number;
          action: 'add' | 'remove';
          organization_id: string;
        };
        Update: {
          id?: string;
          timestamp?: string;
          medicine_name?: string;
          quantity?: number;
          action?: 'add' | 'remove';
          organization_id?: string;
        };
      };
    };
  };
};
