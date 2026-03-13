import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle, XCircle, Pill, Calendar, FileText, Sparkles, Shield } from 'lucide-react';
import { supabaseDataManager } from '../services/SupabaseDataManager';
import { Medicine } from '../types';
import { readQRFromFile } from '../utils/qrReader';

interface DrugVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DrugVerificationModal: React.FC<DrugVerificationModalProps> = ({ isOpen, onClose }) => {
  const [qrData, setQrData] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    medicine?: Medicine;
    error?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDark, setIsDark] = useState(false);

  React.useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
    } else {
      setIsDark(false);
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setUploadError('');
      
      try {
        const qrCodeData = await readQRFromFile(file);
        setQrData(qrCodeData);
        handleVerification(qrCodeData);
      } catch (error) {
        setUploadError('Failed to read QR code from image. Please try another image.');
        console.error('QR reading error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerification = (data?: string) => {
    const dataToVerify = data || qrData;
    if (!dataToVerify.trim()) return;
    
    setIsLoading(true);
    
    supabaseDataManager.verifyDrugByQR(dataToVerify).then(result => {
      setVerificationResult(result);
      setIsLoading(false);
    }).catch(error => {
      setVerificationResult({ isValid: false, error: 'Verification failed' });
      setIsLoading(false);
    });
  };

  const handleClose = () => {
    setQrData('');
    setVerificationResult(null);
    setIsLoading(false);
    setUploadError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className={`${isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-200'} rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border animate-scale-in`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-dark-600' : 'border-gray-200'}`}>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg animate-glow">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Drug Verification</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Verify medicine authenticity</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-xl transition-all duration-200 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Upload Section */}
          <div>
            <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
              Upload QR Code Image
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed ${isDark ? 'border-dark-600 hover:border-primary-500 hover:bg-primary-900/10' : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'} rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer group`}
            >
              <div className={`w-16 h-16 ${isDark ? 'bg-dark-700 group-hover:bg-primary-900/20' : 'bg-gray-100 group-hover:bg-primary-100'} rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300`}>
                <Upload className={`w-8 h-8 ${isDark ? 'text-gray-400 group-hover:text-primary-400' : 'text-gray-500 group-hover:text-primary-500'} transition-colors duration-300`} />
              </div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300 group-hover:text-primary-400' : 'text-gray-700 group-hover:text-primary-600'} transition-colors duration-300`}>Click to upload QR code image</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-2`}>Supports JPG, PNG formats</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {uploadError && (
              <div className="mt-4 p-3 bg-gradient-to-r from-danger-50 to-danger-100 dark:from-danger-900/20 dark:to-danger-800/20 border border-danger-200 dark:border-danger-800 rounded-xl">
                <p className="text-danger-700 dark:text-danger-400 text-sm font-medium">{uploadError}</p>
              </div>
            )}
          </div>

          {/* Manual Input */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isDark ? 'border-dark-600' : 'border-gray-300'}`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-4 ${isDark ? 'bg-dark-800 text-gray-400' : 'bg-white text-gray-500'} font-medium`}>Or enter manually</span>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
              QR Code Data
            </label>
            <input
              type="text"
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
              placeholder="Enter QR code data (e.g., MED-BATCH123-ORG001)"
              className={`w-full px-4 py-4 border ${isDark ? 'border-dark-600 bg-dark-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 shadow-sm hover:shadow-md`}
            />
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleVerification()}
            disabled={!qrData.trim() || isLoading}
            className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 px-6 rounded-2xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-105"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                Verifying Medicine...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-3" />
                Verify Medicine Authenticity
              </>
            )}
          </button>

          {/* Results */}
          {verificationResult && (
            <div className={`rounded-2xl p-6 border-l-4 shadow-lg ${
              verificationResult.isValid 
                ? `${isDark ? 'bg-accent-900/20 border-accent-400' : 'bg-accent-50 border-accent-400'}` 
                : `${isDark ? 'bg-danger-900/20 border-danger-400' : 'bg-danger-50 border-danger-400'}`
            }`}>
              <div className="flex items-start">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-md ${
                  verificationResult.isValid 
                    ? 'bg-gradient-to-br from-accent-500 to-accent-600' 
                    : 'bg-gradient-to-br from-danger-500 to-danger-600'
                }`}>
                  {verificationResult.isValid ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <XCircle className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={
                      verificationResult.isValid
                        ? `${isDark ? 'text-accent-400' : 'text-accent-800'}`
                        : `${isDark ? 'text-danger-400' : 'text-danger-800'}`
                    }
                  >
                    {verificationResult.isValid ? 'Legitimate Drug ✓' : 'Verification Failed ✗'}
                  </h3>
                  
                  {verificationResult.isValid && verificationResult.medicine ? (
                    <div className="space-y-4">
                      <div className={`${isDark ? 'bg-dark-700/50' : 'bg-white/70'} rounded-xl p-4 space-y-3`}>
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                            <Pill className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide`}>Medicine Name</span>
                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{verificationResult.medicine.medicineName}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center mr-3">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide`}>Composition</span>
                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{verificationResult.medicine.composition}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-warning-500 to-warning-600 rounded-lg flex items-center justify-center mr-3">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide`}>Expiry Date</span>
                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{new Date(verificationResult.medicine.expiryDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`${isDark ? 'bg-dark-700/50' : 'bg-white/70'} rounded-xl p-3 text-center`}>
                          <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide block mb-1`}>Batch ID</span>
                          <span className="font-mono font-bold text-primary-600 dark:text-primary-400">{verificationResult.medicine.batchId}</span>
                        </div>
                        <div className={`${isDark ? 'bg-dark-700/50' : 'bg-white/70'} rounded-xl p-3 text-center`}>
                          <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide block mb-1`}>Manufacturer</span>
                          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>{verificationResult.medicine.organizationName}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`${isDark ? 'bg-danger-900/30' : 'bg-danger-100'} rounded-xl p-4`}>
                      <p className={`${isDark ? 'text-danger-400' : 'text-danger-700'} font-medium`}>
                        {verificationResult.error || 'This drug could not be verified. It may be counterfeit.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrugVerificationModal;
