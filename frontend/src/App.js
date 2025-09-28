import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import UWTracker from "./components/UWTracker";
import AdminPanel from "./components/AdminPanel";
import UWRanking from "./components/UWRanking";
import Analytics from "./components/Analytics";
import TradingBots from "./components/TradingBots";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { Button } from "./components/ui/button";
import { Settings, TrendingUp, Bot } from "lucide-react";

function App() {
  useEffect(() => {
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        {/* Header */}
        <header className="bg-gradient-to-r from-amber-500 to-blue-600 text-white shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center">
                <TrendingUp className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">UW Tracker</h1>
                <p className="text-xs sm:text-sm text-blue-100 hidden sm:block">Indonesian IPO Performance</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-4">
              <Link to="/" className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Dashboard
              </Link>
              <Link to="/ranking" className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Rankings
              </Link>
              <Link to="/analytics" className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Analytics
              </Link>
              <Link to="/bots" className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Trading Bots
              </Link>
            </nav>
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-blue-200 hover:bg-white/10"
                onClick={() => {
                  // Simple mobile menu toggle - could be enhanced with a proper mobile menu component
                  const mobileMenu = document.getElementById('mobile-menu');
                  if (mobileMenu) {
                    mobileMenu.classList.toggle('hidden');
                  }
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>
          {/* Mobile Menu */}
          <div id="mobile-menu" className="hidden md:hidden bg-blue-700/90 backdrop-blur-sm">
            <nav className="container mx-auto px-4 py-2 space-y-1">
              <Link to="/" className="block text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Dashboard
              </Link>
              <Link to="/ranking" className="block text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Rankings
              </Link>
              <Link to="/analytics" className="block text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Analytics
              </Link>
              <Link to="/bots" className="block text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Trading Bots
              </Link>
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<UWTracker />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/ranking" element={<UWRanking />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/bots" element={<TradingBots />} />
        </Routes>
        
        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
        
        {/* Floating Admin Button */}
        <Link to="/admin">
          <Button 
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 rounded-full w-12 h-12 sm:w-14 sm:h-14 shadow-lg bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 hover:scale-105 touch-manipulation"
            size="sm"
          >
            <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </Link>
      </BrowserRouter>
    </div>
  );
}

export default App;