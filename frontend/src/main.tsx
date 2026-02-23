import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import App from "./App";

function Page({ name, color }: { name: string; color: string }) {
  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ color, fontSize: "1.5rem", fontWeight: "bold" }}>{name}</h1>
      <p style={{ color: "#9ca3af", marginTop: "8px" }}>Coming soon...</p>
    </div>
  );
}

function Login() {
  return (
    <div style={{ minHeight: "100vh", background: "#030712", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#111827", padding: "32px", borderRadius: "12px", width: "320px" }}>
        <h1 style={{ color: "#4ade80", fontSize: "1.5rem", fontWeight: "bold", marginBottom: "24px" }}>☀ SolarVIZ</h1>
        <input placeholder="Email" style={{ width: "100%", padding: "10px", marginBottom: "12px", background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "white", boxSizing: "border-box" }} />
        <input type="password" placeholder="Password" style={{ width: "100%", padding: "10px", marginBottom: "16px", background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "white", boxSizing: "border-box" }} />
        <button
          onClick={() => window.location.href = "/app"}
          style={{ width: "100%", padding: "10px", background: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
        >
          Login
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<App />}>
          <Route index element={<Page name="Dashboard" color="#4ade80" />} />
          <Route path="monitor" element={<Page name="Monitor" color="#60a5fa" />} />
          <Route path="analytics" element={<Page name="Analytics" color="#c084fc" />} />
          <Route path="finance" element={<Page name="Finance" color="#4ade80" />} />
          <Route path="system-status" element={<Page name="System Status" color="#fb923c" />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
