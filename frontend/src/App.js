import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UWTracker from "./components/UWTracker";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UWTracker />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;