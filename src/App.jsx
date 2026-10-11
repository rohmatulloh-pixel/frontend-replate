import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ReportSurplus from './pages/ReportSurplus';
import Assessment from './pages/Assessment';
import Journey from './pages/Journey';
import Impact from './pages/Impact';
import Insights from './pages/Insights';
import Learn from './pages/Learn';
import { saveReport } from './utils/storage';
import { getActiveLanguage } from './utils/i18n';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [pendingReport, setPendingReport] = useState(null);
  const [, setStorageVersion] = useState(0);
  const [lang, setLang] = useState(() => getActiveLanguage());

  // Sync state whenever storage or language changes
  useEffect(() => {
    const handleStorageUpdate = () => {
      setStorageVersion(v => v + 1);
    };
    const handleLanguageUpdate = (e) => {
      setLang(e.detail || getActiveLanguage());
    };

    window.addEventListener('replate:storage-update', handleStorageUpdate);
    window.addEventListener('replate:language-change', handleLanguageUpdate);
    return () => {
      window.removeEventListener('replate:storage-update', handleStorageUpdate);
      window.removeEventListener('replate:language-change', handleLanguageUpdate);
    };
  }, []);

  // Handle surplus submission from ReportSurplus
  const handleSurplusSubmitted = (reportPayload) => {
    setPendingReport(reportPayload);
    setActivePage('assessment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle destination selection from Assessment
  const handleDestinationSelected = (fullReportWithDestination) => {
    saveReport(fullReportWithDestination);
    setPendingReport(null);
    setActivePage('journeys');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle navigation
  const navigateTo = (pageId) => {
    setActivePage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F9FF] selection:bg-teal-200 selection:text-teal-950 text-slate-800 font-sans">
      {/* Main Floating Rounded Navbar with Language Switcher */}
      <Navbar activePage={activePage} onNavigate={navigateTo} />

      {/* Dynamic Page Content */}
      <main className="flex-1">
        {activePage === 'home' && (
          <Home onNavigate={navigateTo} lang={lang} />
        )}

        {activePage === 'report' && (
          <ReportSurplus
            onSubmitReport={handleSurplusSubmitted}
            lang={lang}
          />
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
          <Journey onNavigate={navigateTo} lang={lang} />
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
      </main>

      {/* Main Curved Wave Footer */}
      <Footer onNavigate={navigateTo} lang={lang} />
    </div>
  );
}
