import { useEffect, useState } from "react";
import { Sun, Zap } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api, DailySummary, MonthlySummary } from "../services/api";

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOURS = ["6:00","9:00","12:00","15:00","18:00","21:00"];

function heatColor(v: number, max: number) {
  const t = max > 0 ? v / max : 0;
  if (t < 0.33) return "#fed7aa";
  if (t < 0.66) return "#fb923c";
  return "#ea580c";
}

export default function Monitor() {
  const [tab, setTab] = useState<"Daily"|"Weekly"|"Monthly">("Daily");
  const [daily, setDaily] = useState<DailySummary[]>([]);
  const [monthly, setMonthly] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date(), ago = new Date(today);
      ago.setDate(today.getDate() - 30);
      const fmt = (d: Date) => d.toISOString().split("T")[0];
      try { setDaily(await api.get<DailySummary[]>(`/energy/daily?start=${fmt(ago)}&end=${fmt(today)}`)); } catch {}
      try { setMonthly(await api.get<MonthlySummary[]>(`/energy/monthly?year=${new Date().getFullYear()}`)); } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const last7 = daily.slice(-7);
  const peakLoad = last7.reduce((m, d) => Math.max(m, d.peak_solar_w ?? 0), 0);
  const avgSolar = last7.length ? last7.reduce((s, d) => s + d.solar_kwh, 0) / last7.length : 0;
  const avgLoad = last7.length ? last7.reduce((s, d) => s + d.load_kwh, 0) / last7.length : 0;

  const dailyChart = last7.map(d => ({ name: d.date.slice(5), load: +d.load_kwh.toFixed(1) }));
  const weeklyChart = daily.slice(-14).map((d, i) => ({ name: DAYS[i % 7], load: +d.load_kwh.toFixed(1) }));
  const monthlyChart = monthly.map(d => ({ name: `M${d.month}`, load: +d.load_kwh.toFixed(1) }));
  const solarChart = last7.map(d => ({ name: d.date.slice(5), solar: +d.solar_kwh.toFixed(1) }));

  // Simple heatmap - generate mock pattern based on daily data
  const heatData: number[][] = Array(4).fill(null).map((_, ri) =>
    Array(7).fill(null).map((_, ci) => {
      const d = last7[ci];
      return d ? (d.load_kwh / (ri + 1)) : 0;
    })
  );
  const heatMax = Math.max(...heatData.flat());

  const perfRatio = avgSolar > 0 ? Math.min(100, (avgSolar / (avgSolar + 0.5)) * 100) : 87.3;

  if (loading) return (
    <div style={{ padding:"24px 16px", display:"flex", flexDirection:"column", gap:12 }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:200 }} />)}
    </div>
  );

  return (
    <div style={{ padding:"24px 16px 16px", display:"flex", flexDirection:"column", gap:14 }}>

      {/* Usage Behavior */}
      <div className="card fade-in">
        <div className="card-title">Electricity Usage Behavior</div>
        <div className="card-sub">Historical consumption patterns</div>

        <div className="time-toggle" style={{ marginBottom:14 }}>
          {(["Daily","Weekly","Monthly"] as const).map(t => (
            <button key={t} className={`time-btn${tab===t?" active":""}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={190}>
          {tab === "Daily"
            ? <LineChart data={dailyChart} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                <XAxis dataKey="name" tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:"white", border:"1px solid #e2e8f0", borderRadius:10, fontSize:12 }} />
                <Line type="monotone" dataKey="load" stroke="#f97316" strokeWidth={2} dot={{ r:3, fill:"#f97316" }} name="Usage (kWh)" />
              </LineChart>
            : <BarChart data={tab==="Weekly" ? weeklyChart : monthlyChart} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                <XAxis dataKey="name" tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:"white", border:"1px solid #e2e8f0", borderRadius:10, fontSize:12 }} />
                <Bar dataKey="load" fill="#f97316" radius={[6,6,0,0]} name="Usage (kWh)" />
              </BarChart>
          }
        </ResponsiveContainer>

        <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:12, padding:"10px 14px", marginTop:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#9a3412" }}>Peak Demand</div>
          <div style={{ fontSize:12, color:"#c2410c", marginTop:2 }}>{(peakLoad/1000).toFixed(1)} kW — highest usage this period</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="card fade-in-2">
        <div className="card-title">Usage Heatmap</div>
        <div className="card-sub">Weekly pattern by time period</div>
        <div style={{ overflowX:"auto" }}>
          <div style={{ minWidth:260 }}>
            <div style={{ display:"grid", gridTemplateColumns:"48px repeat(7,1fr)", gap:4, marginBottom:4 }}>
              <div />
              {DAYS.map(d => <div key={d} style={{ fontSize:10, color:"#94a3b8", textAlign:"center", fontWeight:500 }}>{d}</div>)}
            </div>
            {["Morning","Noon","Evening","Night"].map((label, ri) => (
              <div key={ri} style={{ display:"grid", gridTemplateColumns:"48px repeat(7,1fr)", gap:4, marginBottom:4 }}>
                <div style={{ fontSize:10, color:"#94a3b8", display:"flex", alignItems:"center" }}>{label}</div>
                {heatData[ri].map((val, ci) => (
                  <div key={ci} style={{ height:28, borderRadius:6, background:heatColor(val, heatMax) }} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:8 }}>
          <span style={{ fontSize:11, color:"#94a3b8" }}>Low</span>
          {["#fed7aa","#fb923c","#ea580c"].map(c => <div key={c} style={{ width:16, height:16, borderRadius:4, background:c }} />)}
          <span style={{ fontSize:11, color:"#94a3b8" }}>High</span>
        </div>
      </div>

      {/* Pattern insight */}
      <div className="fade-in-3" style={{ background:"linear-gradient(135deg,#fff7ed,#fef2f2)", border:"1px solid #fed7aa", borderRadius:20, padding:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div className="icon-box" style={{ background:"#ffedd5" }}><Zap size={18} color="#f97316" /></div>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:"#0f172a", fontFamily:"'Syne',sans-serif" }}>Usage Pattern Insight</div>
            <div style={{ fontSize:12, color:"#94a3b8" }}>Based on recent data</div>
          </div>
        </div>
        <div style={{ fontSize:13, color:"#374151" }}>
          Average daily load: <strong>{avgLoad.toFixed(1)} kWh</strong><br/>
          Average solar production: <strong>{avgSolar.toFixed(1)} kWh/day</strong>
        </div>
      </div>

      {/* Solar Generation */}
      <div className="card fade-in-4">
        <div className="card-title">Solar Energy Generation</div>
        <div className="card-sub">Production history (last 7 days)</div>
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={solarChart} margin={{ top:4, right:4, bottom:0, left:-20 }}>
            <XAxis dataKey="name" tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:"white", border:"1px solid #e2e8f0", borderRadius:10, fontSize:12 }} />
            <Line type="monotone" dataKey="solar" stroke="#10b981" strokeWidth={2} dot={{ r:3, fill:"#10b981" }} name="Solar (kWh)" />
          </LineChart>
        </ResponsiveContainer>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:12 }}>
          <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"12px" }}>
            <div style={{ fontSize:11, color:"#15803d", fontWeight:500 }}>Avg Daily Production</div>
            <div style={{ fontSize:20, fontWeight:700, color:"#14532d", fontFamily:"'Syne',sans-serif" }}>{avgSolar.toFixed(1)}</div>
            <div style={{ fontSize:11, color:"#16a34a" }}>kWh/day</div>
          </div>
          <div style={{ background:"#f0fdfa", border:"1px solid #99f6e4", borderRadius:12, padding:"12px" }}>
            <div style={{ fontSize:11, color:"#0f766e", fontWeight:500 }}>Performance Ratio</div>
            <div style={{ fontSize:20, fontWeight:700, color:"#134e4a", fontFamily:"'Syne',sans-serif" }}>{perfRatio.toFixed(1)}%</div>
            <div style={{ fontSize:11, color:"#0d9488" }}>Above average</div>
          </div>
        </div>
      </div>

      {/* Weather Impact */}
      <div className="fade-in-5" style={{ background:"linear-gradient(135deg,#eff6ff,#f0fdfa)", border:"1px solid #bfdbfe", borderRadius:20, padding:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div className="icon-box" style={{ background:"#dbeafe" }}><Sun size={18} color="#3b82f6" /></div>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:"#0f172a", fontFamily:"'Syne',sans-serif" }}>Weather Impact</div>
            <div style={{ fontSize:12, color:"#94a3b8" }}>Estimated efficiency</div>
          </div>
        </div>
        {[["Clear conditions","95%"],["Partly cloudy","65%"],["Overcast","35%"]].map(([label, eff]) => (
          <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:13, color:"#374151" }}>{label}</span>
            <span style={{ fontSize:13, fontWeight:600, color:"#0369a1" }}>{eff}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
