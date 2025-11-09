import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginRegister from "./Pages/LoginRegister";
import Dashboard from "./Pages/Dashboard.js"; // Create this component for the next page

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginRegister />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<LoginRegister />} /> {/* Default route */}
      </Routes>
    </Router>
  );
}

export default App;
