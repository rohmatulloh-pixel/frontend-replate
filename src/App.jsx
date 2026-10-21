import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import SupplierDashboard from './components/portals/SupplierDashboard';
import MitraDashboard from './components/portals/MitraDashboard';
import AdminDashboard from './components/portals/AdminDashboard';
import ReportSurplus from './pages/ReportSurplus';
import Assessment from './pages/Assessment';
import Journey from './pages/Journey';
import Impact from './pages/Impact';
import Insights from './pages/Insights';
import Learn from './pages/Learn';
import EmergencyDistribution from './pages/EmergencyDistribution';
import SOSHub from './pages/SOSHub';
import { saveReport, getCurrentUser, initSupabaseCloudSync, syncBackendSurplusToLocal } from './utils/storage';
import { getActiveLanguage } from './utils/i18n';

const VALID_PAGES = ['home', 'report', 'assessment', 'journeys', 'impact', 'insights', 'learn', 'emergency', 'sos'];

function getInitialPage() {
  if (typeof window !== 'undefined' && window.location.hash) {
    const hash = window.location.hash.replace('#', '').trim().toLowerCase();
    if (VALID_PAGES.includes(hash)) {
      return hash;
    }
  }
  return 'home';
}

export default function App() {
  const [activePage, setActivePage] = useState(getInitialPage);
  const [pendingReport, setPendingReport] = useState(null);
  const [, setStorageVersion] = useState(0);
  const [lang, setLang] = useState(() => getActiveLanguage());
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [selectedJourneyId, setSelectedJourneyId] = useState(null);

  // Sync state whenever storage, language, or auth changes
  useEffect(() => {
    const handleStorageUpdate = () => {
      setStorageVersion(v => v + 1);
      setCurrentUser(getCurrentUser());
    };
    const handleLanguageUpdate = (e) => {
      setLang(e.detail || getActiveLanguage());
    };
    const handleAuthUpdate = (e) => {
      setCurrentUser(e.detail !== undefined ? e.detail : getCurrentUser());
    };

    window.addEventListener('replate:storage-update', handleStorageUpdate);
    window.addEventListener('replate:language-change', handleLanguageUpdate);
    window.addEventListener('replate:auth-change', handleAuthUpdate);
    return () => {
      window.removeEventListener('replate:storage-update', handleStorageUpdate);
      window.removeEventListener('replate:language-change', handleLanguageUpdate);
      window.removeEventListener('replate:auth-change', handleAuthUpdate);
    };
  }, []);

  // Initialize Supabase Cloud Realtime Sync & Multi-Device Collaboration
  useEffect(() => {
    // Instant initial sync and realtime listener
    const cleanup = initSupabaseCloudSync();

    // Auto-refresh fallback every 15 seconds to ensure HP and Laptop stay in sync even across mobile network shifts
    const interval = setInterval(() => {
      initSupabaseCloudSync().catch(() => {});
    }, 15000);

    return () => {
      clearInterval(interval);
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  // Sync URL hash with activePage to support browser refresh & back/forward
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim().toLowerCase();
      if (VALID_PAGES.includes(hash)) {
        setActivePage(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle surplus submission from ReportSurplus
  const handleSurplusSubmitted = (reportPayload) => {
    setPendingReport(reportPayload);
    setActivePage('assessment');
    if (typeof window !== 'undefined') {
      window.location.hash = 'assessment';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle destination selection from Assessment
  const handleDestinationSelected = (fullReportWithDestination) => {
    const saved = saveReport(fullReportWithDestination);
    setPendingReport(null);
    if (saved?.id) {
      setSelectedJourneyId(saved.id);
    }
    setActivePage('journeys');
    if (typeof window !== 'undefined') {
      window.location.hash = 'journeys';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle navigation
  const navigateTo = (pageId, journeyId = null) => {
    const target = VALID_PAGES.includes(pageId) ? pageId : 'home';
    setActivePage(target);
    if (typeof window !== 'undefined') {
      window.location.hash = target;
    }
    if (journeyId) {
      setSelectedJourneyId(journeyId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F9FF] selection:bg-teal-200 selection:text-teal-950 text-slate-800 font-sans">
      {/* Main Floating Rounded Navbar with Language Switcher */}
      <Navbar activePage={activePage} onNavigate={navigateTo} />

      {/* Dynamic Page Content */}
      <main className="flex-1">
        {activePage === 'home' && (
          currentUser?.role === 'supplier' ? (
            <SupplierDashboard onNavigate={navigateTo} lang={lang} currentUser={currentUser} />
          ) : currentUser?.role === 'mitra' ? (
            <MitraDashboard onNavigate={navigateTo} lang={lang} currentUser={currentUser} />
          ) : currentUser?.role === 'admin' ? (
            <AdminDashboard onNavigate={navigateTo} lang={lang} currentUser={currentUser} />
          ) : (
            <Home onNavigate={navigateTo} lang={lang} />
          )
        )}

        {activePage === 'emergency' && (
          <EmergencyDistribution
            onNavigate={navigateTo}
            lang={lang}
            currentUser={currentUser}
          />
        )}

        {activePage === 'sos' && (
          <SOSHub
            onNavigate={navigateTo}
            lang={lang}
            currentUser={currentUser}
          />
        )}

        {activePage === 'report' && (
          currentUser?.role === 'mitra' ? (
            <EmergencyDistribution
              onNavigate={navigateTo}
              lang={lang}
              currentUser={currentUser}
            />
          ) : (
            <ReportSurplus
              onSubmitReport={handleSurplusSubmitted}
              lang={lang}
            />
          )
        )}

        {activePage === 'assessment' && (
          <Assessment
            pendingReport={pendingReport}
            onDestinationSelected={handleDestinationSelected}
            onNavigate={navigateTo}
            lang={lang}
          />
        )}

        {activePage === 'journeys' && (
          <Journey onNavigate={navigateTo} lang={lang} initialSelectedId={selectedJourneyId} />
        )}

        {activePage === 'impact' && (
          <Impact onNavigate={navigateTo} lang={lang} />
        )}

        {activePage === 'insights' && (
          <Insights onNavigate={navigateTo} lang={lang} />
        )}

        {activePage === 'learn' && (
          <Learn onNavigate={navigateTo} lang={lang} />
        )}

        {/* Sensible Fallback for Invalid Page Identifiers */}
        {!VALID_PAGES.includes(activePage) && (
          <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
            <div className="text-6xl">🧭</div>
            <h2 className="text-2xl font-display font-black text-brand-900">
              {lang === 'id' ? 'Halaman Tidak Ditemukan' : 'Page Not Found'}
            </h2>
            <p className="text-sm font-semibold text-slate-600">
              {lang === 'id'
                ? 'Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.'
                : 'The page you are looking for does not exist or has been moved.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className="px-6 py-2.5 rounded-full bg-brand-600 text-white font-display font-bold text-sm shadow-md hover:bg-brand-700 transition-colors"
              >
                {lang === 'id' ? 'Kembali ke Beranda' : 'Return to Home'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Main Curved Wave Footer */}
      <Footer onNavigate={navigateTo} lang={lang} />
    </div>
  );
}
