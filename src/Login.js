import React, { useState } from "react";
import axios from "axios";
const token = localStorage.getItem("jwtToken");
axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    let response = await axios({
      method: "post",
      url: `${process.env.REACT_APP_BE_URL}/auth/login`,
      data: {
        user: {
          username,
          password,
        },
      },
    });
    console.log("response login", response.data.access_token);
    localStorage.setItem("jwtToken", response.data.access_token);
    setEmail("");
    setPassword("");
    setUsername("");
    setIsLogin(true);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    let response = await axios({
      method: "post",
      url: `${process.env.REACT_APP_BE_URL}/auth/register`,
      data: {
        user: {
          username,
          email,
          password,
        },
      },
    });
    console.log("response register", response.data.access_token);
    localStorage.setItem("jwtToken", response.data.access_token);
    setEmail("");
    setPassword("");
    setUsername("");
    setIsLogin(true);
  };

  return (
    <div
      style={{ maxWidth: "340px", margin: "50px auto", textAlign: "center" }}
    >
      <h2>{isLogin ? "Login" : "Register"}</h2>
      <form onSubmit={isLogin ? handleLogin : handleRegister}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        {!isLogin && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          />
        )}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
