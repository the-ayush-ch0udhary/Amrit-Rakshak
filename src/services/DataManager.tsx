import { Organization, Medicine, Request, Shipment, Transaction, Alert, StockTrend, TrendAnalysis } from '../types';

class DataManager {
  private organizations: {
    manufacturers: Organization[];
    wholesalers: Organization[];
    hospitals: Organization[];
  } = {
    manufacturers: [],
    wholesalers: [],
    hospitals: []
  };

  private manufacturerStock: Medicine[] = [];
  private wholesalerStock: Medicine[] = [];
  private hospitalStock: Medicine[] = [];
  private requests: Request[] = [];
  private shipments: Shipment[] = [];
  private transactions: Transaction[] = [];
  private stockTrends: StockTrend[] = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Load data from localStorage
    const orgData = this.loadData('organizations');
    if (orgData) {
      this.organizations = orgData;
    } else {
      // Initialize with default organizations
      this.organizations = {
        manufacturers: [
          { id: 'MFG001', name: 'PharmaCorp Industries', password: 'admin123', role: 'manufacturer' }
        ],
        wholesalers: [
          { id: 'WHL001', name: 'MedDistribute Co', password: 'admin123', role: 'wholesaler' }
        ],
        hospitals: [
          { id: 'HSP001', name: 'City General Hospital', password: 'admin123', role: 'hospital' }
        ]
      };
      this.saveData('organizations', this.organizations);
    }

    this.manufacturerStock = this.loadData('manufacturerStock') || [];
    this.wholesalerStock = this.loadData('wholesalerStock') || [];
    this.hospitalStock = this.loadData('hospitalStock') || [];
    this.requests = this.loadData('requests') || [];
    this.shipments = this.loadData('shipments') || [];
    this.transactions = this.loadData('transactions') || [];
    this.stockTrends = this.loadData('stockTrends') || [];
  }

  private loadData(key: string): any {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private saveData(key: string, data: any): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private generateId(prefix: string): string {
    return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  // Organization management
  getOrganizations(type?: string): Organization[] {
    if (type === 'manufacturer') return this.organizations.manufacturers;
    if (type === 'wholesaler') return this.organizations.wholesalers;
    if (type === 'hospital') return this.organizations.hospitals;
    return [
      ...this.organizations.manufacturers,
      ...this.organizations.wholesalers,
      ...this.organizations.hospitals
    ];
  }

  getOrganizationByName(name: string, role: string): Organization | undefined {
    const orgs = this.getOrganizations(role);
    return orgs.find(org => org.name === name);
  }

  addOrganization(org: Omit<Organization, 'id'>): string {
    const id = this.generateId(org.role.substring(0, 3).toUpperCase());
    const newOrg: Organization = { ...org, id };
    
    if (org.role === 'manufacturer') {
      this.organizations.manufacturers.push(newOrg);
    } else if (org.role === 'wholesaler') {
      this.organizations.wholesalers.push(newOrg);
    } else {
      this.organizations.hospitals.push(newOrg);
    }
    
    this.saveData('organizations', this.organizations);
    return id;
  }

  // Medicine management
  addMedicine(medicine: Omit<Medicine, 'id' | 'dateAdded'>): void {
    const newMedicine: Medicine = {
      ...medicine,
      id: this.generateId('MED'),
      dateAdded: new Date().toISOString()
    };
    
    this.manufacturerStock.push(newMedicine);
    this.saveData('manufacturerStock', this.manufacturerStock);
    this.addStockTrend(medicine.medicineName, medicine.quantity, 'add', medicine.organizationId);
    this.addTransaction('Manufactured', medicine.medicineName, medicine.batchId, medicine.quantity, medicine.organizationId, medicine.organizationName, 'New batch manufactured');
  }

  generateQRCode(batchId: string, organizationId: string): string | null {
    const batch = this.manufacturerStock.find(b => b.batchId === batchId && b.organizationId === organizationId);
    if (batch) {
      return `MED-${batch.batchId}-${organizationId}`;
    }
    return null;
  }

  // Get available medicines for requests
  getAvailableMedicines(targetOrgId: string): string[] {
    const targetOrg = this.getOrganizations().find(org => org.id === targetOrgId);
    if (!targetOrg) return [];

    if (targetOrg.role === 'manufacturer') {
      const stock = this.getManufacturerStock(targetOrgId);
      return Array.from(new Set(stock.map(item => item.medicineName)));
    } else if (targetOrg.role === 'wholesaler') {
      const stock = this.getWholesalerStock(targetOrgId);
      return Array.from(new Set(stock.map(item => item.medicineName)));
    }
    
    return [];
  }

  getManufacturerStock(organizationId?: string): Medicine[] {
    return organizationId 
      ? this.manufacturerStock.filter(item => item.organizationId === organizationId)
      : this.manufacturerStock;
  }

  getWholesalerStock(organizationId?: string): Medicine[] {
    return organizationId 
      ? this.wholesalerStock.filter(item => item.organizationId === organizationId)
      : this.wholesalerStock;
  }

  getHospitalStock(organizationId?: string): Medicine[] {
    return organizationId 
      ? this.hospitalStock.filter(item => item.organizationId === organizationId)
      : this.hospitalStock;
  }

  // Transfer and verification - Updated for request-based system
  verifyBatch(qrData: string, organizationId: string): boolean {
    // Parse QR data: TRACK-{trackingId}-{requestId}-{batchId}-{quantity}-{medicine}
    const parts = qrData.split('-');
    if (parts.length < 6 || parts[0] !== 'TRACK') {
      return false;
    }
    
    const trackingId = parts[1];
    const requestId = parts[2];
    const batchId = parts[3];
    const quantity = parseInt(parts[4]);
    const medicineName = parts.slice(5).join('-');
    
    // Find the corresponding request
    const request = this.requests.find(r => 
      r.id === requestId && 
      r.requesterId === organizationId && 
      r.status === 'Approved'
    );
    
    if (!request) {
      return false;
    }
    
    // Find the shipment
    const shipment = this.shipments.find(s => 
      s.trackingNumber === trackingId && 
      s.status === 'In Transit'
    );
    
    if (!shipment) {
      return false;
    }
    
    // Check if already exists in wholesaler stock
    const existingItem = this.wholesalerStock.find(item => 
      item.batchId === batchId && item.organizationId === organizationId
    );

    if (existingItem) {
      return false;
    }

    // Find the original medicine from manufacturer
    const manufacturerItem = this.manufacturerStock.find(item => 
      item.batchId === batchId && item.organizationId === request.targetId
    );
    
    if (!manufacturerItem) {
      return false;
    }

    const receivingOrg = this.getOrganizations('wholesaler').find(org => org.id === organizationId);
    if (!receivingOrg) return false;

    const newItem: Medicine = {
      ...manufacturerItem,
      id: this.generateId('MED'),
      quantity: quantity,
      price: manufacturerItem.price * 1.2,
      organizationId,
      organizationName: receivingOrg.name,
      status: 'In Stock',
      dateAdded: new Date().toISOString()
    };

    this.wholesalerStock.push(newItem);
    
    // Update shipment status
    shipment.status = 'Delivered';
    
    this.addStockTrend(newItem.medicineName, quantity, 'add', organizationId);
    
    this.saveData('wholesalerStock', this.wholesalerStock);
    this.saveData('shipments', this.shipments);
    this.addTransaction('Received', newItem.medicineName, batchId, quantity, organizationId, receivingOrg.name, `Batch verified and received from ${shipment.fromOrg}`);
    
    return true;
  }

  verifyBatchHospital(qrData: string, organizationId: string): boolean {
    // Parse QR data: TRACK-{trackingId}-{requestId}-{batchId}-{quantity}-{medicine}
    const parts = qrData.split('-');
    if (parts.length < 6 || parts[0] !== 'TRACK') {
      return false;
    }
    
    const trackingId = parts[1];
    const requestId = parts[2];
    const batchId = parts[3];
    const quantity = parseInt(parts[4]);
    const medicineName = parts.slice(5).join('-');
    
    // Find the corresponding request
    const request = this.requests.find(r => 
      r.id === requestId && 
      r.requesterId === organizationId && 
      r.status === 'Approved'
    );
    
    if (!request) {
      return false;
    }
    
    // Find the shipment
    const shipment = this.shipments.find(s => 
      s.trackingNumber === trackingId && 
      s.status === 'In Transit'
    );
    
    if (!shipment) {
      return false;
    }
    
    // Check if already exists in hospital stock
    const existingItem = this.hospitalStock.find(item => 
      item.batchId === batchId && item.organizationId === organizationId
    );

    if (existingItem) {
      return false;
    }

    // Find the original medicine from wholesaler
    const wholesalerItem = this.wholesalerStock.find(item => 
      item.batchId === batchId && item.organizationId === request.targetId
    );
    
    if (!wholesalerItem) {
      return false;
    }

    const receivingOrg = this.getOrganizations('hospital').find(org => org.id === organizationId);
    if (!receivingOrg) return false;

    const newItem: Medicine = {
      ...wholesalerItem,
      id: this.generateId('MED'),
      quantity: quantity,
      price: wholesalerItem.price * 1.15,
      organizationId,
      organizationName: receivingOrg.name,
      status: 'In Stock',
      dateAdded: new Date().toISOString()
    };

    this.hospitalStock.push(newItem);
    
    // Update shipment status
    shipment.status = 'Delivered';
    
    this.addStockTrend(newItem.medicineName, quantity, 'add', organizationId);
    
    this.saveData('hospitalStock', this.hospitalStock);
    this.saveData('shipments', this.shipments);
    this.addTransaction('Received', newItem.medicineName, batchId, quantity, organizationId, receivingOrg.name, `Batch verified and received from ${shipment.fromOrg}`);
    
    return true;
  }

  // Hospital transfer medicine (kept intact)
  transferMedicine(batchId: string, quantity: number, receiverOrgName: string, senderOrgId: string): boolean {
    const medicineIndex = this.hospitalStock.findIndex(item => 
      item.batchId === batchId && item.organizationId === senderOrgId
    );
    
    if (medicineIndex === -1 || this.hospitalStock[medicineIndex].quantity < quantity) {
      return false;
    }

    const medicine = this.hospitalStock[medicineIndex];
    medicine.quantity -= quantity;
    
    if (medicine.quantity <= 0) {
      this.hospitalStock.splice(medicineIndex, 1);
    } else if (medicine.quantity < 5) {
      medicine.status = 'Critical Stock';
    }
    
    this.addStockTrend(medicine.medicineName, quantity, 'remove', senderOrgId);

    // Find receiver organization
    const receiverOrg = this.getOrganizations('hospital').find(org => org.name === receiverOrgName);
    
    // Create shipment
    const shipment: Shipment = {
      id: this.generateId('SHP'),
      trackingNumber: this.generateId('TRK'),
      medicine: medicine.medicineName,
      batchId,
      quantity,
      fromOrg: medicine.organizationName,
      fromId: senderOrgId,
      toOrg: receiverOrgName,
      toId: receiverOrg?.id || '',
      status: 'In Transit',
      dateShipped: new Date().toISOString()
    };

    this.shipments.push(shipment);
    this.saveData('hospitalStock', this.hospitalStock);
    this.saveData('shipments', this.shipments);
    this.addTransaction('Transferred', medicine.medicineName, batchId, quantity, senderOrgId, medicine.organizationName, `Transferred to ${receiverOrgName}`);
    
    return true;
  }

  dispenseMedicine(medicine: string, batchId: string, quantity: number, patientInfo: string, organizationId: string): boolean {
    const medicineIndex = this.hospitalStock.findIndex(item => 
      item.medicineName === medicine && item.batchId === batchId && item.organizationId === organizationId
    );
    
    if (medicineIndex === -1 || this.hospitalStock[medicineIndex].quantity < quantity) {
      return false;
    }

    const medicineItem = this.hospitalStock[medicineIndex];
    medicineItem.quantity -= quantity;
    
    if (medicineItem.quantity <= 0) {
      this.hospitalStock.splice(medicineIndex, 1);
    } else if (medicineItem.quantity < 5) {
      medicineItem.status = 'Critical Stock';
    }
    
    this.addStockTrend(medicine, quantity, 'remove', organizationId);

    this.saveData('hospitalStock', this.hospitalStock);
    this.addTransaction('Dispensed', medicine, batchId, quantity, organizationId, medicineItem.organizationName, `Dispensed to patient: ${patientInfo}`);
    
    return true;
  }

  // Request management
  addRequest(medicine: string, quantity: number, requesterOrgName: string, requesterOrgId: string, targetOrgName: string, targetOrgId: string, type: 'manufacturer_request' | 'wholesaler_request'): void {
    const request: Request = {
      id: this.generateId('REQ'),
      medicine,
      quantity,
      requesterOrg: requesterOrgName,
      requesterId: requesterOrgId,
      targetOrg: targetOrgName,
      targetId: targetOrgId,
      type,
      status: 'Pending',
      dateRequested: new Date().toISOString()
    };

    this.requests.push(request);
    this.saveData('requests', this.requests);
  }

  getRequests(targetOrgId?: string, type?: string): Request[] {
    let filtered = this.requests;
    
    if (targetOrgId) {
      filtered = filtered.filter(req => req.targetId === targetOrgId);
    }
    
    if (type) {
      filtered = filtered.filter(req => req.type === type);
    }
    
    return filtered;
  }

  getMyRequests(requesterOrgId: string): Request[] {
    return this.requests.filter(req => req.requesterId === requesterOrgId);
  }

  approveRequest(requestId: string, approverOrgId: string): { success: boolean; qrData?: string; medicine?: Medicine; trackingId?: string } {
    const request = this.requests.find(req => req.id === requestId);
    if (!request || request.status !== 'Pending') {
      return { success: false };
    }

    // Find available batch with sufficient quantity
    let availableBatch: Medicine | undefined;
    let sourceStock: Medicine[];
    
    if (request.type === 'manufacturer_request') {
      sourceStock = this.manufacturerStock;
      availableBatch = sourceStock.find(item => 
        item.medicineName === request.medicine && 
        item.quantity >= request.quantity && 
        item.organizationId === approverOrgId
      );
    } else {
      sourceStock = this.wholesalerStock;
      availableBatch = sourceStock.find(item => 
        item.medicineName === request.medicine && 
        item.quantity >= request.quantity && 
        item.organizationId === approverOrgId
      );
    }
    
    if (!availableBatch) {
      return { success: false };
    }

    // Update stock
    availableBatch.quantity -= request.quantity;
    if (availableBatch.quantity <= 0) {
      const index = sourceStock.findIndex(item => item.id === availableBatch!.id);
      sourceStock.splice(index, 1);
    } else if (request.type === 'manufacturer_request' && availableBatch.quantity < 50) {
      availableBatch.status = 'Low Stock';
    } else if (request.type === 'wholesaler_request' && availableBatch.quantity < 10) {
      availableBatch.status = 'Low Stock';
    }

    // Generate tracking ID and QR data
    const trackingId = this.generateId('TRK');
    const qrData = `TRACK-${trackingId}-${requestId}-${availableBatch.batchId}-${request.quantity}-${request.medicine}`;

    // Create shipment
    const shipment: Shipment = {
      id: this.generateId('SHP'),
      trackingNumber: trackingId,
      medicine: request.medicine,
      batchId: availableBatch.batchId,
      quantity: request.quantity,
      fromOrg: request.targetOrg,
      fromId: approverOrgId,
      toOrg: request.requesterOrg,
      toId: request.requesterId,
      status: 'In Transit',
      dateShipped: new Date().toISOString()
    };

    // Update request status
    request.status = 'Approved';

    // Add stock trend and transaction
    this.addStockTrend(request.medicine, request.quantity, 'remove', approverOrgId);
    this.addTransaction('Approved Request', request.medicine, availableBatch.batchId, request.quantity, approverOrgId, request.targetOrg, `Approved request from ${request.requesterOrg}`);

    this.shipments.push(shipment);
    this.saveData('requests', this.requests);
    this.saveData('shipments', this.shipments);
    
    if (request.type === 'manufacturer_request') {
      this.saveData('manufacturerStock', this.manufacturerStock);
    } else {
      this.saveData('wholesalerStock', this.wholesalerStock);
    }

    return { 
      success: true, 
      qrData, 
      medicine: availableBatch,
      trackingId
    };
  }

  // Transaction management
  addTransaction(action: string, medicine: string, batchId: string, quantity: number, organizationId: string, organizationName: string, details: string): void {
    const transaction: Transaction = {
      id: this.generateId('TXN'),
      action,
      medicine,
      batchId,
      quantity,
      organizationId,
      organizationName,
      details,
      timestamp: new Date().toISOString()
    };

    this.transactions.push(transaction);
    this.saveData('transactions', this.transactions);
  }

  getTransactions(type?: string, organizationId?: string): Transaction[] {
    let filtered = this.transactions;
    
    if (organizationId) {
      filtered = filtered.filter(txn => txn.organizationId === organizationId);
    }
    
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Shipment management - Updated to show only relevant shipments
  getShipments(organizationId?: string): Shipment[] {
    return organizationId 
      ? this.shipments.filter(shipment => 
          shipment.fromId === organizationId || shipment.toId === organizationId
        )
      : this.shipments;
  }

  // Alert management
  getWholesalerAlerts(organizationId: string): Alert[] {
    const alerts: Alert[] = [];
    const stock = this.getWholesalerStock(organizationId);
    
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

    const pendingRequests = this.getMyRequests(organizationId).filter(req => req.status === 'Pending');
    if (pendingRequests.length > 0) {
      alerts.push({
        type: 'pending_request',
        message: `${pendingRequests.length} pending request(s)`,
        severity: 'low'
      });
    }

    return alerts;
  }

  getHospitalAlerts(organizationId: string): Alert[] {
    const alerts: Alert[] = [];
    const stock = this.getHospitalStock(organizationId);
    
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

    const pendingRequests = this.getMyRequests(organizationId).filter(req => req.status === 'Pending');
    if (pendingRequests.length > 0) {
      alerts.push({
        type: 'pending_request',
        message: `${pendingRequests.length} pending request(s)`,
        severity: 'low'
      });
    }

    return alerts;
  }

  // Stock trend management
  addStockTrend(medicineName: string, quantity: number, action: 'add' | 'remove', organizationId: string): void {
    const trend: StockTrend = {
      timestamp: new Date().toISOString(),
      medicineName,
      quantity,
      action,
      organizationId
    };
    
    this.stockTrends.push(trend);
    this.saveData('stockTrends', this.stockTrends);
  }

  getStockTrends(organizationId: string, timeframe: 'minute' | 'hour' | 'day' | 'week' | 'month' = 'day'): StockTrend[] {
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
    
    return this.stockTrends.filter(trend => 
      trend.organizationId === organizationId && 
      new Date(trend.timestamp) >= cutoffTime
    );
  }

  getTrendAnalysis(organizationId: string): TrendAnalysis[] {
    const trends = this.getStockTrends(organizationId, 'day');
    const medicines = new Set(trends.map(t => t.medicineName));
    const analyses: TrendAnalysis[] = [];
    
    let currentStock: Medicine[] = [];
    const org = this.getOrganizations().find(o => o.id === organizationId);
    
    if (org?.role === 'manufacturer') {
      currentStock = this.getManufacturerStock(organizationId);
    } else if (org?.role === 'wholesaler') {
      currentStock = this.getWholesalerStock(organizationId);
    } else if (org?.role === 'hospital') {
      currentStock = this.getHospitalStock(organizationId);
    }
    
    medicines.forEach(medicineName => {
      const medicineTrends = trends.filter(t => t.medicineName === medicineName);
      const currentMedicine = currentStock.find(m => m.medicineName === medicineName);
      
      if (!currentMedicine) return;
      
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
    });
    
    return analyses;
  }

  // Drug verification for public use - Updated to search all manufacturer stock
  verifyDrugByQR(qrData: string): { isValid: boolean; medicine?: Medicine; error?: string } {
    try {
      const parts = qrData.split('-');
      if (parts.length < 3 || parts[0] !== 'MED') {
        return { isValid: false, error: 'Invalid QR code format' };
      }
      
      const batchId = parts[1];
      const manufacturerId = parts[2];
      
      // Search only in manufacturer stock for original medicine
      const medicine = this.manufacturerStock.find(m => 
        m.batchId === batchId && m.organizationId === manufacturerId
      );
      
      if (medicine) {
        return { isValid: true, medicine };
      } else {
        return { isValid: false, error: 'Medicine not found or counterfeit' };
      }
    } catch (error) {
      return { isValid: false, error: 'Error processing QR code' };
    }
  }
}

export const dataManager = new DataManager();