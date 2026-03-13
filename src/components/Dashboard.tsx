import React, { useState, useEffect } from 'react';
import { 
  LogOut, Package, QrCode, Send, Eye, Truck, History, 
  Plus, ScanLine, AlertTriangle, FileText, Users, CheckCircle,
  Menu, X, Home, Activity, TrendingUp, Sparkles, Zap, Bell
} from 'lucide-react';
import { Organization } from '../types';
import Tables from './Tables';
import Forms from './Forms';
import TrendAnalysisComponent from './TrendAnalysis';

interface DashboardProps {
  organization: Organization;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ organization, onLogout }) => {
  const [activeTab, setActiveTab] = useState('');
  const [notification, setNotification] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 4000);
  };

  const refresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    if (organization.role === 'manufacturer') {
      setActiveTab('add-medicine');
    } else if (organization.role === 'wholesaler') {
      setActiveTab('scan-verify');
    } else {
      setActiveTab('hospital-scan-verify');
    }
  }, [organization.role]);

  const getTabsForRole = () => {
    if (organization.role === 'manufacturer') {
      return [
        { id: 'add-medicine', label: 'Add Medicine', icon: Plus, color: 'from-emerald-500 to-teal-600' },
        { id: 'current-stock', label: 'Current Stock', icon: Package, color: 'from-blue-500 to-indigo-600' },
        { id: 'view-requests', label: 'View Requests', icon: Eye, color: 'from-amber-500 to-orange-600' },
        { id: 'shipment-tracking', label: 'Shipment Tracking', icon: Truck, color: 'from-purple-500 to-violet-600' },
        { id: 'transaction-history', label: 'Transaction History', icon: History, color: 'from-slate-500 to-gray-600' },
        { id: 'view-trends', label: 'View Trends', icon: TrendingUp, color: 'from-rose-500 to-pink-600' }
      ];
    } else if (organization.role === 'wholesaler') {
      return [
        { id: 'scan-verify', label: 'Scan & Verify', icon: ScanLine, color: 'from-emerald-500 to-teal-600' },
        { id: 'request-medicine', label: 'Request Medicine', icon: FileText, color: 'from-indigo-500 to-purple-600' },
        { id: 'stock-overview', label: 'Stock Overview', icon: Package, color: 'from-blue-500 to-cyan-600' },
        { id: 'view-wholesaler-requests', label: 'View Requests', icon: Eye, color: 'from-amber-500 to-orange-600' },
        { id: 'my-requests', label: 'My Requests', icon: FileText, color: 'from-violet-500 to-purple-600' },
        { id: 'wholesaler-shipment-tracking', label: 'Shipment Tracking', icon: Truck, color: 'from-purple-500 to-violet-600' },
        { id: 'alerts', label: 'Alerts', icon: AlertTriangle, color: 'from-red-500 to-rose-600' },
        { id: 'wholesaler-transaction-history', label: 'Transaction History', icon: History, color: 'from-slate-500 to-gray-600' },
        { id: 'wholesaler-view-trends', label: 'View Trends', icon: TrendingUp, color: 'from-rose-500 to-pink-600' }
      ];
    } else {
      return [
        { id: 'hospital-scan-verify', label: 'Scan & Verify', icon: ScanLine, color: 'from-emerald-500 to-teal-600' },
        { id: 'dispense-medicine', label: 'Dispense Medicine', icon: Users, color: 'from-pink-500 to-rose-600' },
        { id: 'restock-request', label: 'Restock Request', icon: FileText, color: 'from-indigo-500 to-purple-600' },
        { id: 'hospital-stock-overview', label: 'Stock Overview', icon: Package, color: 'from-blue-500 to-cyan-600' },
        { id: 'hospital-my-requests', label: 'My Requests', icon: FileText, color: 'from-violet-500 to-purple-600' },
        { id: 'hospital-shipment-tracking', label: 'Shipment Tracking', icon: Truck, color: 'from-purple-500 to-violet-600' },
        { id: 'hospital-alerts', label: 'Alerts', icon: AlertTriangle, color: 'from-red-500 to-rose-600' },
        { id: 'hospital-transaction-log', label: 'Transaction Log', icon: History, color: 'from-slate-500 to-gray-600' },
        { id: 'hospital-view-trends', label: 'View Trends', icon: TrendingUp, color: 'from-rose-500 to-pink-600' }
      ];
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      // Manufacturer tabs
      case 'add-medicine':
        return (
          <Forms.AddMedicine 
            organizationId={organization.id}
            organizationName={organization.name}
            onSuccess={(message) => {
              showNotification(message);
              refresh();
            }}
          />
        );
      case 'current-stock':
        return <Tables.ManufacturerStock organizationId={organization.id} refreshKey={refreshKey} />;
      case 'view-requests':
        return (
          <Tables.Requests 
            targetOrgId={organization.id}
            type="manufacturer_request"
            refreshKey={refreshKey}
            onApprove={(message) => {
              showNotification(message);
              refresh();
            }}
          />
        );
      case 'shipment-tracking':
        return <Tables.Shipments organizationId={organization.id} refreshKey={refreshKey} />;
      case 'transaction-history':
        return <Tables.Transactions organizationId={organization.id} refreshKey={refreshKey} />;
      case 'view-trends':
        return <TrendAnalysisComponent organizationId={organization.id} refreshKey={refreshKey} />;

      // Wholesaler tabs
      case 'scan-verify':
        return (
          <Forms.ScanVerify
            organizationId={organization.id}
            onSuccess={(message) => {
              showNotification(message);
              refresh();
            }}
          />
        );
      case 'request-medicine':
        return (
          <Forms.RequestMedicine
            organizationId={organization.id}
            organizationName={organization.name}
            requestType="manufacturer_request"
            onSuccess={(message) => {
              showNotification(message);
              refresh();
            }}
          />
        );
      case 'stock-overview':
        return <Tables.WholesalerStock organizationId={organization.id} refreshKey={refreshKey} />;
      case 'view-wholesaler-requests':
        return (
          <Tables.Requests 
            targetOrgId={organization.id}
            type="wholesaler_request"
            refreshKey={refreshKey}
            onApprove={(message) => {
              showNotification(message);
              refresh();
            }}
          />
        );
      case 'my-requests':
        return <Tables.MyRequests requesterOrgId={organization.id} refreshKey={refreshKey} />;
      case 'wholesaler-shipment-tracking':
        return <Tables.Shipments organizationId={organization.id} refreshKey={refreshKey} />;
      case 'alerts':
        return <Tables.WholesalerAlerts organizationId={organization.id} refreshKey={refreshKey} />;
      case 'wholesaler-transaction-history':
        return <Tables.Transactions organizationId={organization.id} refreshKey={refreshKey} />;
      case 'wholesaler-view-trends':
        return <TrendAnalysisComponent organizationId={organization.id} refreshKey={refreshKey} />;

      // Hospital tabs
      case 'hospital-scan-verify':
        return (
          <Forms.HospitalScanVerify
            organizationId={organization.id}
            onSuccess={(message) => {
              showNotification(message);
              refresh();
            }}
          />
        );
      case 'dispense-medicine':
        return (
          <Forms.DispenseMedicine
            organizationId={organization.id}
            onSuccess={(message) => {
              showNotification(message);
              refresh();
            }}
          />
        );
      case 'restock-request':
        return (
          <Forms.RequestMedicine
            organizationId={organization.id}
            organizationName={organization.name}
            requestType="wholesaler_request"
            onSuccess={(message) => {
              showNotification(message);
              refresh();
            }}
          />
        );
      case 'hospital-stock-overview':
        return <Tables.HospitalStock organizationId={organization.id} refreshKey={refreshKey} />;
      case 'hospital-my-requests':
        return <Tables.MyRequests requesterOrgId={organization.id} refreshKey={refreshKey} />;
      case 'hospital-shipment-tracking':
        return <Tables.Shipments organizationId={organization.id} refreshKey={refreshKey} />;
      case 'hospital-alerts':
        return <Tables.HospitalAlerts organizationId={organization.id} refreshKey={refreshKey} />;
      case 'hospital-transaction-log':
        return <Tables.Transactions organizationId={organization.id} refreshKey={refreshKey} />;
      case 'hospital-view-trends':
        return <TrendAnalysisComponent organizationId={organization.id} refreshKey={refreshKey} />;

      default:
        return (
          <div className={`${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-indigo-200'} rounded-3xl shadow-xl border p-12 text-center`}>
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl animate-bounce-subtle">
              <Home className="w-12 h-12 text-white" />
            </div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'} mb-3`}>Welcome to MedChain</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-indigo-600'} text-lg`}>Select a feature from the sidebar to get started</p>
          </div>
        );
    }
  };

  const tabs = getTabsForRole();
  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} flex flex-col`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-20 w-72 h-72 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-200/30'} rounded-full blur-3xl animate-bounce-subtle`}></div>
        <div className={`absolute bottom-20 right-20 w-96 h-96 ${isDark ? 'bg-purple-500/10' : 'bg-purple-200/30'} rounded-full blur-3xl animate-bounce-subtle`} style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isDark ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-slate-600' : 'bg-gradient-to-b from-white to-gray-50 border-indigo-200'} border-r`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-slate-600' : 'border-indigo-200'}`}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-3 shadow-lg animate-glow">
                <span className="text-white text-xl font-bold">M</span>
              </div>
              <div className="ml-3">
                <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>MedChain</h1>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-indigo-600'} capitalize`}>{organization.role}</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`lg:hidden p-2 rounded-xl ${isDark ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-indigo-100 text-indigo-500'} transition-all duration-200`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Organization Info */}
          <div className={`p-4 ${isDark ? 'bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-slate-600' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'} border-b`}>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-xl flex items-center justify-center shadow-md">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div className="ml-3">
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{organization.name}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-indigo-600'}`}>ID: {organization.id.slice(0, 8)}...</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-4 text-left rounded-2xl transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-xl transform scale-105`
                      : `${isDark ? 'text-gray-400 hover:bg-slate-700 hover:text-white' : 'text-slate-600 hover:bg-indigo-50 hover:text-slate-800'}`
                  } group`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 transition-all duration-300 ${
                    isActive ? 'bg-white/20' : `${isDark ? 'bg-slate-600 group-hover:bg-slate-500' : 'bg-indigo-100 group-hover:bg-indigo-200'}`
                  }`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : `${isDark ? 'text-gray-400 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-800'}`}`} />
                  </div>
                  <span className="font-semibold text-sm">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className={`p-4 border-t ${isDark ? 'border-slate-600' : 'border-indigo-200'}`}>
            <button
              onClick={onLogout}
              className={`w-full flex items-center px-4 py-4 ${isDark ? 'text-gray-400 hover:bg-red-900/20 hover:text-red-400' : 'text-slate-600 hover:bg-red-50 hover:text-red-600'} rounded-2xl transition-all duration-300 group`}
            >
              <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-slate-600 group-hover:bg-red-900/30' : 'bg-indigo-100 group-hover:bg-red-100'} flex items-center justify-center mr-3 transition-all duration-300`}>
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 flex-1 flex flex-col min-h-screen ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Top Header */}
        <header className={`${isDark ? 'bg-slate-800/90 border-slate-600' : 'bg-white/90 border-indigo-200'} backdrop-blur-xl shadow-xl border-b sticky top-0 z-40 transition-all duration-300`}>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`p-3 rounded-2xl ${isDark ? 'hover:bg-slate-700 text-gray-400 hover:text-white' : 'hover:bg-indigo-100 text-slate-600 hover:text-slate-800'} transition-all duration-300 mr-4 shadow-sm hover:shadow-md`}
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center">
                    {activeTabData && (
                      <div className={`w-8 h-8 bg-gradient-to-r ${activeTabData.color} rounded-xl flex items-center justify-center mr-3 shadow-md`}>
                        <activeTabData.icon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div>
                      <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {activeTabData?.label || 'Dashboard'}
                  </h2>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-indigo-600'}`}>
                    {organization.name} • {organization.role}
                  </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`hidden md:flex items-center space-x-3 ${isDark ? 'bg-gradient-to-r from-emerald-900/20 to-teal-800/20' : 'bg-gradient-to-r from-emerald-50 to-teal-100'} px-4 py-3 rounded-2xl shadow-sm`}>
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-sm"></div>
                  <span className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>System Online</span>
                </div>
                <button className={`p-3 rounded-2xl ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white' : 'bg-indigo-100 hover:bg-indigo-200 text-slate-600 hover:text-slate-800'} transition-all duration-300 shadow-sm hover:shadow-md relative`}>
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 flex-1 pb-20 relative z-10">
          <div className="max-w-7xl mx-auto">
            {renderTabContent()}
          </div>
        </main>

        {/* Footer */}
        <footer className={`${isDark ? 'bg-slate-950 border-slate-700' : 'bg-gradient-to-r from-indigo-900 to-purple-900 border-indigo-800'} text-white py-8 w-full mt-auto border-t`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3 shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-gray-400">
                  © 2025 MedChain - Developed by <span className="font-semibold text-white">Hactivate</span>
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 ${
          notification.includes('successfully') || notification.includes('approved') || notification.includes('verified') || notification.includes('Registration successful')
            ? isDark ? 'bg-emerald-800 border-emerald-600 text-white' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : isDark ? 'bg-red-800 border-red-600 text-white' : 'bg-red-50 border-red-200 text-red-800'
        } px-6 py-4 rounded-2xl shadow-2xl z-50 max-w-sm animate-slide-down border`}>
          <div className="flex items-start">
            <div className={`w-8 h-8 ${
              notification.includes('successfully') || notification.includes('approved') || notification.includes('verified') || notification.includes('Registration successful')
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                : 'bg-gradient-to-br from-red-500 to-red-600'
            } rounded-xl flex items-center justify-center mr-3 mt-0.5 shadow-md`}>
              {notification.includes('successfully') || notification.includes('approved') || notification.includes('verified') || notification.includes('Registration successful') ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : (
                <X className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <p className="font-semibold text-sm">{notification}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;