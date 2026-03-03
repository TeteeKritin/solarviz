import { useEffect, useState } from "react";
import { TrendingUp, Clock, Wallet } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { api, ROIResult } from "../services/api";

const PLANS = ["Select (optional)","Install additional air conditioners","Purchase EV + charger","Add new appliances","Other"];
const fmt = (n: number) => n >= 1000 ? `฿${(n/1000).toFixed(0)}k` : `฿${n.toFixed(0)}`;

export default function Finance() {
  const [roi, setRoi] = useState<ROIResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({ investment:240000, maintenance:2000, priceGrowth:2.5, plan:"Select (optional)", planOther:"" });
  const setP = (k: string) => (e: any) => setParams(p => ({ ...p, [k]: e.target.type==="number" ? +e.target.value : e.target.value }));

  useEffect(() => {
    api.get<ROIResult>("/finance/roi").then(setRoi).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cashflows = roi?.cashflows ?? [];
  const chartData = cashflows.filter((_, i) => [0,1,2,4,6,9,14,19].includes(i)).map(c => ({
    name: `Y${c.year}`, value: +c.cumulative_thb.toFixed(0)
  }));

  const payback = roi?.payback_year ?? "—";
  const npv = roi?.npv_thb ?? 0;
  const annualSavings1 = cashflows[0]?.annual_benefit_thb ?? 0;
  const roiPct = roi ? ((roi.npv_thb / roi.installation_cost_thb) * 100) : 0;

  const yearCards = [[1,cashflows[0]],[4,cashflows[4]],[9,cashflows[9]],[19,cashflows[19]]].filter(([,c]) => !!c) as [number, typeof cashflows[0]][];

  if (loading) return (
    <div style={{ padding:"24px 16px", display:"flex", flexDirection:"column", gap:12 }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:140 }} />)}
    </div>
  );

  return (
    <div style={{ padding:"24px 16px 16px", display:"flex", flexDirection:"column", gap:14 }}>

      {/* Investment Parameters */}
      <div className="card fade-in">
        <div className="card-title">Investment Parameters</div>
        <div className="card-sub">Customize your analysis</div>

        {[
          ["investment","Initial Investment (฿)","number",1000],
          ["maintenance","Annual Maintenance (฿)","number",100],
          ["priceGrowth","Price Growth Rate (%/year)","number",0.1],
        ].map(([k,label,type,step]) => (
          <div key={k as string} style={{ marginBottom:12 }}>
            <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>{label as string}</label>
            <input className="input-field no-icon" type={type as string} step={step as number} value={(params as any)[k as string]} onChange={setP(k as string)}
              style={{ padding:"10px 14px" }} />
          </div>
        ))}

        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>Future Plan</label>
          <select className="input-field no-icon" style={{ padding:"10px 14px", appearance:"none" }} value={params.plan} onChange={setP("plan")}>
            {PLANS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        {params.plan === "Other" && (
          <div style={{ marginBottom:12 }}>
            <input className="input-field no-icon" placeholder="Describe your plan..." style={{ padding:"10px 14px" }} value={params.planOther} onChange={setP("planOther")} />
          </div>
        )}
      </div>

      {/* Key Metrics 3-col */}
      <div className="fade-in-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
        <div style={{ background:"linear-gradient(135deg,#10b981,#0d9488)", borderRadius:16, padding:"14px 12px", boxShadow:"0 6px 20px rgba(16,185,129,.2)" }}>
          <div style={{ width:32, height:32, background:"rgba(255,255,255,.2)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
            <TrendingUp size={17} color="white" />
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:"white", fontFamily:"'Syne',sans-serif", lineHeight:1 }}>{roiPct.toFixed(1)}%</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.8)", marginTop:3 }}>ROI</div>
        </div>
        <div className="card" style={{ padding:"14px 12px" }}>
          <div className="icon-box" style={{ background:"#dbeafe", width:32, height:32, borderRadius:9, marginBottom:10 }}><Clock size={16} color="#3b82f6" /></div>
          <div style={{ fontSize:22, fontWeight:800, color:"#0f172a", fontFamily:"'Syne',sans-serif", lineHeight:1 }}>{typeof payback === "number" ? payback.toFixed(1) : "—"}</div>
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:3 }}>Years</div>
        </div>
        <div className="card" style={{ padding:"14px 12px" }}>
          <div className="icon-box" style={{ background:"#fef3c7", width:32, height:32, borderRadius:9, marginBottom:10 }}><Wallet size={16} color="#d97706" /></div>
          <div style={{ fontSize:20, fontWeight:800, color:"#0f172a", fontFamily:"'Syne',sans-serif", lineHeight:1 }}>{fmt(annualSavings1)}</div>
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:3 }}>Annual</div>
        </div>
      </div>

      {/* Cashflow Chart */}
      <div className="card fade-in-3">
        <div className="card-title">Cash Flow Projection</div>
        <div className="card-sub">20-year linear forecast</div>
        {chartData.length === 0
          ? <div style={{ height:200, display:"flex", alignItems:"center", justifyContent:"center", color:"#94a3b8", fontSize:13 }}>Set up solar configuration to see projections</div>
          : <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top:4, right:4, bottom:0, left:-10 }}>
                  <XAxis dataKey="name" tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background:"white", border:"1px solid #e2e8f0", borderRadius:10, fontSize:12 }}
                    formatter={(v: any) => [`฿${Number(v).toLocaleString()}`, "Cumulative"]} />
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r:4, fill:"#10b981" }} name="Cumulative (฿)" />
                </LineChart>
              </ResponsiveContainer>

              <div style={{ background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)", border:"2px solid #86efac", borderRadius:14, padding:"14px 16px", marginTop:14 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#15803d", marginBottom:4 }}>💚 Break-even Point</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                  <span style={{ fontSize:36, fontWeight:800, color:"#14532d", fontFamily:"'Syne',sans-serif" }}>{typeof payback === "number" ? payback.toFixed(1) : "—"}</span>
                  <span style={{ fontSize:14, color:"#166534" }}>years</span>
                </div>
                <div style={{ fontSize:12, color:"#16a34a" }}>NPV: ฿{npv.toLocaleString()}</div>
              </div>
            </>
        }
      </div>

      {/* Estimated Annual Savings */}
      {yearCards.length > 0 && (
        <div className="card fade-in-4">
          <div className="card-title">Estimated Annual Savings</div>
          <div className="card-sub">With {params.priceGrowth}% price growth/year</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {yearCards.map(([yr, c]) => (
              <div key={yr} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:"11px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:14, color:"#374151", fontWeight:500 }}>Year {yr + 1}</span>
                <span style={{ fontSize:14, fontWeight:600, color:"#059669" }}>฿{c.annual_benefit_thb.toLocaleString(undefined, { maximumFractionDigits:0 })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 20-year total */}
      {roi && (
        <div className="fade-in-5" style={{ background:"linear-gradient(135deg,#10b981,#0d9488)", borderRadius:20, padding:20, boxShadow:"0 8px 28px rgba(16,185,129,.25)" }}>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.8)", marginBottom:6 }}>20-Year Total Benefit</div>
          <div style={{ fontSize:36, fontWeight:800, color:"white", fontFamily:"'Syne',sans-serif" }}>฿{roi.total_savings_thb.toLocaleString(undefined, { maximumFractionDigits:0 })}</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,.75)", marginTop:4 }}>{roi.total_generation_kwh.toLocaleString(undefined, { maximumFractionDigits:0 })} kWh total generation</div>
        </div>
      )}
    </div>
  );
}
