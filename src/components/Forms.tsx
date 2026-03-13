import React, { useState, useEffect } from 'react';
import { Plus, QrCode, Send, ScanLine, Users, FileText, Download, Camera, X } from 'lucide-react';
import QRCode from 'qrcode';
import { supabaseDataManager } from '../services/SupabaseDataManager';
import { Medicine, Organization } from '../types';
import { readQRFromFile } from '../utils/qrReader';

interface FormProps {
  organizationId: string;
  organizationName?: string;
  requestType?: 'manufacturer_request' | 'wholesaler_request';
  onSuccess?: (message: string) => void;
}

// QR Code Modal Component
const QRCodeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  qrData: string;
  trackingId: string;
  medicine: Medicine;
  quantity: number;
}> = ({ isOpen, onClose, qrData, trackingId, medicine, quantity }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && qrData) {
      generateQRCode();
    }
  }, [isOpen, qrData]);

  const generateQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `Tracking-${trackingId}.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Request Approved!</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm inline-block mb-4">
              <img src={qrCodeUrl} alt="Tracking QR Code" className="w-48 h-48" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Shipment Details</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Tracking ID:</span> {trackingId}</p>
              <p><span className="font-medium">Medicine:</span> {medicine.medicineName}</p>
              <p><span className="font-medium">Batch ID:</span> {medicine.batchId}</p>
              <p><span className="font-medium">Quantity:</span> {quantity}</p>
              <p><span className="font-medium">Composition:</span> {medicine.composition}</p>
              <p><span className="font-medium">Expiry Date:</span> {new Date(medicine.expiryDate).toLocaleDateString()}</p>
            </div>
          </div>
          
          <button
            onClick={downloadQR}
            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center font-medium"
          >
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </button>
        </div>
      </div>
    </div>
  );
};

const Forms = {
  AddMedicine: ({ organizationId, organizationName, onSuccess }: FormProps) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [showQR, setShowQR] = useState(false);
    const [currentBatch, setCurrentBatch] = useState<string>('');

    const generateQRCode = async (batchId: string) => {
      try {
        const qrData = supabaseDataManager.generateQRCode(batchId, organizationId);
        if (qrData) {
          const url = await QRCode.toDataURL(qrData, {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setQrCodeUrl(url);
          setCurrentBatch(batchId);
          setShowQR(true);
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    const downloadQR = () => {
      if (qrCodeUrl) {
        const link = document.createElement('a');
        link.download = `QR-${currentBatch}.png`;
        link.href = qrCodeUrl;
        link.click();
      }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      
      const medicine = {
        medicineName: formData.get('medicineName') as string,
        composition: formData.get('composition') as string,
        batchId: formData.get('batchId') as string,
        quantity: parseInt(formData.get('quantity') as string),
        price: parseFloat(formData.get('price') as string),
        expiryDate: formData.get('expiryDate') as string,
        status: 'In Stock',
        organizationId,
        organizationName: organizationName!
      };

      try {
        await supabaseDataManager.addMedicine(medicine);
        await generateQRCode(medicine.batchId);
        onSuccess?.('Medicine added successfully with QR code generated');
        (e.target as HTMLFormElement).reset();
      } catch (error: any) {
        onSuccess?.(error.message || 'Failed to add medicine');
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
            <Plus className="w-4 h-4 text-white" />
          </div>
          Add New Medicine
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine Name</label>
                <input
                  type="text"
                  name="medicineName"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter medicine name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Composition</label>
                <textarea
                  name="composition"
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                  placeholder="Enter medicine composition and active ingredients"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Batch ID</label>
                <input
                  type="text"
                  name="batchId"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter batch ID"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price per unit ($)</label>
                <input
                  type="number"
                  name="price"
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter price"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-6 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              Add Medicine & Generate QR
            </button>
          </form>

          {showQR && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <QrCode className="w-5 h-5 mr-2 text-blue-600" />
                Generated QR Code
              </h4>
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg shadow-sm inline-block mb-4">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                </div>
                <p className="text-sm text-gray-600 mb-4">Batch: {currentBatch}</p>
                <button
                  onClick={downloadQR}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center mx-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },

  TransferMedicine: ({ organizationId, onSuccess }: FormProps) => {
    const [batches, setBatches] = useState<Medicine[]>([]);
    const [hospitals, setHospitals] = useState<Organization[]>([]);

    useEffect(() => {
      const loadData = async () => {
        const batchData = await supabaseDataManager.getHospitalStock(organizationId);
        const hospitalData = await supabaseDataManager.getOrganizations('hospital');
        setBatches(batchData);
        setHospitals(hospitalData);
      };
      loadData();
    }, [organizationId]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      
      const batchId = formData.get('batchId') as string;
      const quantity = parseInt(formData.get('quantity') as string);
      const receiverOrgName = formData.get('receiverOrg') as string;

      const success = await supabaseDataManager.transferMedicine(batchId, quantity, receiverOrgName, organizationId);
      
      if (success) {
        onSuccess?.('Medicine transferred successfully');
        (e.target as HTMLFormElement).reset();
        const batchData = await supabaseDataManager.getHospitalStock(organizationId);
        setBatches(batchData);
      } else {
        onSuccess?.('Transfer failed: Insufficient stock or invalid batch');
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
            <Send className="w-4 h-4 text-white" />
          </div>
          Transfer Medicine
        </h3>
        <form onSubmit={handleSubmit} className="max-w-md space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Batch</label>
            <select
              name="batchId"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
            >
              <option value="">Select a batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.batchId}>
                  {batch.medicineName} - {batch.batchId} ({batch.quantity} available)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              name="quantity"
              required
              min="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              placeholder="Enter quantity to transfer"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Receiver (Hospital)</label>
            <select
              name="receiverOrg"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
            >
              <option value="">Select hospital</option>
              {hospitals.map((hospital) => (
                <option key={hospital.id} value={hospital.name}>
                  {hospital.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            Transfer Medicine
          </button>
        </form>
      </div>
    );
  },

  ScanVerify: ({ organizationId, onSuccess }: FormProps) => {
    const [qrData, setQrData] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setIsScanning(true);
        setScanError('');
        
        try {
          const qrCodeData = await readQRFromFile(file);
          setQrData(qrCodeData);
        } catch (error) {
          setScanError('Failed to read QR code from image. Please try another image.');
          console.error('QR reading error:', error);
        } finally {
          setIsScanning(false);
        }
      }
    };

    const handleVerify = () => {
      if (!qrData.trim()) return;
      
      supabaseDataManager.verifyBatch(qrData, organizationId).then(success => {
        if (success) {
          onSuccess?.('Batch verified and added to inventory');
          setQrData('');
        } else {
          onSuccess?.('Verification failed: Invalid QR code or batch already exists');
        }
      });
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
            <ScanLine className="w-4 h-4 text-white" />
          </div>
          Scan & Verify Medicine
        </h3>
        <div className="max-w-md space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">QR Code Data</label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium flex items-center justify-center disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Scanning QR Code...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Scan QR Code from Image
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or enter manually</span>
                </div>
              </div>
              {scanError && (
                <p className="text-red-600 text-sm mt-2">{scanError}</p>
              )}
            <div className="relative">
              <input
                type="text"
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                placeholder="Scan QR code or enter tracking data manually"
              />
            </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Format: TRACK-{'{trackingId}'}-{'{requestId}'}-{'{batchId}'}-{'{quantity}'}-{'{medicine}'}</p>
          </div>
          <button
            onClick={handleVerify}
            disabled={!qrData.trim()}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify & Add to Inventory
          </button>
        </div>
      </div>
    );
  },

  HospitalScanVerify: ({ organizationId, onSuccess }: FormProps) => {
    const [qrData, setQrData] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setIsScanning(true);
        setScanError('');
        
        try {
          const qrCodeData = await readQRFromFile(file);
          setQrData(qrCodeData);
        } catch (error) {
          setScanError('Failed to read QR code from image. Please try another image.');
          console.error('QR reading error:', error);
        } finally {
          setIsScanning(false);
        }
      }
    };

    const handleVerify = () => {
      if (!qrData.trim()) return;
      
      supabaseDataManager.verifyBatchHospital(qrData, organizationId).then(success => {
        if (success) {
          onSuccess?.('Batch verified and added to inventory');
          setQrData('');
        } else {
          onSuccess?.('Verification failed: Invalid tracking data, batch already exists, or shipment not found');
        }
      });
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
            <ScanLine className="w-4 h-4 text-white" />
          </div>
          Scan & Verify Medicine
        </h3>
        <div className="max-w-md space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">QR Code Data or Batch ID</label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium flex items-center justify-center disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Scanning QR Code...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Scan QR Code from Image
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or enter manually</span>
                </div>
              </div>
              {scanError && (
                <p className="text-red-600 text-sm mt-2">{scanError}</p>
              )}
            <div className="relative">
              <input
                type="text"
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                placeholder="Scan QR code or enter tracking data"
              />
            </div>
            </div>
          </div>
          <button
            onClick={handleVerify}
            disabled={!qrData.trim()}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify & Add to Inventory
          </button>
        </div>
      </div>
    );
  },

  DispenseMedicine: ({ organizationId, onSuccess }: FormProps) => {
    const [stock, setStock] = useState<Medicine[]>([]);

    useEffect(() => {
      const loadStock = async () => {
        const stockData = await supabaseDataManager.getHospitalStock(organizationId);
        setStock(stockData);
      };
      loadStock();
    }, [organizationId]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      
      const medicine = formData.get('medicine') as string;
      const batchId = formData.get('batchId') as string;
      const quantity = parseInt(formData.get('quantity') as string);
      const patientInfo = formData.get('patientInfo') as string;

      const success = await supabaseDataManager.dispenseMedicine(medicine, batchId, quantity, patientInfo, organizationId);
      
      if (success) {
        onSuccess?.('Medicine dispensed successfully');
        (e.target as HTMLFormElement).reset();
        const stockData = await supabaseDataManager.getHospitalStock(organizationId);
        setStock(stockData);
      } else {
        onSuccess?.('Dispensing failed: Insufficient stock');
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center mr-3">
            <Users className="w-4 h-4 text-white" />
          </div>
          Dispense Medicine
        </h3>
        <form onSubmit={handleSubmit} className="max-w-md space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine</label>
            <select
              name="medicine"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
            >
              <option value="">Select medicine</option>
              {Array.from(new Set(stock.map(s => s.medicineName))).map((medicine) => (
                <option key={medicine} value={medicine}>
                  {medicine}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Batch ID</label>
            <select
              name="batchId"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
            >
              <option value="">Select batch</option>
              {stock.map((item) => (
                <option key={item.id} value={item.batchId}>
                  {item.batchId} ({item.quantity} available)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              name="quantity"
              required
              min="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
              placeholder="Enter quantity to dispense"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Patient Information</label>
            <input
              type="text"
              name="patientInfo"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
              placeholder="Enter patient name or ID"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 px-6 rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            Dispense Medicine
          </button>
        </form>
      </div>
    );
  },

  RequestMedicine: ({ organizationId, organizationName, requestType, onSuccess }: FormProps) => {
    const [targetOrgs, setTargetOrgs] = useState<Organization[]>([]);
    const [selectedTargetOrgId, setSelectedTargetOrgId] = useState<string>('');
    const [availableMedicines, setAvailableMedicines] = useState<{medicineName: string, batchId: string, availableQuantity: number}[]>([]);
    const [selectedMedicine, setSelectedMedicine] = useState<string>('');
    const [selectedBatch, setSelectedBatch] = useState<string>('');
    const [maxQuantity, setMaxQuantity] = useState<number>(0);

    useEffect(() => {
      if (requestType === 'manufacturer_request') {
       supabaseDataManager.getOrganizations('manufacturer').then(setTargetOrgs);
      } else {
       supabaseDataManager.getOrganizations('wholesaler').then(setTargetOrgs);
      }
    }, [requestType]);

    useEffect(() => {
      if (selectedTargetOrgId) {
       supabaseDataManager.getAvailableMedicinesWithBatches(selectedTargetOrgId).then(setAvailableMedicines);
      } else {
        setAvailableMedicines([]);
      }
      setSelectedMedicine('');
      setSelectedBatch('');
      setMaxQuantity(0);
    }, [selectedTargetOrgId]);

    useEffect(() => {
      if (selectedBatch) {
        const medicine = availableMedicines.find(m => `${m.medicineName}-${m.batchId}` === selectedBatch);
        setMaxQuantity(medicine ? medicine.availableQuantity : 0);
      } else {
        setMaxQuantity(0);
      }
    }, [selectedBatch, availableMedicines]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      
      const medicineWithBatch = formData.get('medicine') as string;
      // const [medicine, batchInfo] = medicineWithBatch.split(' - Batch: ');
      const [medicine, batchInfo] = medicineWithBatch.split('-');
      const quantity = parseInt(formData.get('quantity') as string);
      const targetOrgId = formData.get('targetOrg') as string;
      
      const targetOrg = targetOrgs.find(org => org.id === targetOrgId);
      if (!targetOrg) return;

      await supabaseDataManager.addRequest(
        medicine,
        quantity,
        organizationName!,
        organizationId,
        targetOrg.name,
        targetOrg.id,
        requestType!
      );

      onSuccess?.('Request sent successfully');
      (e.target as HTMLFormElement).reset();
      setSelectedTargetOrgId('');
      setSelectedMedicine('');
      setSelectedBatch('');
      setAvailableMedicines([]);
      setMaxQuantity(0);
    };


    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
            <FileText className="w-4 h-4 text-white" />
          </div>
          {requestType === 'manufacturer_request' ? 'Request Medicine' : 'Restock Request'}
        </h3>
        <form onSubmit={handleSubmit} className="max-w-md space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Target {requestType === 'manufacturer_request' ? 'Manufacturer' : 'Wholesaler'}
            </label>
            <select
              name="targetOrg"
              required
              value={selectedTargetOrgId}
              onChange={(e) => {
                setSelectedTargetOrgId(e.target.value);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            >
              <option value="">Select target organization</option>
              {targetOrgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Available Medicines & Batches</label>
            <select
              name="medicine"
              required
              disabled={!selectedTargetOrgId}
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select medicine and batch</option>
              {availableMedicines.map((batch) => (
                <option key={`${batch.medicineName}-${batch.batchId}`} value={`${batch.medicineName}-${batch.batchId}`}>
                  {batch.medicineName} - Batch: {batch.batchId} (Available: {batch.availableQuantity} units)
                </option>
              ))}
            </select>
            {!selectedTargetOrgId && (
              <p className="text-xs text-gray-500 mt-1">Select a target organization first</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              name="quantity"
              required
              min="1"
              max={maxQuantity}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              placeholder={maxQuantity > 0 ? `Enter quantity (Max: ${maxQuantity})` : "Enter quantity needed"}
            />
            {maxQuantity > 0 && (
              <p className="text-xs text-gray-500 mt-1">Maximum available: {maxQuantity} units</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!selectedBatch || maxQuantity === 0}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 px-6 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Request
          </button>
        </form>
      </div>
    );
  }
};

export { QRCodeModal };
export default Forms;