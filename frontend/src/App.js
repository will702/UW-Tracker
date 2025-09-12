import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import UWTracker from "./components/UWTracker";
import AdminPanel from "./components/AdminPanel";
import UWRanking from "./components/UWRanking";
import { Button } from "./components/ui/button";
import { Settings } from "lucide-react";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UWTracker />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
        
        {/* Floating Admin Button */}
        <Link to="/admin">
          <Button 
            className="fixed bottom-6 right-6 rounded-full w-12 h-12 shadow-lg bg-indigo-600 hover:bg-indigo-700"
            size="sm"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </BrowserRouter>
    </div>
  );
}

export default App;