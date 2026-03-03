import { useState } from "react";
import { Building2, Zap, Save, CheckCircle } from "lucide-react";

export default function Configuration() {
  const [saved, setSaved] = useState(false);
  const [authority, setAuthority] = useState("MEA (Metropolitan)");
  const [baseTariff, setBaseTariff] = useState("3.00");
  const [ftRate, setFtRate] = useState("0.25");
  const [touEnabled, setTouEnabled] = useState(false);
  const [peakRate, setPeakRate] = useState("4.50");
  const [offPeakRate, setOffPeakRate] = useState("2.50");

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

  return (
    <div style={{ padding:"24px 16px 16px", display:"flex", flexDirection:"column", gap:14 }}>

      {/* Success toast */}
      {saved && (
        <div className="fade-in" style={{ background:"#22c55e", borderRadius:16, padding:"12px 16px", display:"flex", alignItems:"center", gap:8, color:"white", boxShadow:"0 4px 20px rgba(34,197,94,.3)" }}>
          <CheckCircle size={18} /> Settings Saved! Configuration updated successfully.
        </div>
      )}

      {/* Electricity Authority */}
      <div className="card fade-in">
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <div className="icon-box" style={{ background:"#dbeafe" }}><Building2 size={18} color="#3b82f6" /></div>
          <div>
            <div className="card-title">Electricity Authority</div>
            <div style={{ fontSize:12, color:"#94a3b8" }}>Utility provider</div>
          </div>
        </div>
        <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>Provider</label>
        <select className="input-field no-icon blue" style={{ padding:"10px 14px", appearance:"none" }} value={authority} onChange={e => setAuthority(e.target.value)}>
          <option>MEA (Metropolitan)</option>
          <option>PEA (Provincial)</option>
        </select>
      </div>

      {/* Tariff rates */}
      <div className="card fade-in-2">
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <div className="icon-box" style={{ background:"#d1fae5" }}><Zap size={18} color="#10b981" /></div>
          <div>
            <div className="card-title">Tariff Rates</div>
            <div style={{ fontSize:12, color:"#94a3b8" }}>Standard electricity rates</div>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>Base Tariff (฿/kWh)</label>
          <input className="input-field no-icon" type="number" step={0.01} value={baseTariff} onChange={e => setBaseTariff(e.target.value)} style={{ padding:"10px 14px" }} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>FT Rate (฿/kWh)</label>
          <input className="input-field no-icon" type="number" step={0.01} value={ftRate} onChange={e => setFtRate(e.target.value)} style={{ padding:"10px 14px" }} />
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>Fuel adjustment charge</div>
        </div>
      </div>

      {/* TOU */}
      <div className="card fade-in-3">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: touEnabled ? 16 : 0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div className="icon-box" style={{ background:"#ede9fe" }}><Zap size={18} color="#8b5cf6" /></div>
            <div>
              <div className="card-title">Time-of-Use (TOU)</div>
              <div style={{ fontSize:12, color:"#94a3b8" }}>Peak & off-peak rates</div>
            </div>
          </div>
          <button className={`toggle${touEnabled ? " on" : ""}`} onClick={() => setTouEnabled(t => !t)} />
        </div>
        {touEnabled && (
          <>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>Peak Rate (฿/kWh)</label>
              <input className="input-field no-icon violet" type="number" step={0.01} value={peakRate} onChange={e => setPeakRate(e.target.value)} style={{ padding:"10px 14px" }} />
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>9 AM – 10 PM weekdays</div>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>Off-Peak Rate (฿/kWh)</label>
              <input className="input-field no-icon violet" type="number" step={0.01} value={offPeakRate} onChange={e => setOffPeakRate(e.target.value)} style={{ padding:"10px 14px" }} />
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>Nights & weekends</div>
            </div>
          </>
        )}
      </div>

      {/* Summary */}
      <div className="card fade-in-4">
        <div className="card-title" style={{ marginBottom:12 }}>Rate Summary</div>
        {[
          ["Authority",    authority],
          ["Base Tariff",  `฿${baseTariff}/kWh`],
          ["FT Rate",      `฿${ftRate}/kWh`],
          ["Total Rate",   `฿${(+baseTariff + +ftRate).toFixed(2)}/kWh`],
          ["TOU",          touEnabled ? `Peak ฿${peakRate} / Off-peak ฿${offPeakRate}` : "Disabled"],
        ].map(([l,v]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
            <span style={{ fontSize:13, color:"#64748b" }}>{l}</span>
            <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Save */}
      <button className="btn btn-blue fade-in-5" onClick={save}>
        <Save size={18} /> Save Settings
      </button>
    </div>
  );
}
