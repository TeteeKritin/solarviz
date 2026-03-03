import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import "./index.css";

import App from "./App";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Monitor from "./pages/Monitor";
import Analytics from "./pages/Analytics";
import Finance from "./pages/Finance";
import Profile from "./pages/Profile";
import Report from "./pages/Report";
import SystemStatus from "./pages/SystemStatus";
import Configuration from "./pages/Configuration";
import Help from "./pages/Help";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("access_token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/app" element={<ProtectedRoute><App /></ProtectedRoute>}>
        <Route index              element={<Dashboard />} />
        <Route path="monitor"     element={<Monitor />} />
        <Route path="analytics"   element={<Analytics />} />
        <Route path="finance"     element={<Finance />} />
        <Route path="profile"     element={<Profile />} />
        <Route path="report"      element={<Report />} />
        <Route path="system-status" element={<SystemStatus />} />
        <Route path="configuration" element={<Configuration />} />
        <Route path="help"        element={<Help />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
);
