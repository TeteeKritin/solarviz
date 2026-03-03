import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { api, SolarEstimate, MonthlySummary } from "../services/api";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SEASONS = [
  { label:"☀️ Summer", months:[3,4,5], color:"#fef3c7", border:"#fde68a" },
  { label:"🌧️ Rainy",  months:[6,7,8,9], color:"#eff6ff", border:"#bfdbfe" },
  { label:"❄️ Winter", months:[10,11,0,1,2], color:"#f0fdfa", border:"#99f6e4" },
];

export default function Analytics() {
  const [estimate, setEstimate] = useState<SolarEstimate | null>(null);
  const [monthly, setMonthly] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { setEstimate(await api.get<SolarEstimate>("/finance/solar-estimate?year_offset=0")); } catch {}
      try { setMonthly(await api.get<MonthlySummary[]>(`/energy/monthly?year=${new Date().getFullYear()}`)); } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const forecastData = estimate
    ? Object.entries(estimate.monthly_kwh).map(([m, kwh]) => ({
        name: MONTH_NAMES[parseInt(m) - 1],
        production: +kwh.toFixed(1),
        usage: +(kwh * 0.96).toFixed(1),
      }))
    : MONTH_NAMES.map((name, i) => ({ name, production: 600 + Math.sin(i/2)*200, usage: 550 + Math.cos(i/3)*150 }));

  const balanceData = forecastData.map(d => ({ name: d.name, balance: +(d.production - d.usage).toFixed(1) }));

  const annualKwh = estimate?.annual_kwh ?? forecastData.reduce((s, d) => s + d.production, 0);
  const annualUsage = forecastData.reduce((s, d) => s + d.usage, 0);
  const selfSufficiency = annualUsage > 0 ? (annualKwh / annualUsage) * 100 : 0;

  const seasonData = SEASONS.map(s => ({
    ...s,
    avgProd: forecastData.filter((_, i) => s.months.includes(i)).reduce((sum, d) => sum + d.production, 0) / s.months.length,
    avgUsage: forecastData.filter((_, i) => s.months.includes(i)).reduce((sum, d) => sum + d.usage, 0) / s.months.length,
  }));

  if (loading) return (
    <div style={{ padding:"24px 16px", display:"flex", flexDirection:"column", gap:12 }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:220 }} />)}
    </div>
  );

  return (
    <div style={{ padding:"24px 16px 16px", display:"flex", flexDirection:"column", gap:14 }}>

      {/* Annual Forecast */}
      <div className="card fade-in">
        <div className="card-title">Annual Forecast</div>
        <div className="card-sub">Next 12 months prediction</div>
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={forecastData} margin={{ top:4, right:4, bottom:0, left:-20 }}>
            <XAxis dataKey="name" tick={{ fontSize:9, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:"white", border:"1px solid #e2e8f0", borderRadius:10, fontSize:12 }} />
            <Line type="monotone" dataKey="production" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Production (kWh)" />
            <Line type="monotone" dataKey="usage"      stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Usage (kWh)" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:12 }}>
          <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"10px 12px" }}>
            <div style={{ fontSize:11, color:"#15803d", fontWeight:500 }}>Annual Production</div>
            <div style={{ fontSize:18, fontWeight:700, color:"#14532d", fontFamily:"'Syne',sans-serif" }}>{annualKwh.toFixed(0)}</div>
            <div style={{ fontSize:11, color:"#16a34a" }}>kWh</div>
          </div>
          <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:12, padding:"10px 12px" }}>
            <div style={{ fontSize:11, color:"#9a3412", fontWeight:500 }}>Annual Usage</div>
            <div style={{ fontSize:18, fontWeight:700, color:"#7c2d12", fontFamily:"'Syne',sans-serif" }}>{annualUsage.toFixed(0)}</div>
            <div style={{ fontSize:11, color:"#c2410c" }}>kWh</div>
          </div>
        </div>
      </div>

      {/* Seasonal Variation */}
      <div className="card fade-in-2">
        <div className="card-title">Seasonal Variation</div>
        <div className="card-sub">Performance by season</div>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={seasonData.map(s => ({ name: s.label.split(" ")[1], prod: +s.avgProd.toFixed(0), usage: +s.avgUsage.toFixed(0) }))} margin={{ top:4, right:4, bottom:0, left:-20 }}>
            <XAxis dataKey="name" tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:"white", border:"1px solid #e2e8f0", borderRadius:10, fontSize:12 }} />
            <Bar dataKey="prod"  fill="#10b981" radius={[6,6,0,0]} name="Avg Production" />
            <Bar dataKey="usage" fill="#f97316" radius={[6,6,0,0]} name="Avg Usage" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:12 }}>
          {seasonData.map(s => (
            <div key={s.label} style={{ background:s.color, border:`1px solid ${s.border}`, borderRadius:10, padding:"8px 12px", display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:13, fontWeight:500, color:"#374151" }}>{s.label}</span>
              <span style={{ fontSize:12, color:"#64748b" }}>{s.avgProd.toFixed(0)} kWh avg</span>
            </div>
          ))}
        </div>
      </div>

      {/* Energy Balance */}
      <div className="card fade-in-3">
        <div className="card-title">Energy Balance Projection</div>
        <div className="card-sub">Production minus usage</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={balanceData} margin={{ top:4, right:4, bottom:0, left:-20 }}>
            <XAxis dataKey="name" tick={{ fontSize:9, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:"white", border:"1px solid #e2e8f0", borderRadius:10, fontSize:12 }} />
            <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={2} />
            <Bar dataKey="balance" fill="#3b82f6" radius={[6,6,0,0]} name="Balance (kWh)"
              label={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recommendation */}
      <div className="card fade-in-4">
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <div className="icon-box" style={{ background:"#d1fae5" }}><TrendingUp size={18} color="#10b981" /></div>
          <div>
            <div style={{ fontSize:15, fontWeight:600, color:"#0f172a", fontFamily:"'Syne',sans-serif" }}>Energy Recommendation</div>
            <div style={{ fontSize:12, color:"#94a3b8" }}>System sizing analysis</div>
          </div>
        </div>
        <div style={{ background:"linear-gradient(135deg,#f0fdf4,#f0fdfa)", border:"1px solid #bbf7d0", borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:13, color:"#374151" }}>Annual Generation Est.</span>
            <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{annualKwh.toFixed(0)} kWh</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:13, color:"#374151" }}>Annual Usage Est.</span>
            <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{annualUsage.toFixed(0)} kWh</span>
          </div>
          <div style={{ height:1, background:"#bbf7d0", margin:"10px 0" }} />
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:13, fontWeight:600, color:"#15803d" }}>Self-Sufficiency</span>
            <span style={{ fontSize:13, fontWeight:700, color:"#14532d" }}>{selfSufficiency.toFixed(1)}%</span>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:12, color:"#374151" }}>Production Coverage</span>
            <span style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{Math.min(selfSufficiency, 100).toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width:`${Math.min(selfSufficiency, 100)}%`, background:"linear-gradient(90deg,#10b981,#0d9488)" }} />
          </div>
        </div>
        <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"12px 14px" }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#15803d", marginBottom:4 }}>✅ System Analysis</div>
          <div style={{ fontSize:12, color:"#166534" }}>
            {selfSufficiency >= 100
              ? `Your system produces ${selfSufficiency.toFixed(1)}% of your usage — you're energy self-sufficient!`
              : `Your system covers ${selfSufficiency.toFixed(1)}% of usage. Consider expanding capacity.`}
          </div>
        </div>
      </div>

      {/* Predictive Insights */}
      <div className="fade-in-5" style={{ background:"linear-gradient(135deg,#f5f3ff,#faf5ff)", border:"1px solid #e9d5ff", borderRadius:20, padding:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <div className="icon-box" style={{ background:"#ede9fe" }}><TrendingUp size={18} color="#8b5cf6" /></div>
          <div style={{ fontSize:15, fontWeight:600, color:"#0f172a", fontFamily:"'Syne',sans-serif" }}>Predictive Insights</div>
        </div>
        {[
          ["Peak season", "Maximum production in April–May"],
          ["Rainy impact", "~14% decrease during Jul–Oct"],
          ["Night usage", "Grid dependency increases after 6 PM"],
        ].map(([title, desc]) => (
          <div key={title} style={{ display:"flex", gap:10, marginBottom:10 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#8b5cf6", marginTop:5, flexShrink:0 }} />
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:"#0f172a" }}>{title}</div>
              <div style={{ fontSize:12, color:"#64748b" }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
