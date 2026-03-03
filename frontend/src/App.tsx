import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation, Link } from "react-router";
import { LayoutDashboard, Activity, TrendingUp, DollarSign, User, Menu, X, FileText, Settings, HelpCircle, Wifi, WifiOff } from "lucide-react";
import { useOfflineStatus } from "./hooks/index";

const NAV = [
  { to:"/app", icon:LayoutDashboard, label:"Dashboard", end:true },
  { to:"/app/monitor", icon:Activity, label:"Monitor" },
  { to:"/app/analytics", icon:TrendingUp, label:"Analytics" },
  { to:"/app/finance", icon:DollarSign, label:"Finance" },
  { to:"/app/profile", icon:User, label:"Profile" },
];

const HEADERS: Record<string, { title:string; sub:string; bg:string }> = {
  "/app":               { title:"Dashboard",     sub:"Energy overview",           bg:"linear-gradient(135deg,#10b981,#0d9488)" },
  "/app/monitor":       { title:"Monitor",        sub:"Real-time & historical data", bg:"linear-gradient(135deg,#3b82f6,#2563eb)" },
  "/app/analytics":     { title:"Analytics",      sub:"Forecasts & predictions",   bg:"linear-gradient(135deg,#8b5cf6,#7c3aed)" },
  "/app/finance":       { title:"Finance",        sub:"Investment analysis",       bg:"linear-gradient(135deg,#10b981,#0d9488)" },
  "/app/profile":       { title:"Profile",        sub:"Account information",       bg:"linear-gradient(135deg,#10b981,#0d9488)" },
  "/app/report":        { title:"Report",         sub:"Generate energy reports",   bg:"linear-gradient(135deg,#8b5cf6,#7c3aed)" },
  "/app/system-status": { title:"System Status",  sub:"Real-time system health",   bg:"linear-gradient(135deg,#3b82f6,#2563eb)" },
  "/app/configuration": { title:"Configuration",  sub:"System settings",           bg:"linear-gradient(135deg,#3b82f6,#2563eb)" },
  "/app/help":          { title:"Help",           sub:"Support & guidance",        bg:"linear-gradient(135deg,#14b8a6,#06b6d4)" },
};

const SUB_PAGES = ["/app/report","/app/system-status","/app/configuration","/app/help"];

export default function App() {
  const nav = useNavigate();
  const loc = useLocation();
  const isOffline = useOfflineStatus();
  const [menuOpen, setMenuOpen] = useState(false);
  const info = HEADERS[loc.pathname] ?? HEADERS["/app"];
  const isSub = SUB_PAGES.includes(loc.pathname);

  useEffect(() => { setMenuOpen(false); }, [loc.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const h = () => setMenuOpen(false);
    setTimeout(() => document.addEventListener("click", h), 10);
    return () => document.removeEventListener("click", h);
  }, [menuOpen]);

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="page-header" style={{ background: info.bg }}>
        {isSub && (
          <button onClick={() => nav(-1)} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,.2)", border:"none", color:"white", borderRadius:10, padding:"5px 12px", marginBottom:12, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>
            ← Back
          </button>
        )}
        <div className="ph-inner">
          <div>
            <div className="ph-title">{info.title}</div>
            <div className="ph-sub">{info.sub}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, position:"relative" }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,.15)", borderRadius:8, padding:"5px 10px" }}>
              {isOffline ? <WifiOff size={13} color="white" /> : <Wifi size={13} color="white" />}
              <span style={{ fontSize:11, color:"rgba(255,255,255,.9)", fontWeight:500 }}>{isOffline ? "Offline" : "Online"}</span>
            </div>
            <button onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }} style={{ width:38, height:38, background:"rgba(255,255,255,.2)", border:"none", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              {menuOpen ? <X size={20} color="white" /> : <Menu size={20} color="white" />}
            </button>
            {menuOpen && (
              <div className="hamburger-menu" onClick={e => e.stopPropagation()}>
                {[
                  { to:"/app/report",        icon:FileText,    label:"Report" },
                  { to:"/app/system-status", icon:Activity,    label:"System Status" },
                  { to:"/app/configuration", icon:Settings,    label:"Configuration" },
                  { to:"/app/help",          icon:HelpCircle,  label:"Help" },
                ].map(({ to, icon:Icon, label }) => (
                  <Link key={to} to={to} className="hamburger-item"><Icon size={17} color="#475569" />{label}</Link>
                ))}
                <button onClick={() => { localStorage.clear(); nav("/login"); }} className="hamburger-item" style={{ color:"#ef4444" }}>
                  <X size={17} color="#ef4444" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-content" style={{ marginTop:-16 }}>
        <Outlet />
      </div>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {NAV.map(({ to, icon:Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
            <div className="nav-icon"><Icon size={20} /></div>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
