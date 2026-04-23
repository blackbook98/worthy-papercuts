import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginRegister from "./Pages/LoginRegister";
import Dashboard from "./Pages/Dashboard";
import "./App.css";

function App() {
  return (
    <div className="app">
      <Router>
        <Routes>
          <Route path="/login" element={<LoginRegister />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<LoginRegister />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
