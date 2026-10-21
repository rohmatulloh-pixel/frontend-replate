import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Send } from 'lucide-react';
import { TRANSLATIONS, getActiveLanguage } from '../utils/i18n';
import Button from './Button';

export default function Footer({ onNavigate }) {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');
  const [lang, setLang] = useState(() => getActiveLanguage());

  useEffect(() => {
    const syncLanguage = (e) => setLang(e.detail || getActiveLanguage());
    window.addEventListener('replate:language-change', syncLanguage);
    return () => window.removeEventListener('replate:language-change', syncLanguage);
  }, []);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.id;

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="relative mt-20 text-white">
      {/* Curved Wave Top Divider */}
      <div className="w-full overflow-hidden leading-none -mb-1">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-12 sm:h-20 text-[#0a5c56] fill-current"
        >
          <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,20 1200,60 L1200,120 L0,120 Z"></path>
        </svg>
      </div>

      {/* Main Footer Container */}
      <div className="bg-[#0a5c56] pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-6">
            {/* Brand Column */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 px-2 py-1 rounded-2xl bg-white flex items-center justify-center shadow-md">
                  <img
                    src="/replate-logo.png"
                    alt="REPLATE"
                    className="h-7 w-auto object-contain"
                  />
                </div>
                <span className="text-2xl font-display font-black tracking-tight text-white">
                  REPLATE
                </span>
              </div>
              <p className="text-teal-100 text-xs sm:text-sm font-sans leading-relaxed max-w-sm">
                {lang === 'id'
                  ? 'Platform cerdas untuk mengalihkan surplus makanan menjadi makanan bergizi bagi yang membutuhkan, bukan menjadi sampah di TPA.'
                  : 'A smart platform directing surplus food into nourishing meals for communities in need rather than landfill waste.'}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-display text-teal-200">
                <Heart className="w-3.5 h-3.5 text-emerald-300" />
                <span>Food Should Move. Not Waste.</span>
              </div>
            </div>

            {/* Quick Links Column */}
            <div className="md:col-span-3 space-y-3">
              <span className="font-display font-bold text-xs uppercase tracking-wider text-teal-200 block">
                {lang === 'id' ? 'Navigasi Cepat' : 'Quick Navigation'}
              </span>
              <ul className="space-y-2 text-xs font-sans text-teal-100">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('home')}
                    className="hover:text-white transition-colors"
                  >
                    {t.nav.home}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('report')}
                    className="hover:text-white transition-colors"
                  >
                    {t.nav.report}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('journeys')}
                    className="hover:text-white transition-colors"
                  >
                    {t.nav.journeys}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('emergency')}
                    className="hover:text-white transition-colors"
                  >
                    {lang === 'id' ? 'Distribusi Darurat' : 'Emergency Requests'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('impact')}
                    className="hover:text-white transition-colors"
                  >
                    {t.nav.impact}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('insights')}
                    className="hover:text-white transition-colors"
                  >
                    {t.nav.insights}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('learn')}
                    className="hover:text-white transition-colors"
                  >
                    {t.nav.learn}
                  </button>
                </li>
              </ul>
            </div>

            {/* Newsletter Column */}
            <div className="md:col-span-4 space-y-3">
              <span className="font-display font-bold text-xs uppercase tracking-wider text-teal-200 block">
                {lang === 'id' ? 'Tetap Terhubung' : 'Stay Connected'}
              </span>
              <p className="text-xs text-teal-100 font-sans">
                {lang === 'id'
                  ? 'Dapatkan pembaruan dampak penyelamatan makanan dan wawasan rantai pasok.'
                  : 'Receive updates on regional food rescue impact and supply chain insights.'}
              </p>
              {subscribed ? (
                <div className="p-3 bg-white/15 rounded-2xl text-xs font-display text-white">
                  ✓ {lang === 'id' ? 'Terima kasih telah bergabung!' : 'Thank you for subscribing!'}
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder={lang === 'id' ? 'Email Anda...' : 'Your email...'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-teal-300 text-xs focus:outline-none focus:ring-2 focus:ring-sun-400"
                  />
                  <Button
                    type="submit"
                    variant="sun"
                    size="sm"
                    icon={Send}
                    className="text-xs shrink-0"
                  >
                    {lang === 'id' ? 'Kirim' : 'Send'}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 border-t border-teal-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-teal-300">
            <div className="flex items-center gap-1">
              <span>© 2026 REPLATE.</span>
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-coral-400 fill-current" />
              <span>for Zero Food Waste.</span>
            </div>
            <div className="text-[11px] text-teal-300/80">
              Food Waste & Supply Chain Platform
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
