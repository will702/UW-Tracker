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
        {/* Enhanced Header */}
        <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl sticky top-0 z-50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                  <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold">UW Tracker</h1>
                  <p className="text-xs sm:text-sm text-blue-100 hidden sm:block">Indonesian IPO Performance</p>
                </div>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-1">
                <Link to="/" className="text-white hover:text-blue-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10">
                  Dashboard
                </Link>
                <Link to="/ranking" className="text-white hover:text-blue-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10">
                  Rankings
                </Link>
                <Link to="/analytics" className="text-white hover:text-blue-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10">
                  Analytics
                </Link>
                <Link to="/bots" className="text-white hover:text-blue-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10">
                  Trading Bots
                </Link>
              </nav>
              
              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-blue-200 hover:bg-white/10 rounded-lg"
                  onClick={() => {
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
            
            {/* Enhanced Mobile Menu */}
            <div id="mobile-menu" className="hidden md:hidden mt-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
              <nav className="px-4 py-3 space-y-2">
                <Link 
                  to="/" 
                  className="flex items-center space-x-3 text-white hover:text-blue-200 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10"
                  onClick={() => {
                    const mobileMenu = document.getElementById('mobile-menu');
                    if (mobileMenu) {
                      mobileMenu.classList.add('hidden');
                    }
                  }}
                >
                  <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-3 w-3" />
                  </div>
                  <span>Dashboard</span>
                </Link>
                <Link 
                  to="/ranking" 
                  className="flex items-center space-x-3 text-white hover:text-blue-200 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10"
                  onClick={() => {
                    const mobileMenu = document.getElementById('mobile-menu');
                    if (mobileMenu) {
                      mobileMenu.classList.add('hidden');
                    }
                  }}
                >
                  <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <span>Rankings</span>
                </Link>
                <Link 
                  to="/analytics" 
                  className="flex items-center space-x-3 text-white hover:text-blue-200 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10"
                  onClick={() => {
                    const mobileMenu = document.getElementById('mobile-menu');
                    if (mobileMenu) {
                      mobileMenu.classList.add('hidden');
                    }
                  }}
                >
                  <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span>Analytics</span>
                </Link>
                <Link 
                  to="/bots" 
                  className="flex items-center space-x-3 text-white hover:text-blue-200 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10"
                  onClick={() => {
                    const mobileMenu = document.getElementById('mobile-menu');
                    if (mobileMenu) {
                      mobileMenu.classList.add('hidden');
                    }
                  }}
                >
                  <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                    <Bot className="h-3 w-3" />
                  </div>
                  <span>Trading Bots</span>
                </Link>
              </nav>
            </div>
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
        
        {/* Enhanced Floating Admin Button */}
        <Link to="/admin">
          <Button 
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-110 touch-manipulation border-2 border-white/20 backdrop-blur-sm"
            size="sm"
          >
            <Settings className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </Button>
        </Link>
      </BrowserRouter>
    </div>
  );
}

export default App;