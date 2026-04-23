import { useLocation, useNavigate } from "react-router-dom";

function LogoutButton() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === "/login") return null;

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <span onClick={handleLogout} className="logout-link">
      Logout
    </span>
  );
}

export default LogoutButton;
