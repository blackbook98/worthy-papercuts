import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginRegister from "./Components/LoginRegister";
import Dashboard from "./Components/Dashboard";
import LogoutButton from "./Components/Logout";
import "./App.css";

function App() {
  return (
    <div className="app">
      <Router>
        <LogoutButton />
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
