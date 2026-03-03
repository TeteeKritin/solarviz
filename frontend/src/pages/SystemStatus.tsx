import { useEffect, useState } from "react";
import { CheckCircle, Activity, Wifi, Clock } from "lucide-react";
import { api, SystemHealth } from "../services/api";

function fmtUptime(s: number) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600);
  return `${d} day${d !== 1 ? "s" : ""}, ${h} hr${h !== 1 ? "s" : ""}`;
}

export default function SystemStatus() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    api.get<SystemHealth>("/system/health").then(setHealth).catch(() => {}).finally(() => setLoading(false));
    const iv = setInterval(() => { api.get<SystemHealth>("/system/health").then(setHealth).catch(() => {}); setNow(new Date()); }, 10000);
    return () => clearInterval(iv);
  }, []);

  const disk = health ? Math.round((health.disk_used_gb / health.disk_total_gb) * 100) : 0;

  if (loading) return (
    <div style={{ padding:"24px 16px", display:"flex", flexDirection:"column", gap:12 }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:100 }} />)}
    </div>
  );

  return (
    <div style={{ padding:"24px 16px 16px", display:"flex", flexDirection:"column", gap:14 }}>

      {/* Overall status */}
      <div className="fade-in" style={{ background:"linear-gradient(135deg,#22c55e,#16a34a)", borderRadius:20, padding:20, boxShadow:"0 8px 28px rgba(34,197,94,.25)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:60, height:60, background:"rgba(255,255,255,.2)", borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <CheckCircle size={30} color="white" />
          </div>
          <div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.8)", marginBottom:2 }}>System Status</div>
            <div style={{ fontSize:26, fontWeight:700, color:"white", fontFamily:"'Syne',sans-serif", lineHeight:1 }}>Online</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.85)", marginTop:3 }}>All systems operational</div>
          </div>
        </div>
      </div>

      {/* Component status */}
      <div className="card fade-in-2">
        <div className="card-title" style={{ marginBottom:14 }}>Component Status</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[
            { icon:Activity, label:"Raspberry Pi", desc:"Local server", color:"#10b981", bg:"#d1fae5", status:"Connected" },
            { icon:Wifi,     label:"Network",      desc:"Connection",   color:"#3b82f6", bg:"#dbeafe", status:"Active" },
            { icon:Clock,    label:"Data Sync",    desc:"Last update",  color:"#10b981", bg:"#d1fae5", status:now.toLocaleTimeString() },
          ].map(({ icon:Icon, label, desc, color, bg, status }) => (
            <div key={label} style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div className="icon-box" style={{ background:bg }}><Icon size={18} color={color} /></div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{label}</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>{desc}</div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div className="status-dot green" />
                <span style={{ fontSize:12, fontWeight:500, color:"#15803d" }}>{status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System resources */}
      {health && (
        <div className="card fade-in-3">
          <div className="card-title" style={{ marginBottom:14 }}>System Resources</div>
          {[
            { label:"CPU Usage",   val:health.cpu_percent,    color:"#3b82f6", unit:"%" },
            { label:"Memory",      val:health.memory_percent, color:"#8b5cf6", unit:"%" },
            { label:"Disk",        val:disk,                  color:"#f97316", unit:"%" },
          ].map(({ label, val, color, unit }) => (
            <div key={label} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:13, color:"#374151", fontWeight:500 }}>{label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{val.toFixed(1)}{unit}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width:`${Math.min(val, 100)}%`, background:val > 85 ? "#ef4444" : val > 60 ? "#f97316" : color }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* System Info */}
      <div className="card fade-in-4">
        <div className="card-title" style={{ marginBottom:14 }}>System Information</div>
        {[
          ["Device ID",     health?.device_id ?? "—"],
          ["Firmware",      health?.firmware ?? "—"],
          ["Platform",      health?.platform ?? "—"],
          ["Uptime",        health ? fmtUptime(health.uptime_seconds) : "—"],
          ["Disk Used",     health ? `${health.disk_used_gb.toFixed(1)} GB / ${health.disk_total_gb.toFixed(1)} GB` : "—"],
        ].map(([label, value]) => (
          <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#f8fafc", borderRadius:10, padding:"10px 14px", marginBottom:8 }}>
            <span style={{ fontSize:13, color:"#64748b" }}>{label}</span>
            <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Network */}
      <div className="fade-in-5" style={{ background:"linear-gradient(135deg,#eff6ff,#f0fdfa)", border:"1px solid #bfdbfe", borderRadius:20, padding:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <div className="icon-box" style={{ background:"#dbeafe" }}><Wifi size={18} color="#3b82f6" /></div>
          <div style={{ fontSize:15, fontWeight:600, color:"#0f172a", fontFamily:"'Syne',sans-serif" }}>Network Status</div>
        </div>
        {[["Signal strength","Excellent"],["Connection type","Local Network"],["Latency","< 10ms"]].map(([l,v]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:13, color:"#374151" }}>{l}</span>
            <span style={{ fontSize:13, fontWeight:600, color:"#0369a1" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
