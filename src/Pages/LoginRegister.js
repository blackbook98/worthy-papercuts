import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginRegister() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  let userData = { email: "", password: "", username: "", name: "" };
  let [userDetails, setUserDetails] = useState(userData);

  const updateUserDetails = (field, value) => {
    setUserDetails((prevState) => ({ ...prevState, [field]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      let { email, username, password } = userDetails;
      let response = await axios({
        method: "post",
        url: `${process.env.REACT_APP_BE_URL}/auth/login`,
        data: {
          user: {
            email,
            username,
            password,
          },
        },
      });
      localStorage.setItem("jwtToken", response.data.access_token);
      localStorage.setItem("userId", response.data.user_id);
      setUserDetails(userData);
      navigate("/dashboard");
    } catch (error) {
      alert("Login failed. Please check your credentials.");
      setUserDetails(userData);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      let { email, username, password, name } = userDetails;
      let response = await axios({
        method: "post",
        url: `${process.env.REACT_APP_BE_URL}/auth/register`,
        data: {
          user: {
            username,
            email,
            password,
            name,
          },
        },
      });
      localStorage.setItem("jwtToken", response.data.access_token);
      setUserDetails(userData);
      setIsLogin(true); // Switch to login after successful registration
    } catch (error) {
      alert("Registration failed. Please check your credentials.");
      setUserDetails(userData);
    }
  };

  return (
    <div className="app">
      <div className="auth-container">
        <div className="card">
          <h2>{isLogin ? "Login" : "Create an Account"}</h2>

          <form onSubmit={isLogin ? handleLogin : handleRegister}>
            {!isLogin && (
              <input
                type="text"
                placeholder="Name"
                value={userDetails.name}
                onChange={(e) => updateUserDetails("name", e.target.value)}
                required
              />
            )}

            {!isLogin && (
              <input
                type="email"
                placeholder="Email"
                value={userDetails.email}
                onChange={(e) => updateUserDetails("email", e.target.value)}
                required
              />
            )}

            <input
              type="text"
              placeholder="Username"
              value={userDetails.username}
              onChange={(e) => updateUserDetails("username", e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={userDetails.password}
              onChange={(e) => updateUserDetails("password", e.target.value)}
              required
            />

            <button type="submit">{isLogin ? "Login" : "Submit"}</button>
          </form>

          <div className="auth-switch">
            <div className="info-text">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </div>
            <button className="secondary" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Register" : "Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginRegister;
