import React, { useState, useEffect } from 'react';
import { CheckCircle, Package, Clock, AlertTriangle, Truck, Eye, History, FileText } from 'lucide-react';
import { supabaseDataManager } from '../services/SupabaseDataManager';
import { Medicine, Request, Shipment, Transaction, Alert } from '../types';
import { QRCodeModal } from './Forms';

interface TableProps {
  organizationId: string;
  refreshKey?: number;
  targetOrgId?: string;
  requesterOrgId?: string;
  type?: string;
  onApprove?: (message: string) => void;
}

const Tables = {
  ManufacturerStock: ({ organizationId, refreshKey }: TableProps) => {
    const [stock, setStock] = useState<Medicine[]>([]);

    useEffect(() => {
      const loadStock = async () => {
        const stockData = await supabaseDataManager.getManufacturerStock(organizationId);
        setStock(stockData);
      };
      loadStock();
    }, [organizationId, refreshKey]);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
            <Package className="w-4 h-4 text-white" />
          </div>
          Current Stock
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Medicine</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Batch ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Composition</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stock.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.medicineName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-600">{item.batchId}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={item.composition}>{item.composition}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">${item.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.expiryDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                      item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stock.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No stock available</p>
              <p className="text-gray-400 text-sm">Add medicines to see them here</p>
            </div>
          )}
        </div>
      </div>
    );
  },

  WholesalerStock: ({ organizationId, refreshKey }: TableProps) => {
    const [stock, setStock] = useState<Medicine[]>([]);

    useEffect(() => {
      const loadStock = async () => {
        const stockData = await supabaseDataManager.getWholesalerStock(organizationId);
        setStock(stockData);
      };
      loadStock();
    }, [organizationId, refreshKey]);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
            <Package className="w-4 h-4 text-white" />
          </div>
          Stock Overview
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Medicine</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Batch ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Composition</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stock.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.medicineName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-600">{item.batchId}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={item.composition}>{item.composition}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">${item.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.expiryDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                      item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stock.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No stock available</p>
              <p className="text-gray-400 text-sm">Scan and verify medicines to see them here</p>
            </div>
          )}
        </div>
      </div>
    );
  },

  HospitalStock: ({ organizationId, refreshKey }: TableProps) => {
    const [stock, setStock] = useState<Medicine[]>([]);

    useEffect(() => {
      const loadStock = async () => {
        const stockData = await supabaseDataManager.getHospitalStock(organizationId);
        setStock(stockData);
      };
      loadStock();
    }, [organizationId, refreshKey]);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
            <Package className="w-4 h-4 text-white" />
          </div>
          Stock Overview
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Medicine</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Batch ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Composition</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stock.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.medicineName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-600">{item.batchId}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={item.composition}>{item.composition}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">${item.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.expiryDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                      item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'Critical Stock' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stock.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No stock available</p>
              <p className="text-gray-400 text-sm">Scan and verify medicines to see them here</p>
            </div>
          )}
        </div>
      </div>
    );
  },

  Requests: ({ targetOrgId, type, refreshKey, onApprove }: TableProps) => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrModalData, setQrModalData] = useState<{
      qrData: string;
      trackingId: string;
      medicine: any;
      quantity: number;
    } | null>(null);

    useEffect(() => {
     const loadRequests = async () => {
       const requestData = await supabaseDataManager.getRequests(targetOrgId, type);
       setRequests(requestData);
     };
     loadRequests();
    }, [targetOrgId, type, refreshKey]);

    const handleApprove = async (requestId: string) => {
      try {
        const result = await supabaseDataManager.approveRequest(requestId, targetOrgId!);
        if (result.success && result.qrData && result.medicine && result.trackingId) {
          const request = requests.find(r => r.id === requestId);
          setQrModalData({
            qrData: result.qrData,
            trackingId: result.trackingId,
            medicine: result.medicine,
            quantity: request?.quantity || 0
          });
          setShowQRModal(true);
          onApprove?.('Request approved successfully - QR code generated');
          const requestData = await supabaseDataManager.getRequests(targetOrgId, type);
          setRequests(requestData);
        } else {
          onApprove?.('Request approval failed: Insufficient stock');
        }
      } catch (error) {
        onApprove?.('Request approval failed: Error occurred');
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
            <Eye className="w-4 h-4 text-white" />
          </div>
          Incoming Requests
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Medicine</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Requester</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-blue-50 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.medicine}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{request.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.requesterOrg}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(request.dateRequested).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 animate-pulse' : 'bg-green-100 text-green-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {request.status === 'Pending' && (
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg flex items-center transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </button>
                    )}
                    {request.status === 'Approved' && (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approved
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {requests.length === 0 && (
            <div className="text-center py-12">
              <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No requests found</p>
              <p className="text-gray-400 text-sm">Incoming requests will appear here</p>
            </div>
          )}
        </div>
        
        {/* QR Code Modal */}
        {showQRModal && qrModalData && (
          <QRCodeModal
            isOpen={showQRModal}
            onClose={() => {
              setShowQRModal(false);
              setQrModalData(null);
            }}
            qrData={qrModalData.qrData}
            trackingId={qrModalData.trackingId}
            medicine={qrModalData.medicine}
            quantity={qrModalData.quantity}
          />
        )}
      </div>
    );
  },

  MyRequests: ({ requesterOrgId, refreshKey }: TableProps) => {
    const [requests, setRequests] = useState<Request[]>([]);

    useEffect(() => {
      const loadRequests = async () => {
        const requestData = await supabaseDataManager.getMyRequests(requesterOrgId!);
        setRequests(requestData);
      };
      loadRequests();
    }, [requesterOrgId, refreshKey]);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
            <FileText className="w-4 h-4 text-white" />
          </div>
          My Requests
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Medicine</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Target</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-blue-50 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.medicine}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{request.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.targetOrg}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(request.dateRequested).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 animate-pulse' : 'bg-green-100 text-green-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {requests.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No requests found</p>
              <p className="text-gray-400 text-sm">Your requests will appear here</p>
            </div>
          )}
        </div>
      </div>
    );
  },

  Shipments: ({ organizationId, refreshKey }: TableProps) => {
    const [shipments, setShipments] = useState<Shipment[]>([]);

    useEffect(() => {
      const loadShipments = async () => {
        const shipmentData = await supabaseDataManager.getShipments(organizationId);
        setShipments(shipmentData);
      };
      loadShipments();
    }, [organizationId, refreshKey]);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
            <Truck className="w-4 h-4 text-white" />
          </div>
          Shipment Tracking
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tracking #</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Medicine</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">From</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">To</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-blue-50 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-indigo-600">{shipment.trackingNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipment.medicine}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{shipment.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shipment.fromOrg}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shipment.toOrg}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      shipment.status === 'In Transit' ? 'bg-blue-100 text-blue-800 animate-pulse' : 'bg-green-100 text-green-800'
                    }`}>
                      {shipment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(shipment.dateShipped).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {shipments.length === 0 && (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No shipments found</p>
              <p className="text-gray-400 text-sm">Shipment tracking information will appear here</p>
            </div>
          )}
        </div>
      </div>
    );
  },

  Transactions: ({ organizationId, refreshKey }: TableProps) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
      const loadTransactions = async () => {
        const transactionData = await supabaseDataManager.getTransactions(undefined, organizationId);
        setTransactions(transactionData);
      };
      loadTransactions();
    }, [organizationId, refreshKey]);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center mr-3">
            <History className="w-4 h-4 text-white" />
          </div>
          Transaction History
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Medicine</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Batch ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-blue-50 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.action === 'Manufactured' ? 'bg-blue-100 text-blue-800' :
                      transaction.action === 'Transferred' ? 'bg-purple-100 text-purple-800' :
                      transaction.action === 'Received' ? 'bg-green-100 text-green-800' :
                      transaction.action === 'Dispatched' ? 'bg-orange-100 text-orange-800' :
                      transaction.action === 'Dispensed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.medicine}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-600">{transaction.batchId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{transaction.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{transaction.details}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(transaction.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No transactions found</p>
              <p className="text-gray-400 text-sm">Transaction history will appear here</p>
            </div>
          )}
        </div>
      </div>
    );
  },

  WholesalerAlerts: ({ organizationId, refreshKey }: TableProps) => {
    const [alerts, setAlerts] = useState<Alert[]>([]);

    useEffect(() => {
      const loadAlerts = async () => {
        const alertData = await supabaseDataManager.getWholesalerAlerts(organizationId!);
        setAlerts(alertData);
      };
      loadAlerts();
    }, [organizationId, refreshKey]);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          Alerts
        </h3>
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border-l-4 shadow-sm ${
                alert.severity === 'high' ? 'bg-red-50 border-red-400' :
                alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                'bg-blue-50 border-blue-400'
              }`}
            >
              <div className="flex items-start">
                <AlertTriangle className={`w-5 h-5 mr-3 mt-0.5 ${
                  alert.severity === 'high' ? 'text-red-500' :
                  alert.severity === 'medium' ? 'text-yellow-500' :
                  'text-blue-500'
                }`} />
                <div>
                  <p className={`text-sm font-medium ${
                    alert.severity === 'high' ? 'text-red-800' :
                    alert.severity === 'medium' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    {alert.message}
                  </p>
                  <p className={`text-xs mt-1 ${
                    alert.severity === 'high' ? 'text-red-600' :
                    alert.severity === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {alert.type === 'low_stock' ? 'Stock Alert' :
                     alert.type === 'expiry' ? 'Expiry Alert' :
                     'Request Alert'}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No alerts at this time</p>
              <p className="text-gray-400 text-sm">System alerts will appear here</p>
            </div>
          )}
        </div>
      </div>
    );
  },

  HospitalAlerts: ({ organizationId, refreshKey }: TableProps) => {
    const [alerts, setAlerts] = useState<Alert[]>([]);

    useEffect(() => {
     const loadAlerts = async () => {
       const alertData = await supabaseDataManager.getHospitalAlerts(organizationId!);
       setAlerts(alertData);
     };
     loadAlerts();
    }, [organizationId, refreshKey]);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          Alerts
        </h3>
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border-l-4 shadow-sm ${
                alert.severity === 'high' ? 'bg-red-50 border-red-400' :
                alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                'bg-blue-50 border-blue-400'
              }`}
            >
              <div className="flex items-start">
                <AlertTriangle className={`w-5 h-5 mr-3 mt-0.5 ${
                  alert.severity === 'high' ? 'text-red-500' :
                  alert.severity === 'medium' ? 'text-yellow-500' :
                  'text-blue-500'
                }`} />
                <div>
                  <p className={`text-sm font-medium ${
                    alert.severity === 'high' ? 'text-red-800' :
                    alert.severity === 'medium' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    {alert.message}
                  </p>
                  <p className={`text-xs mt-1 ${
                    alert.severity === 'high' ? 'text-red-600' :
                    alert.severity === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {alert.type === 'low_stock' ? 'Critical Stock Alert' :
                     alert.type === 'expiry' ? 'Expiry Alert' :
                     'Request Alert'}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No alerts at this time</p>
              <p className="text-gray-400 text-sm">System alerts will appear here</p>
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default Tables;