import React, { useState } from "react";
import axios from "../helpers/helper_axios";
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
    <div
      style={{ maxWidth: "340px", margin: "50px auto", textAlign: "center" }}
    >
      <h2>{isLogin ? "Login" : "Register"}</h2>
      <form onSubmit={isLogin ? handleLogin : handleRegister}>
        {!isLogin && (
          <input
            type="name"
            placeholder="Name"
            value={userDetails.name}
            onChange={(e) => updateUserDetails("name", e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          />
        )}
        {!isLogin && (
          <input
            type="email"
            placeholder="Email"
            value={userDetails.email}
            onChange={(e) => updateUserDetails("email", e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          />
        )}
        <input
          type="text"
          placeholder="Username"
          value={userDetails.username}
          onChange={(e) => updateUserDetails("username", e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={userDetails.password}
          onChange={(e) => updateUserDetails("password", e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <button type="submit" style={{ width: "100%", padding: "8px" }}>
          {isLogin ? "Login" : "Register"}
        </button>
      </form>
      <div style={{ marginTop: 18 }}>
        {isLogin ? (
          <span>
            Don't have an account?
            <button style={{ marginLeft: 8 }} onClick={() => setIsLogin(false)}>
              Register
            </button>
          </span>
        ) : (
          <span>
            Already have an account?
            <button style={{ marginLeft: 8 }} onClick={() => setIsLogin(true)}>
              Login
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

export default LoginRegister;
