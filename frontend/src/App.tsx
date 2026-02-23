import { Outlet, NavLink, useNavigate } from "react-router";
import { LayoutDashboard, Activity, BarChart3, DollarSign, AlertCircle } from "lucide-react";

const navItems = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/app/monitor", icon: Activity, label: "Monitor" },
  { to: "/app/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/app/finance", icon: DollarSign, label: "Finance" },
  { to: "/app/system-status", icon: AlertCircle, label: "System" },
];

export default function App() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "white", display: "flex", flexDirection: "column" }}>
      <header style={{ background: "#111827", borderBottom: "1px solid #1f2937", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#4ade80", fontWeight: "bold", fontSize: "1.1rem" }}>☀ SolarVIZ</span>
        <button
          onClick={() => { localStorage.clear(); navigate("/login"); }}
          style={{ color: "#9ca3af", fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer" }}
        >
          Logout
        </button>
      </header>

      <main style={{ flex: 1, overflowY: "auto", paddingBottom: "80px" }}>
        <Outlet />
      </main>

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#111827", borderTop: "1px solid #1f2937", display: "flex" }}>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              padding: "8px 0", fontSize: "0.7rem", gap: "4px", textDecoration: "none",
              color: isActive ? "#4ade80" : "#6b7280",
            })}
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
