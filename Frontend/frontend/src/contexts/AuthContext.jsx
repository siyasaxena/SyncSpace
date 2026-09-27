import { createContext, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import httpStatus from "http-status";

// 1. Create Context
export const AuthContext = createContext({});

// 2. Custom hook for easy context consumption in other components
export const useAuth = () => useContext(AuthContext);

// 3. Configure Axios client
const client = axios.create({
  baseURL: "http://localhost:8000/api/v1/users",
});

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const router = useNavigate();

  // Registration handler
  const handleRegister = async (name, username, password) => {
    try {
      const request = await client.post("/register", {
        name,
        username,
        password,
      });

      if (request.status === httpStatus.CREATED) {
        return request.data.message;
      }
    } catch (err) {
      throw err;
    }
  };

  // Login handler
  const handleLogin = async (username, password) => {
    try {
      const request = await client.post("/login", {
        username,
        password,
      });

      if (request.status === httpStatus.OK) {
        localStorage.setItem("token", request.data.token);
        setUserData(request.data.user || { username });
        router("/home"); // Redirect to home page after login
        return request.data.message || "Logged in successfully!";
      }
    } catch (err) {
      throw err;
    }
  };

  // Fetch meeting history
  const getHistoryOfUser = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Frontend stored token:", token);

      // Ensure client baseURL matches http://localhost:8000
      const response = await client.get("/get_all_activity", {
        params: { token: token },
      });

      console.log("Backend response received:", response.data);
      return response.data;
    } catch (err) {
      console.error("AuthContext getHistoryOfUser error:", err.response || err);
      throw err;
    }
  };

  // Add meeting code to history
  const addToUserHistory = async (meetingCode) => {
    try {
      const token = localStorage.getItem("token");
      const request = await client.post("/add_to_activity", {
        token,
        meeting_code: meetingCode,
      });
      return request;
    } catch (err) {
      throw err;
    }
  };

  const data = {
    userData,
    setUserData,
    addToUserHistory,
    getHistoryOfUser,
    handleRegister,
    handleLogin,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
