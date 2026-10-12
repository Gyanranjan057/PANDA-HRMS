// src/Pvtrouting.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiRequest, getAuthToken } from "../utils/api";
import { logoutFromLocalStorage } from "../utils/authStorage";

const Pvtrouting = ({ children }) => {
  const [status, setStatus] = useState(() => getAuthToken() ? "checking" : "signed-out");

  useEffect(() => {
    let active = true;
    if (!getAuthToken()) return undefined;
    apiRequest("/auth/me")
      .then(({ user }) => {
        const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
        storage.setItem("user", JSON.stringify(user));
        if (active) setStatus("signed-in");
      })
      .catch(() => {
        logoutFromLocalStorage();
        if (active) setStatus("signed-out");
      });
    return () => { active = false; };
  }, []);

  if (status === "checking") return <div role="status" style={{ padding: 24 }}>Checking session...</div>;
  if (status === "signed-out") return <Navigate to="/login" replace />;
  return children;
};

export default Pvtrouting;