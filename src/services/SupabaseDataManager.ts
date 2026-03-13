import { supabase } from '../lib/supabase';
import { Organization, Medicine, Request, Shipment, Transaction, Alert, StockTrend, TrendAnalysis } from '../types';

class SupabaseDataManager {
  private generateId(prefix: string): string {
    // Generate a proper UUID for database compatibility
    const uuid = crypto.randomUUID();
    return `${prefix}${uuid}`;
  }

  // Organization management
  async getOrganizations(type?: string): Promise<Organization[]> {
    let query = supabase.from('organizations').select('*');
    
    if (type) {
      query = query.eq('role', type);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data?.map(org => ({
      id: org.id,
      name: org.name,
      password: '', // Not stored in database for security
      role: org.role as 'manufacturer' | 'wholesaler' | 'hospital',
      email: '',
      address: ''
    })) || [];
  }

  async getOrganizationByUserId(userId: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      name: data.name,
      password: '',
      role: data.role as 'manufacturer' | 'wholesaler' | 'hospital',
      email: '',
      address: ''
    };
  }

  async createOrganization(name: string, role: 'manufacturer' | 'wholesaler' | 'hospital', userId: string): Promise<string> {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name,
        role,
        user_id: userId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data.id;
  }

  // Medicine management
  async addMedicine(medicine: Omit<Medicine, 'id' | 'dateAdded'>): Promise<void> {
    // Check if same medicine name with same batch ID already exists for this organization
    const { data: existingMedicine } = await supabase
      .from('medicines')
      .select('*')
      .eq('medicine_name', medicine.medicineName)
      .eq('batch_id', medicine.batchId)
      .eq('organization_id', medicine.organizationId)
      .eq('stock_type', 'manufacturer')
      .single();
    
    if (existingMedicine) {
      throw new Error('Medicine with this batch ID already exists. Please use a different batch ID.');
    }

    const { error } = await supabase
      .from('medicines')
      .insert({
        medicine_name: medicine.medicineName,
        composition: medicine.composition,
        batch_id: medicine.batchId,
        quantity: medicine.quantity,
        price: medicine.price,
        expiry_date: medicine.expiryDate,
        status: medicine.status,
        organization_id: medicine.organizationId,
        organization_name: medicine.organizationName,
        stock_type: 'manufacturer'
      });
    
    if (error) throw error;
    
    await this.addStockTrend(medicine.medicineName, medicine.quantity, 'add', medicine.organizationId);
    await this.addTransaction('Manufactured', medicine.medicineName, medicine.batchId, medicine.quantity, medicine.organizationId, medicine.organizationName, 'New batch manufactured');
  }

  generateQRCode(batchId: string, organizationId: string): string {
    return `MED_${batchId}_${organizationId}`;
  }

  async getAvailableMedicines(targetOrgId: string): Promise<string[]> {
    const targetOrg = await this.getOrganizations().then(orgs => orgs.find(org => org.id === targetOrgId));
    if (!targetOrg) return [];

    let stockType: string;
    if (targetOrg.role === 'manufacturer') {
      stockType = 'manufacturer';
    } else if (targetOrg.role === 'wholesaler') {
      stockType = 'wholesaler';
    } else {
      return [];
    }

    const { data, error } = await supabase
      .from('medicines')
      .select('medicine_name')
      .eq('organization_id', targetOrgId)
      .eq('stock_type', stockType);
    
    if (error) throw error;
    
    return Array.from(new Set(data?.map(item => item.medicine_name) || []));
  }

  async getAvailableMedicinesWithBatches(targetOrgId: string): Promise<{medicineName: string, batchId: string, availableQuantity: number}[]> {
    const targetOrg = await this.getOrganizations().then(orgs => orgs.find(org => org.id === targetOrgId));
    if (!targetOrg) return [];

    let stockType: string;
    if (targetOrg.role === 'manufacturer') {
      stockType = 'manufacturer';
    } else if (targetOrg.role === 'wholesaler') {
      stockType = 'wholesaler';
    } else {
      return [];
    }

    const { data, error } = await supabase
      .from('medicines')
      .select('medicine_name, batch_id, quantity')
      .eq('organization_id', targetOrgId)
      .eq('stock_type', stockType)
      .gt('quantity', 0);
    
    if (error) throw error;
    
    return data?.map(item => ({
      medicineName: item.medicine_name,
      batchId: item.batch_id,
      availableQuantity: item.quantity
    })) || [];
  }

  async getManufacturerStock(organizationId?: string): Promise<Medicine[]> {
    let query = supabase
      .from('medicines')
      .select('*')
      .eq('stock_type', 'manufacturer');
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data?.map(item => ({
      id: item.id,
      medicineName: item.medicine_name,
      composition: item.composition,
      batchId: item.batch_id,
      quantity: item.quantity,
      price: item.price,
      expiryDate: item.expiry_date,
      status: item.status,
      organizationId: item.organization_id,
      organizationName: item.organization_name,
      dateAdded: item.date_added
    })) || [];
  }

  async getWholesalerStock(organizationId?: string): Promise<Medicine[]> {
    let query = supabase
      .from('medicines')
      .select('*')
      .eq('stock_type', 'wholesaler');
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data?.map(item => ({
      id: item.id,
      medicineName: item.medicine_name,
      composition: item.composition,
      batchId: item.batch_id,
      quantity: item.quantity,
      price: item.price,
      expiryDate: item.expiry_date,
      status: item.status,
      organizationId: item.organization_id,
      organizationName: item.organization_name,
      dateAdded: item.date_added
    })) || [];
  }

  async getHospitalStock(organizationId?: string): Promise<Medicine[]> {
    let query = supabase
      .from('medicines')
      .select('*')
      .eq('stock_type', 'hospital');
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data?.map(item => ({
      id: item.id,
      medicineName: item.medicine_name,
      composition: item.composition,
      batchId: item.batch_id,
      quantity: item.quantity,
      price: item.price,
      expiryDate: item.expiry_date,
      status: item.status,
      organizationId: item.organization_id,
      organizationName: item.organization_name,
      dateAdded: item.date_added
    })) || [];
  }

  async verifyBatch(qrData: string, organizationId: string): Promise<boolean> {
    try {
      const parts = qrData.split('_');
      if (parts.length < 6 || parts[0] !== 'TRACK') {
        return false;
      }
      
      const trackingId = parts[1];
      const requestId = parts[2];
      const batchId = parts[3];
      const quantity = parseInt(parts[4]);
      const medicineName = parts.slice(5).join('-');
      
      // Find the corresponding request
      const { data: request } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .eq('requester_id', organizationId)
        .eq('status', 'Approved')
        .single();
      
      if (!request) {
        return false;
      }
      
      // Find the shipment
      const { data: shipment } = await supabase
        .from('shipments')
        .select('*')
        .eq('tracking_number', trackingId)
        .eq('status', 'In Transit')
        .single();
      
      if (!shipment) {
        return false;
      }
      
      // Check if batch already exists in wholesaler stock
      const { data: existingItem } = await supabase
        .from('medicines')
        .select('*')
        .eq('batch_id', batchId)
        .eq('organization_id', organizationId)
        .eq('stock_type', 'wholesaler')
        .single();

      // Find the original medicine from manufacturer
      const { data: manufacturerItem } = await supabase
        .from('medicines')
        .select('*')
        .eq('batch_id', batchId)
        .eq('organization_id', request.target_id)
        .eq('stock_type', 'manufacturer')
        .single();
      
      if (!manufacturerItem) {
        return false;
      }

      const receivingOrg = await this.getOrganizations('wholesaler').then(orgs => orgs.find(org => org.id === organizationId));
      if (!receivingOrg) {
        return false;
      }

      if (existingItem) {
        // Update existing batch quantity
        const { error: updateError } = await supabase
          .from('medicines')
          .update({ 
            quantity: existingItem.quantity + quantity,
            status: 'In Stock'
          })
          .eq('id', existingItem.id);
        
        if (updateError) {
          return false;
        }
      } else {
        // Add new batch to wholesaler stock
        const { error: insertError } = await supabase
          .from('medicines')
          .insert({
            medicine_name: manufacturerItem.medicine_name,
            composition: manufacturerItem.composition,
            batch_id: manufacturerItem.batch_id,
            quantity: quantity,
            price: manufacturerItem.price * 1.2,
            expiry_date: manufacturerItem.expiry_date,
            status: 'In Stock',
            organization_id: organizationId,
            organization_name: receivingOrg.name,
            stock_type: 'wholesaler'
          });
        
        if (insertError) {
          return false;
        }
      }
      
      // Update shipment status
      const { error: shipmentError } = await supabase
        .from('shipments')
        .update({ status: 'Delivered' })
        .eq('id', shipment.id);
      
      await this.addStockTrend(manufacturerItem.medicine_name, quantity, 'add', organizationId);
      await this.addTransaction('Received', manufacturerItem.medicine_name, batchId, quantity, organizationId, receivingOrg.name, `Batch verified and received from ${shipment.from_org}`);
      
      return true;
    } catch (error) {
      console.error('Error verifying batch:', error);
      return false;
    }
  }

  async verifyBatchHospital(qrData: string, organizationId: string): Promise<boolean> {
    try {
      const parts = qrData.split('_');
      if (parts.length < 6 || parts[0] !== 'TRACK') {
        return false;
      }
      
      const trackingId = parts[1];
      const requestId = parts[2];
      const batchId = parts[3];
      const quantity = parseInt(parts[4]);
      const medicineName = parts.slice(5).join('-');
      
      // Find the corresponding request
      const { data: request } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .eq('requester_id', organizationId)
        .eq('status', 'Approved')
        .single();
      
      if (!request) {
        return false;
      }
      
      // Find the shipment
      const { data: shipment } = await supabase
        .from('shipments')
        .select('*')
        .eq('tracking_number', trackingId)
        .eq('status', 'In Transit')
        .single();
      
      if (!shipment) {
        return false;
      }
      
      // Check if batch already exists in hospital stock
      const { data: existingItem } = await supabase
        .from('medicines')
        .select('*')
        .eq('batch_id', batchId)
        .eq('organization_id', organizationId)
        .eq('stock_type', 'hospital')
        .single();

      // Find the original medicine from wholesaler
      const { data: wholesalerItem } = await supabase
        .from('medicines')
        .select('*')
        .eq('batch_id', batchId)
        .eq('organization_id', request.target_id)
        .eq('stock_type', 'wholesaler')
        .single();
      
      if (!wholesalerItem) {
        return false;
      }

      const receivingOrg = await this.getOrganizations('hospital').then(orgs => orgs.find(org => org.id === organizationId));
      if (!receivingOrg) {
        return false;
      }

      if (existingItem) {
        // Update existing batch quantity
        const { error: updateError } = await supabase
          .from('medicines')
          .update({ 
            quantity: existingItem.quantity + quantity,
            status: 'In Stock'
          })
          .eq('id', existingItem.id);
        
        if (updateError) {
          return false;
        }
      } else {
        // Add new batch to hospital stock
        const { error: insertError } = await supabase
          .from('medicines')
          .insert({
            medicine_name: wholesalerItem.medicine_name,
            composition: wholesalerItem.composition,
            batch_id: wholesalerItem.batch_id,
            quantity: quantity,
            price: wholesalerItem.price * 1.15,
            expiry_date: wholesalerItem.expiry_date,
            status: 'In Stock',
            organization_id: organizationId,
            organization_name: receivingOrg.name,
            stock_type: 'hospital'
          });
        
        if (insertError) {
          return false;
        }
      }
      
      // Update shipment status
      const { error: shipmentError } = await supabase
        .from('shipments')
        .update({ status: 'Delivered' })
        .eq('id', shipment.id);
      
      await this.addStockTrend(wholesalerItem.medicine_name, quantity, 'add', organizationId);
      await this.addTransaction('Received', wholesalerItem.medicine_name, batchId, quantity, organizationId, receivingOrg.name, `Batch verified and received from ${shipment.from_org}`);
      
      return true;
    } catch (error) {
      console.error('Error verifying batch hospital:', error);
      return false;
    }
  }

  async transferMedicine(batchId: string, quantity: number, receiverOrgName: string, senderOrgId: string): Promise<boolean> {
    const { data: medicine, error: fetchError } = await supabase
      .from('medicines')
      .select('*')
      .eq('batch_id', batchId)
      .eq('organization_id', senderOrgId)
      .eq('stock_type', 'hospital')
      .single();
    
    if (fetchError || !medicine || medicine.quantity < quantity) {
      return false;
    }

    const newQuantity = medicine.quantity - quantity;
    let newStatus = medicine.status;
    
    if (newQuantity <= 0) {
      // Delete the medicine record
      await supabase
        .from('medicines')
        .delete()
        .eq('id', medicine.id);
    } else {
      if (newQuantity < 5) {
        newStatus = 'Critical Stock';
      }
      
      // Update quantity
      await supabase
        .from('medicines')
        .update({ 
          quantity: newQuantity,
          status: newStatus
        })
        .eq('id', medicine.id);
    }
    
    await this.addStockTrend(medicine.medicine_name, quantity, 'remove', senderOrgId);

    // Find receiver organization
    const receiverOrg = await this.getOrganizations('hospital').then(orgs => orgs.find(org => org.name === receiverOrgName));
    
    // Create shipment
    const trackingNumber = this.generateId('TRK');
    await supabase
      .from('shipments')
      .insert({
        tracking_number: trackingNumber,
        medicine: medicine.medicine_name,
        batch_id: batchId,
        quantity,
        from_org: medicine.organization_name,
        from_id: senderOrgId,
        to_org: receiverOrgName,
        to_id: receiverOrg?.id || '',
        status: 'In Transit'
      });

    await this.addTransaction('Transferred', medicine.medicine_name, batchId, quantity, senderOrgId, medicine.organization_name, `Transferred to ${receiverOrgName}`);
    
    return true;
  }

  async dispenseMedicine(medicine: string, batchId: string, quantity: number, patientInfo: string, organizationId: string): Promise<boolean> {
    const { data: medicineItem, error: fetchError } = await supabase
      .from('medicines')
      .select('*')
      .eq('medicine_name', medicine)
      .eq('batch_id', batchId)
      .eq('organization_id', organizationId)
      .eq('stock_type', 'hospital')
      .single();
    
    if (fetchError || !medicineItem || medicineItem.quantity < quantity) {
      return false;
    }

    const newQuantity = medicineItem.quantity - quantity;
    let newStatus = medicineItem.status;
    
    if (newQuantity <= 0) {
      // Delete the medicine record
      await supabase
        .from('medicines')
        .delete()
        .eq('id', medicineItem.id);
    } else {
      if (newQuantity < 5) {
        newStatus = 'Critical Stock';
      }
      
      // Update quantity
      await supabase
        .from('medicines')
        .update({ 
          quantity: newQuantity,
          status: newStatus
        })
        .eq('id', medicineItem.id);
    }
    
    await this.addStockTrend(medicine, quantity, 'remove', organizationId);
    await this.addTransaction('Dispensed', medicine, batchId, quantity, organizationId, medicineItem.organization_name, `Dispensed to patient: ${patientInfo}`);
    
    return true;
  }

  // Request management
  async addRequest(medicine: string, quantity: number, requesterOrgName: string, requesterOrgId: string, targetOrgName: string, targetOrgId: string, type: 'manufacturer_request' | 'wholesaler_request'): Promise<void> {
    const { error } = await supabase
      .from('requests')
      .insert({
        medicine,
        quantity,
        requester_org: requesterOrgName,
        requester_id: requesterOrgId,
        target_org: targetOrgName,
        target_id: targetOrgId,
        type,
        status: 'Pending'
      });

    if (error) throw error;
  }

  async addRequestWithBatch(medicine: string, batchId: string, quantity: number, requesterOrgName: string, requesterOrgId: string, targetOrgName: string, targetOrgId: string, type: 'manufacturer_request' | 'wholesaler_request'): Promise<void> {
    const { error } = await supabase
      .from('requests')
      .insert({
        medicine: `${medicine}-${batchId}`,
        quantity,
        requester_org: requesterOrgName,
        requester_id: requesterOrgId,
        target_org: targetOrgName,
        target_id: targetOrgId,
        type,
        status: 'Pending'
      });

    if (error) throw error;
  }

  async getRequests(targetOrgId?: string, type?: string): Promise<Request[]> {
    let query = supabase.from('requests').select('*');
    
    if (targetOrgId) {
      query = query.eq('target_id', targetOrgId);
    }
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data?.map(req => ({
      id: req.id,
      medicine: req.medicine,
      quantity: req.quantity,
      requesterOrg: req.requester_org,
      requesterId: req.requester_id,
      targetOrg: req.target_org,
      targetId: req.target_id,
      type: req.type as 'manufacturer_request' | 'wholesaler_request',
      status: req.status as 'Pending' | 'Approved',
      dateRequested: req.date_requested
    })) || [];
  }

  async getMyRequests(requesterOrgId: string): Promise<Request[]> {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('requester_id', requesterOrgId);
    
    if (error) throw error;
    
    return data?.map(req => ({
      id: req.id,
      medicine: req.medicine,
      quantity: req.quantity,
      requesterOrg: req.requester_org,
      requesterId: req.requester_id,
      targetOrg: req.target_org,
      targetId: req.target_id,
      type: req.type as 'manufacturer_request' | 'wholesaler_request',
      status: req.status as 'Pending' | 'Approved',
      dateRequested: req.date_requested
    })) || [];
  }

  async approveRequest(requestId: string, approverOrgId: string): Promise<{ success: boolean; qrData?: string; medicine?: Medicine; trackingId?: string }> {
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'Pending')
      .single();
    
    if (requestError || !request) {
      return { success: false };
    }

    // Parse medicine name and batch ID if they are combined
    let medicineName = request.medicine;
    let requestedBatchId = null;
    
    if (request.medicine.includes('-')) {
      const parts = request.medicine.split('-');
      if (parts.length >= 2) {
        medicineName = parts[0];
        requestedBatchId = parts[1];
      }
    }

    // Find available batch with sufficient quantity
    const stockType = request.type === 'manufacturer_request' ? 'manufacturer' : 'wholesaler';
    
    let query = supabase
      .from('medicines')
      .select('*')
      .eq('medicine_name', medicineName)
      .eq('organization_id', approverOrgId)
      .eq('stock_type', stockType)
      .gte('quantity', request.quantity);
    
    // If a specific batch was requested, filter by that batch ID
    if (requestedBatchId) {
      query = query.eq('batch_id', requestedBatchId);
    }
    
    const { data: availableBatches, error: batchError } = await query.order('quantity', { ascending: false });
    
    if (batchError) {
      console.error('Error fetching batches:', batchError);
      return { success: false };
    }

    if (!availableBatches || availableBatches.length === 0) {
      console.error('No available batch found with sufficient quantity');
      return { success: false };
    }

    // Use the first available batch (highest quantity due to ordering)
    const availableBatch = availableBatches[0];

    // Update stock
    const newQuantity = availableBatch.quantity - request.quantity;
    let newStatus = availableBatch.status;
    
    if (newQuantity <= 0) {
      await supabase
        .from('medicines')
        .delete()
        .eq('id', availableBatch.id);
    } else {
      if (stockType === 'manufacturer' && newQuantity < 100) {
        newStatus = 'Low Stock';
      } else if (stockType === 'wholesaler' && newQuantity < 10) {
        newStatus = 'Low Stock';
      }
      
      await supabase
        .from('medicines')
        .update({ 
          quantity: newQuantity,
          status: newStatus
        })
        .eq('id', availableBatch.id);
    }

    // Generate tracking ID and QR data
    const trackingId = this.generateId('TRK');
    const qrData = `TRACK_${trackingId}_${requestId}_${availableBatch.batch_id}_${request.quantity}_${medicineName}`;

    // Create shipment
    await supabase
      .from('shipments')
      .insert({
        tracking_number: trackingId,
        medicine: medicineName,
        batch_id: availableBatch.batch_id,
        quantity: request.quantity,
        from_org: request.target_org,
        from_id: approverOrgId,
        to_org: request.requester_org,
        to_id: request.requester_id,
        status: 'In Transit'
      });

    // Update request status
    await supabase
      .from('requests')
      .update({ status: 'Approved' })
      .eq('id', requestId);

    // Add stock trend and transaction
    this.addStockTrend(medicineName, request.quantity, 'remove', approverOrgId);
    this.addTransaction('Approved Request', medicineName, availableBatch.batch_id, request.quantity, approverOrgId, request.target_org, `Approved request from ${request.requester_org}`);

    const medicine: Medicine = {
      id: availableBatch.id,
      medicineName: availableBatch.medicine_name,
      composition: availableBatch.composition,
      batchId: availableBatch.batch_id,
      quantity: availableBatch.quantity,
      price: availableBatch.price,
      expiryDate: availableBatch.expiry_date,
      status: availableBatch.status,
      organizationId: availableBatch.organization_id,
      organizationName: availableBatch.organization_name,
      dateAdded: availableBatch.date_added
    };

    return { 
      success: true, 
      qrData, 
      medicine,
      trackingId
    };
  }

  // Transaction management
  async addTransaction(action: string, medicine: string, batchId: string, quantity: number, organizationId: string, organizationName: string, details: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .insert({
        action,
        medicine,
        batch_id: batchId,
        quantity,
        organization_id: organizationId,
        organization_name: organizationName,
        details
      });

    if (error) throw error;
  }

  async getTransactions(type?: string, organizationId?: string): Promise<Transaction[]> {
    let query = supabase.from('transactions').select('*').order('timestamp', { ascending: false });
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data?.map(txn => ({
      id: txn.id,
      action: txn.action,
      medicine: txn.medicine,
      batchId: txn.batch_id,
      quantity: txn.quantity,
      organizationId: txn.organization_id,
      organizationName: txn.organization_name,
      details: txn.details,
      timestamp: txn.timestamp
    })) || [];
  }

  // Shipment management
  async getShipments(organizationId?: string): Promise<Shipment[]> {
    let query = supabase.from('shipments').select('*');
    
    if (organizationId) {
      query = query.or(`from_id.eq.${organizationId},to_id.eq.${organizationId}`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data?.map(shipment => ({
      id: shipment.id,
      trackingNumber: shipment.tracking_number,
      medicine: shipment.medicine,
      batchId: shipment.batch_id,
      quantity: shipment.quantity,
      fromOrg: shipment.from_org,
      fromId: shipment.from_id,
      toOrg: shipment.to_org,
      toId: shipment.to_id,
      status: shipment.status as 'In Transit' | 'Delivered',
      dateShipped: shipment.date_shipped
    })) || [];
  }

  // Alert management
  async getWholesalerAlerts(organizationId: string): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const stock = await this.getWholesalerStock(organizationId);
    
    stock.forEach(item => {
      if (item.quantity < 10) {
        alerts.push({
          type: 'low_stock',
          message: `Low stock: ${item.medicineName} (${item.quantity} units remaining)`,
          severity: item.quantity < 5 ? 'high' : 'medium'
        });
      }
      
      const expiryDate = new Date(item.expiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 30) {
        alerts.push({
          type: 'expiry',
          message: `${item.medicineName} expires in ${daysUntilExpiry} days`,
          severity: daysUntilExpiry <= 7 ? 'high' : 'medium'
        });
      }
    });

    const pendingRequests = await this.getMyRequests(organizationId);
    const pending = pendingRequests.filter(req => req.status === 'Pending');
    if (pending.length > 0) {
      alerts.push({
        type: 'pending_request',
        message: `${pending.length} pending request(s)`,
        severity: 'low'
      });
    }

    return alerts;
  }

  async getHospitalAlerts(organizationId: string): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const stock = await this.getHospitalStock(organizationId);
    
    stock.forEach(item => {
      if (item.quantity < 5) {
        alerts.push({
          type: 'low_stock',
          message: `Critical stock: ${item.medicineName} (${item.quantity} units remaining)`,
          severity: item.quantity < 2 ? 'high' : 'medium'
        });
      }
      
      const expiryDate = new Date(item.expiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 15) {
        alerts.push({
          type: 'expiry',
          message: `${item.medicineName} expires in ${daysUntilExpiry} days`,
          severity: daysUntilExpiry <= 3 ? 'high' : 'medium'
        });
      }
    });

    const pendingRequests = await this.getMyRequests(organizationId);
    const pending = pendingRequests.filter(req => req.status === 'Pending');
    if (pending.length > 0) {
      alerts.push({
        type: 'pending_request',
        message: `${pending.length} pending request(s)`,
        severity: 'low'
      });
    }

    return alerts;
  }

  // Stock trend management
  async addStockTrend(medicineName: string, quantity: number, action: 'add' | 'remove', organizationId: string): Promise<void> {
    const { error } = await supabase
      .from('stock_trends')
      .insert({
        medicine_name: medicineName,
        quantity,
        action,
        organization_id: organizationId
      });
    
    if (error) throw error;
  }

  async getStockTrends(organizationId: string, timeframe: 'minute' | 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<StockTrend[]> {
    const now = new Date();
    let cutoffTime = new Date();
    
    switch (timeframe) {
      case 'minute':
        cutoffTime.setMinutes(now.getMinutes() - 60);
        break;
      case 'hour':
        cutoffTime.setHours(now.getHours() - 24);
        break;
      case 'day':
        cutoffTime.setDate(now.getDate() - 30);
        break;
      case 'week':
        cutoffTime.setDate(now.getDate() - 7 * 12);
        break;
      case 'month':
        cutoffTime.setMonth(now.getMonth() - 12);
        break;
    }
    
    const { data, error } = await supabase
      .from('stock_trends')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('timestamp', cutoffTime.toISOString());
    
    if (error) throw error;
    
    return data?.map(trend => ({
      timestamp: trend.timestamp,
      medicineName: trend.medicine_name,
      quantity: trend.quantity,
      action: trend.action as 'add' | 'remove',
      organizationId: trend.organization_id
    })) || [];
  }

  async getTrendAnalysis(organizationId: string): Promise<TrendAnalysis[]> {
    const trends = await this.getStockTrends(organizationId, 'day');
    const medicines = new Set(trends.map(t => t.medicineName));
    const analyses: TrendAnalysis[] = [];
    
    let currentStock: Medicine[] = [];
    const orgs = await this.getOrganizations();
    const org = orgs.find(o => o.id === organizationId);
    
    if (org?.role === 'manufacturer') {
      currentStock = await this.getManufacturerStock(organizationId);
    } else if (org?.role === 'wholesaler') {
      currentStock = await this.getWholesalerStock(organizationId);
    } else if (org?.role === 'hospital') {
      currentStock = await this.getHospitalStock(organizationId);
    }
    
    for (const medicineName of medicines) {
      const medicineTrends = trends.filter(t => t.medicineName === medicineName);
      const currentMedicine = currentStock.find(m => m.medicineName === medicineName);
      
      if (!currentMedicine) continue;
      
      // Calculate average consumption over the last 7 days
      const last7Days = medicineTrends.filter(t => {
        const trendDate = new Date(t.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return trendDate >= weekAgo;
      });
      
      const totalConsumed = last7Days
        .filter(t => t.action === 'remove')
        .reduce((sum, t) => sum + t.quantity, 0);
      
      const averageConsumption = totalConsumed / 7; // per day
      
      // Predict stockout date
      let expectedStockoutDate: string | null = null;
      let recommendedRestockDate: string | null = null;
      
      if (averageConsumption > 0) {
        const daysUntilStockout = currentMedicine.quantity / averageConsumption;
        const stockoutDate = new Date();
        stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout);
        expectedStockoutDate = stockoutDate.toISOString();
        
        // Recommend restocking when 20% of stock remains
        const restockDate = new Date();
        restockDate.setDate(restockDate.getDate() + (daysUntilStockout * 0.8));
        recommendedRestockDate = restockDate.toISOString();
      }
      
      // Determine trend
      const recentAdds = last7Days.filter(t => t.action === 'add').reduce((sum, t) => sum + t.quantity, 0);
      const recentRemoves = last7Days.filter(t => t.action === 'remove').reduce((sum, t) => sum + t.quantity, 0);
      
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentAdds > recentRemoves * 1.1) {
        trend = 'increasing';
      } else if (recentRemoves > recentAdds * 1.1) {
        trend = 'decreasing';
      }
      
      analyses.push({
        medicineName,
        currentStock: currentMedicine.quantity,
        averageConsumption,
        expectedStockoutDate,
        recommendedRestockDate,
        trend
      });
    }
    
    return analyses;
  }

  // Get cumulative stock levels for trend analysis
  async getCumulativeStockTrends(organizationId: string, timeframe: 'minute' | 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<any[]> {
    // Get current stock for each medicine
    let currentStock: Medicine[] = [];
    const orgs = await this.getOrganizations();
    const org = orgs.find(o => o.id === organizationId);
    
    if (org?.role === 'manufacturer') {
      currentStock = await this.getManufacturerStock(organizationId);
    } else if (org?.role === 'wholesaler') {
      currentStock = await this.getWholesalerStock(organizationId);
    } else if (org?.role === 'hospital') {
      currentStock = await this.getHospitalStock(organizationId);
    }
    
    // Get time range for trends
    const now = new Date();
    let cutoffTime = new Date();
    let timePoints: Date[] = [];
    
    switch (timeframe) {
      case 'minute':
        cutoffTime.setMinutes(now.getMinutes() - 60);
        for (let i = 60; i >= 0; i--) {
          const time = new Date(now);
          time.setMinutes(now.getMinutes() - i);
          timePoints.push(time);
        }
        break;
      case 'hour':
        cutoffTime.setHours(now.getHours() - 24);
        for (let i = 24; i >= 0; i--) {
          const time = new Date(now);
          time.setHours(now.getHours() - i);
          timePoints.push(time);
        }
        break;
      case 'day':
        cutoffTime.setDate(now.getDate() - 30);
        for (let i = 30; i >= 0; i--) {
          const time = new Date(now);
          time.setDate(now.getDate() - i);
          timePoints.push(time);
        }
        break;
      case 'week':
        cutoffTime.setDate(now.getDate() - 7 * 12);
        for (let i = 12; i >= 0; i--) {
          const time = new Date(now);
          time.setDate(now.getDate() - (i * 7));
          timePoints.push(time);
        }
        break;
      case 'month':
        cutoffTime.setMonth(now.getMonth() - 12);
        for (let i = 12; i >= 0; i--) {
          const time = new Date(now);
          time.setMonth(now.getMonth() - i);
          timePoints.push(time);
        }
        break;
    }
    
    // Get all stock trends for this organization within timeframe
    const { data: allTrends, error } = await supabase
      .from('stock_trends')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('timestamp', cutoffTime.toISOString())
      .order('timestamp', { ascending: true });
    
    if (error) throw error;
    
    const trends = allTrends?.map(trend => ({
      timestamp: trend.timestamp,
      medicineName: trend.medicine_name,
      quantity: trend.quantity,
      action: trend.action as 'add' | 'remove',
      organizationId: trend.organization_id
    })) || [];
    
    // Get all medicines that have trends or current stock
    const allMedicines = new Set([
      ...trends.map(t => t.medicineName),
      ...currentStock.map(m => m.medicineName)
    ]);
    
    // Initialize stock levels for each medicine
    const medicineStockLevels: { [key: string]: number } = {};
    allMedicines.forEach(medicine => {
      const currentMedicine = currentStock.find(m => m.medicineName === medicine);
      medicineStockLevels[medicine] = currentMedicine ? currentMedicine.quantity : 0;
    });
    
    // Work backwards from current time to calculate stock at each time point
    const chartData = timePoints.map(timePoint => {
      const timeKey = this.formatTimeKey(timePoint, timeframe);
      const result: any = { time: timeKey };
      
      // Calculate stock levels at this time point by working backwards from current stock
      const stockAtThisTime: { [key: string]: number } = { ...medicineStockLevels };
      
      // Find all trends that happened after this time point and reverse them
      const futureChanges = trends.filter(trend => new Date(trend.timestamp) > timePoint);
      
      futureChanges.forEach(trend => {
        const reverseChange = trend.action === 'add' ? -trend.quantity : trend.quantity;
        stockAtThisTime[trend.medicineName] = Math.max(0, (stockAtThisTime[trend.medicineName] || 0) + reverseChange);
      });
      
      // Add stock levels for each medicine to the result
      allMedicines.forEach(medicine => {
        result[medicine] = stockAtThisTime[medicine] || 0;
      });
      
      return result;
    });
    
    return chartData;
  }
  
  private formatTimeKey(date: Date, timeframe: 'minute' | 'hour' | 'day' | 'week' | 'month'): string {
    switch (timeframe) {
      case 'minute':
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      case 'hour':
        return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:00`;
      case 'day':
        return `${date.getMonth() + 1}/${date.getDate()}`;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `Week ${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  }

  // Drug verification for public use
  async verifyDrugByQR(qrData: string): Promise<{ isValid: boolean; medicine?: Medicine; error?: string }> {
    try {
      const parts = qrData.split('_');
      if (parts.length < 3 || parts[0] !== 'MED') {
        return { isValid: false, error: 'Invalid QR code format' };
      }
      
      const batchId = parts[1];
      const manufacturerId = parts[2];
      
      // Search only in manufacturer stock for original medicine
      const { data: medicine, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('batch_id', batchId)
        .eq('organization_id', manufacturerId)
        .eq('stock_type', 'manufacturer')
        .single();
      
      if (error || !medicine) {
        return { isValid: false, error: 'Medicine not found or counterfeit' };
      }

      return { 
        isValid: true, 
        medicine: {
          id: medicine.id,
          medicineName: medicine.medicine_name,
          composition: medicine.composition,
          batchId: medicine.batch_id,
          quantity: medicine.quantity,
          price: medicine.price,
          expiryDate: medicine.expiry_date,
          status: medicine.status,
          organizationId: medicine.organization_id,
          organizationName: medicine.organization_name,
          dateAdded: medicine.date_added
        }
      };
    } catch (error) {
      return { isValid: false, error: 'Error processing QR code' };
    }
  }
}

export const supabaseDataManager = new SupabaseDataManager();