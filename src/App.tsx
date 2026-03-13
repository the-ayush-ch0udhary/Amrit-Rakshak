import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { supabaseDataManager } from './services/SupabaseDataManager';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { Organization } from './types';

function App() {

  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    // Listen for auth state changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkUser();
      } else {
        setCurrentOrganization(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {

      // Safely check session first
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        return;
      }

      const session = sessionData?.session;

      // If no user session, stop loading
      if (!session) {
        setLoading(false);
        return;
      }

      const user = session.user;

      if (user) {
        const org = await supabaseDataManager.getOrganizationByUserId(user.id);

        if (org) {
          setCurrentOrganization(org);
        }
      }

    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (organization: Organization) => {
    setCurrentOrganization(organization);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentOrganization(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentOrganization) {
    return (
      <Dashboard
        organization={currentOrganization}
        onLogout={handleLogout}
      />
    );
  }

  return <Auth onLogin={handleLogin} />;
}

export default App;
