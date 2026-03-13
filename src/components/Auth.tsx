import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, RefreshCw, Pill, Shield, X, Sun, Moon, Sparkles, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { supabaseDataManager } from '../services/SupabaseDataManager';
import { Organization } from '../types';
import DrugVerificationModal from './DrugVerificationModal';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, isDark }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className={`${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} rounded-3xl shadow-2xl max-w-md w-full border animate-scale-in`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-slate-600' : 'border-gray-200'}`}>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
              <span className="text-white text-2xl">📧</span>
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Contact Us</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Get in touch with our team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg animate-bounce-subtle">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>Ready to Help!</h4>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>For any inquiries or support, please reach out to us:</p>
          <div className={`${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'} rounded-2xl p-6 border`}>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Email Address:</p>
            <a 
              href="mailto:choudharyayush811@gmail.com" 
              className="text-indigo-500 hover:text-indigo-600 font-semibold text-lg transition-colors duration-200 hover:underline"
            >
              choudharyayush811@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AuthProps {
  onLogin: (org: Organization) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [captcha, setCaptcha] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [notification, setNotification] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
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

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const result = Array.from({ length: 1 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    setCaptcha(result);
    setUserCaptcha('');
  };

  React.useEffect(() => {
    generateCaptcha();
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const captchaInput = formData.get('captcha') as string;

    if (captchaInput !== captcha) {
      showNotification('Invalid CAPTCHA');
      generateCaptcha();
      return;
    }

    handleSupabaseLogin(email, password);
  };

  const handleSupabaseLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showNotification('Invalid credentials');
        generateCaptcha();
        return;
      }

      if (data.user) {
        const org = await supabaseDataManager.getOrganizationByUserId(data.user.id);
        if (org) {
          onLogin(org);
        } else {
          showNotification('Organization not found');
        }
      }
    } catch (error) {
      showNotification('Login failed');
      generateCaptcha();
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const orgName = formData.get('orgName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const role = formData.get('role') as 'manufacturer' | 'wholesaler' | 'hospital';
    const captchaInput = formData.get('captcha') as string;

    if (captchaInput !== captcha) {
      showNotification('Invalid CAPTCHA');
      generateCaptcha();
      return;
    }

    if (password !== confirmPassword) {
      showNotification('Passwords do not match');
      return;
    }

    await handleSupabaseRegister(email, password, orgName, role);
  };

  const handleSupabaseRegister = async (email: string, password: string, orgName: string, role: 'manufacturer' | 'wholesaler' | 'hospital') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        showNotification('Registration failed: ' + error.message);
        return;
      }

      if (data.user) {
        await supabaseDataManager.createOrganization(orgName, role, data.user.id);
        showNotification('Registration successful! Please login.');
        setIsLogin(true);
        generateCaptcha();
      }
    } catch (error) {
      showNotification('Registration failed');
      generateCaptcha();
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-20 w-72 h-72 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-200/40'} rounded-full blur-3xl animate-bounce-subtle`}></div>
        <div className={`absolute bottom-20 right-20 w-96 h-96 ${isDark ? 'bg-purple-500/10' : 'bg-purple-200/40'} rounded-full blur-3xl animate-bounce-subtle`} style={{ animationDelay: '1s' }}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${isDark ? 'bg-pink-500/10' : 'bg-pink-200/40'} rounded-full blur-3xl animate-bounce-subtle`} style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className={`${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-indigo-200'} backdrop-blur-xl shadow-xl border-b sticky top-0 z-40 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg animate-glow">
                <Pill className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'} tracking-tight`}>MedChain</h1>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-indigo-600'}`}>Secure Medicine Tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-2xl transition-all duration-300 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'} shadow-lg hover:shadow-xl`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setShowVerificationModal(true)}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Shield className="w-5 h-5 mr-2" />
                Verify Drug
              </button>
              
              <button 
                onClick={() => setShowContactModal(true)}
                className={`flex items-center px-6 py-3 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-700'} rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105`}
              >
                <Zap className="w-5 h-5 mr-2" />
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center p-6 relative z-10" style={{ minHeight: 'calc(100vh - 140px)' }}>
        <div className="w-full max-w-4xl animate-slide-up">
          <div className={`${isDark ? 'bg-slate-800/90 border-slate-600' : 'bg-white/90 border-indigo-200'} rounded-3xl shadow-2xl border backdrop-blur-xl overflow-hidden`}>
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl animate-glow">
                  <span className="text-white text-3xl font-bold">M</span>
                </div>
                <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'} mb-3 tracking-tight`}>Welcome to MedChain</h1>
                <p className={`${isDark ? 'text-gray-400' : 'text-indigo-600'} text-lg`}>Secure Medicine Supply Chain Tracking</p>
              </div>

              <div className={`flex ${isDark ? 'bg-slate-700' : 'bg-gradient-to-r from-indigo-50 to-purple-50'} rounded-2xl p-1 mb-8 shadow-inner`}>
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isLogin
                      ? `${isDark ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'} shadow-lg transform scale-105`
                      : `${isDark ? 'text-gray-400 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'}`
                  }`}
                >
                  <LogIn className="w-4 h-4 inline mr-2" />
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    !isLogin
                      ? `${isDark ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'} shadow-lg transform scale-105`
                      : `${isDark ? 'text-gray-400 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'}`
                  }`}
                >
                  <UserPlus className="w-4 h-4 inline mr-2" />
                  Register
                </button>
              </div>

              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Horizontal Layout for Login */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-3`}>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        required
                        className={`w-full px-4 py-4 border ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-gray-400' : 'border-indigo-300 bg-white text-slate-900 placeholder-gray-500'} rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm hover:shadow-md`}
                        placeholder="Enter your email address"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-3`}>Password</label>
                      <input
                        type="password"
                        name="password"
                        required
                        className={`w-full px-4 py-4 border ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-gray-400' : 'border-indigo-300 bg-white text-slate-900 placeholder-gray-500'} rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm hover:shadow-md`}
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-3`}>Security Verification</label>
                    <div className="flex gap-3 mb-3">
                      <div className="flex-1 flex items-center gap-3">
                        <span className={`px-4 py-3 ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gradient-to-r from-indigo-100 to-purple-100 border-indigo-300'} border rounded-2xl text-lg font-mono tracking-wider font-bold ${isDark ? 'text-white' : 'text-slate-900'} shadow-inner`}>
                          {captcha}
                        </span>
                        <button
                          type="button"
                          onClick={generateCaptcha}
                          className={`p-3 ${isDark ? 'text-gray-400 hover:text-white hover:bg-slate-700' : 'text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100'} rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md`}
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      name="captcha"
                      value={userCaptcha}
                      onChange={(e) => setUserCaptcha(e.target.value)}
                      required
                      className={`w-full px-4 py-4 border ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-gray-400' : 'border-indigo-300 bg-white text-slate-900 placeholder-gray-500'} rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm hover:shadow-md`}
                      placeholder="Enter the verification code"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-4 px-6 rounded-2xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Sign In to MedChain
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-6">
                  {/* Horizontal Layout for Registration */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-3`}>Organization Type</label>
                      <select
                        name="role"
                        required
                        className={`w-full px-4 py-4 border ${isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-indigo-300 bg-white text-slate-900'} rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm hover:shadow-md`}
                      >
                        <option value="manufacturer">Pharmaceutical Manufacturer</option>
                        <option value="wholesaler">Medical Wholesaler</option>
                        <option value="hospital">Hospital/Healthcare Provider</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-3`}>Organization Name</label>
                      <input
                        type="text"
                        name="orgName"
                        required
                        className={`w-full px-4 py-4 border ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-gray-400' : 'border-indigo-300 bg-white text-slate-900 placeholder-gray-500'} rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm hover:shadow-md`}
                        placeholder="Enter your organization name"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-3`}>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        required
                        className={`w-full px-4 py-4 border ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-gray-400' : 'border-indigo-300 bg-white text-slate-900 placeholder-gray-500'} rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm hover:shadow-md`}
                        placeholder="Enter your email address"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-3`}>Password</label>
                      <input
                        type="password"
                        name="password"
                        required
                        className={`w-full px-4 py-4 border ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-gray-400' : 'border-indigo-300 bg-white text-slate-900 placeholder-gray-500'} rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm hover:shadow-md`}
                        placeholder="Create a secure password"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-3`}>Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      className={`w-full px-4 py-4 border ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-gray-400' : 'border-indigo-300 bg-white text-slate-900 placeholder-gray-500'} rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm hover:shadow-md`}
                      placeholder="Confirm your password"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-3`}>Security Verification</label>
                    <div className="flex gap-3 mb-3">
                      <div className="flex-1 flex items-center gap-3">
                        <span className={`px-4 py-3 ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gradient-to-r from-indigo-100 to-purple-100 border-indigo-300'} border rounded-2xl text-lg font-mono tracking-wider font-bold ${isDark ? 'text-white' : 'text-slate-900'} shadow-inner`}>
                          {captcha}
                        </span>
                        <button
                          type="button"
                          onClick={generateCaptcha}
                          className={`p-3 ${isDark ? 'text-gray-400 hover:text-white hover:bg-slate-700' : 'text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100'} rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md`}
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      name="captcha"
                      value={userCaptcha}
                      onChange={(e) => setUserCaptcha(e.target.value)}
                      required
                      className={`w-full px-4 py-4 border ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-gray-400' : 'border-indigo-300 bg-white text-slate-900 placeholder-gray-500'} rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm hover:shadow-md`}
                      placeholder="Enter the verification code"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-4 px-6 rounded-2xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Create MedChain Account
                  </button>
                </form>
              )}
            </div>
          </div>

          {notification && (
            <div className="mt-6 p-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl shadow-lg animate-slide-down">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <X className="w-4 h-4" />
                </div>
                <p className="font-medium">{notification}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gradient-to-r from-indigo-900 to-purple-900 border-indigo-800'} text-white py-8 border-t w-full`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm text-gray-300">
                © 2025 MedChain - Developed by <span className="font-semibold text-white">Hactivate</span>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Drug Verification Modal */}
      <DrugVerificationModal 
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />

      {/* Contact Modal */}
      <ContactModal 
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        isDark={isDark}
      />
    </div>
  );
};

export default Auth;
