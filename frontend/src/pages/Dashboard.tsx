import { useEffect, useState } from "react";
import { Sun, Zap, Battery, ArrowDownRight, ArrowUpRight, TrendingUp, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { api, LiveReading, DailySummary } from "../services/api";

const C = { solar:"#10b981", grid:"#3b82f6", usage:"#f97316" };

const fmt = (d: Date) => d.toISOString().split("T")[0];

export default function Dashboard() {
  const [live, setLive] = useState<LiveReading | null>(null);
  const [daily, setDaily] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLive = async () => { try { setLive(await api.get<LiveReading>("/energy/live")); } catch {} };

  useEffect(() => {
    const init = async () => {
      await fetchLive();
      const today = new Date(), ago = new Date(today);
      ago.setDate(today.getDate() - 7);
      try { setDaily(await api.get<DailySummary[]>(`/energy/daily?start=${fmt(ago)}&end=${fmt(today)}`)); } catch {}
      setLoading(false);
    };
    init();
    const iv = setInterval(fetchLive, 30000);
    return () => clearInterval(iv);
  }, []);

  const solarKW = ((live?.solar_power_w ?? 0) / 1000).toFixed(2);
  const loadKW = ((live?.load_power_w ?? 0) / 1000).toFixed(2);
  const today = daily[daily.length - 1];
  const totalSolar = daily.reduce((s, d) => s + d.solar_kwh, 0);
  const totalLoad = daily.reduce((s, d) => s + d.load_kwh, 0);
  const savings7d = daily.reduce((s, d) => s + d.estimated_savings_thb, 0);
  const selfUse = today ? Math.min(100, (today.self_consumed_kwh / Math.max(today.solar_kwh, 0.01)) * 100) : 0;

  const chartData = daily.map(d => ({ name: d.date.slice(5), solar: +d.solar_kwh.toFixed(1), load: +d.load_kwh.toFixed(1) }));
  const pieData = today ? [
    { name:"Self-Consumed", value: +today.self_consumed_kwh.toFixed(1), color:C.solar },
    { name:"Grid Export",   value: +today.grid_export_kwh.toFixed(1),   color:C.grid },
    { name:"Grid Import",   value: +today.grid_import_kwh.toFixed(1),   color:C.usage },
  ] : [];

  if (loading) return (
    <div style={{ padding:"24px 16px", display:"flex", flexDirection:"column", gap:12 }}>
      {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:72 }} />)}
    </div>
  );

  return (
    <div style={{ padding:"24px 16px 16px", display:"flex", flexDirection:"column", gap:14 }}>

      {/* Today's Savings hero */}
      <div className="fade-in" style={{ background:"linear-gradient(135deg,#10b981,#0d9488)", borderRadius:20, padding:"20px", boxShadow:"0 8px 32px rgba(16,185,129,.25)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-24, right:-24, width:100, height:100, background:"rgba(255,255,255,.08)", borderRadius:"50%" }} />
        <div style={{ position:"absolute", bottom:-32, left:-16, width:130, height:130, background:"rgba(255,255,255,.05)", borderRadius:"50%" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.8)", fontWeight:500, marginBottom:2 }}>Today's Savings</div>
              <div style={{ fontSize:38, fontWeight:800, color:"white", fontFamily:"'Syne',sans-serif", lineHeight:1 }}>฿{(today?.estimated_savings_thb ?? 0).toFixed(2)}</div>
            </div>
            <div style={{ width:52, height:52, background:"rgba(255,255,255,.2)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <DollarSign size={26} color="white" />
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:8 }}>
            <TrendingUp size={13} color="rgba(255,255,255,.8)" />
            <span style={{ fontSize:12, color:"rgba(255,255,255,.8)" }}>Based on today's self-consumption</span>
          </div>
        </div>
      </div>

      {/* Secondary row */}
      <div className="fade-in-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:11, color:"#94a3b8", fontWeight:500 }}>7-Day Savings</div>
          <div style={{ fontSize:22, fontWeight:700, color:"#0f172a", fontFamily:"'Syne',sans-serif" }}>฿{savings7d.toFixed(0)}</div>
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>Last 7 days</div>
        </div>
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:11, color:"#94a3b8", fontWeight:500 }}>Self-Use Rate</div>
          <div style={{ fontSize:22, fontWeight:700, color:"#0f172a", fontFamily:"'Syne',sans-serif" }}>{selfUse.toFixed(1)}%</div>
          <div className="progress-bar" style={{ marginTop:8 }}>
            <div className="progress-fill" style={{ width:`${selfUse}%`, background:"linear-gradient(90deg,#10b981,#0d9488)" }} />
          </div>
        </div>
      </div>

      {/* Live 3-col */}
      <div className="fade-in-3" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
        {[
          { icon:Sun,     label:"Solar",  val:solarKW, bg:"#d1fae5", color:"#10b981" },
          { icon:Zap,     label:"Usage",  val:loadKW,  bg:"#ffedd5", color:"#f97316" },
          { icon:Battery, label:"Grid",   val:((live?.grid_power_w??0)/1000).toFixed(2), bg:"#dbeafe", color:"#3b82f6" },
        ].map(({ icon:Icon, label, val, bg, color }) => (
          <div key={label} className="card" style={{ padding:"14px 10px", textAlign:"center" }}>
            <div className="icon-box" style={{ background:bg, margin:"0 auto 8px" }}><Icon size={17} color={color} /></div>
            <div style={{ fontSize:11, color:"#94a3b8" }}>{label}</div>
            <div style={{ fontSize:18, fontWeight:700, color:"#0f172a", fontFamily:"'Syne',sans-serif" }}>{val}</div>
            <div style={{ fontSize:10, color:"#94a3b8" }}>kW now</div>
          </div>
        ))}
      </div>

      {/* Grid import/export */}
      <div className="fade-in-4" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div className="card" style={{ padding:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{ width:28, height:28, background:"#ffedd5", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ArrowDownRight size={14} color="#f97316" />
            </div>
            <span style={{ fontSize:11, color:"#94a3b8" }}>Grid Import</span>
          </div>
          <div style={{ fontSize:22, fontWeight:700, color:"#0f172a", fontFamily:"'Syne',sans-serif" }}>{(today?.grid_import_kwh??0).toFixed(1)}</div>
          <div style={{ fontSize:11, color:"#94a3b8" }}>kWh today</div>
        </div>
        <div className="card" style={{ padding:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{ width:28, height:28, background:"#dbeafe", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ArrowUpRight size={14} color="#3b82f6" />
            </div>
            <span style={{ fontSize:11, color:"#94a3b8" }}>Grid Export</span>
          </div>
          <div style={{ fontSize:22, fontWeight:700, color:"#0f172a", fontFamily:"'Syne',sans-serif" }}>{(today?.grid_export_kwh??0).toFixed(1)}</div>
          <div style={{ fontSize:11, color:"#94a3b8" }}>kWh today</div>
        </div>
      </div>

      {/* 7-day line chart */}
      <div className="card fade-in">
        <div className="card-title">24-Hour Energy Flow</div>
        <div className="card-sub">Solar vs Usage (last 7 days)</div>
        {chartData.length === 0
          ? <div style={{ height:160, display:"flex", alignItems:"center", justifyContent:"center", color:"#94a3b8", fontSize:13 }}>No data yet — data appears after readings are recorded</div>
          : <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                <XAxis dataKey="name" tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:"white", border:"1px solid #e2e8f0", borderRadius:10, fontSize:12 }} />
                <Line type="monotone" dataKey="solar" stroke={C.solar} strokeWidth={2} dot={{ r:3, fill:C.solar }} name="Solar (kWh)" />
                <Line type="monotone" dataKey="load"  stroke={C.usage} strokeWidth={2} dot={{ r:3, fill:C.usage }} name="Usage (kWh)" />
              </LineChart>
            </ResponsiveContainer>
        }
        <div style={{ display:"flex", gap:16, marginTop:8 }}>
          {[["Solar",C.solar],["Usage",C.usage]].map(([l,c]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:c }} />
              <span style={{ fontSize:11, color:"#64748b" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Energy Distribution */}
      {pieData.length > 0 && (
        <div className="card fade-in">
          <div className="card-title">Energy Distribution</div>
          <div className="card-sub">Last 24 hours</div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={4} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
              {pieData.map(({ name, value, color }) => (
                <div key={name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }} />
                    <span style={{ fontSize:11, color:"#64748b" }}>{name}</span>
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{value} kWh</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System status */}
      <div className="fade-in" style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:16, padding:16, display:"flex", alignItems:"center", gap:12 }}>
        <div className="status-dot green" />
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:"#15803d" }}>System Online</div>
          <div style={{ fontSize:12, color:"#16a34a" }}>All systems operational</div>
        </div>
      </div>
    </div>
  );
}
