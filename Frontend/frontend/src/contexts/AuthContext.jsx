import { createContext, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import httpStatus from "http-status";

// 1. Create the Context
export const AuthContext = createContext({});

// 2. Configure Axios instance (Note capital URL: baseURL)
const client = axios.create({
  baseURL: "http://localhost:8000/api/v1/users",
});

export const AuthProvider = ({ children }) => {
  // Use useState to manage state inside the provider
  const [userData, setUserData] = useState(null);

  // React Router hook
  const router = useNavigate();

  // Registration handler
  const handleRegister = async (name, username, password) => {
    try {
      const request = await client.post("/register", {
        name: name,
        username: username,
        password: password,
      });

      if (request.status === httpStatus.CREATED) {
        return request.data.message;
      }
    } catch (err) {
      throw err;
    }
  };

  //login handler
  const handleLogin = async (username, password) => {
    try {
      const request = await client.post("/login", {
        username: username,
        password: password,
      });

      if (request.status === httpStatus.OK) {
        localStorage.setItem("token", request.data.token);
        return request.data.message || "Logged in successfully!";
      }
    } catch (err) {
      throw err;
    }
  };

  // Value provided to all child components
  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
