import { useState } from "react";
import { Calendar, CheckSquare, FileText, Download, Share2 } from "lucide-react";

export default function Report() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  const [start, setStart] = useState(firstOfMonth);
  const [end, setEnd] = useState(todayStr);
  const [sections, setSections] = useState({ monitor:true, analytics:true, finance:true });
  const [preview, setPreview] = useState(false);
  const toggle = (k: keyof typeof sections) => setSections(p => ({ ...p, [k]: !p[k] }));

  const PRESETS = [
    { label:"Last Month", fn: () => { const d = new Date(today); d.setMonth(d.getMonth()-1); const f = new Date(d.getFullYear(), d.getMonth(), 1); const l = new Date(d.getFullYear(), d.getMonth()+1, 0); setStart(f.toISOString().split("T")[0]); setEnd(l.toISOString().split("T")[0]); }},
    { label:"This Year",  fn: () => { setStart(`${today.getFullYear()}-01-01`); setEnd(todayStr); }},
  ];

  const SECTION_CARDS = [
    { key:"monitor",   label:"Monitor",   desc:"Usage & generation data",   emoji:"📊", bg:"#eff6ff", border:"#bfdbfe" },
    { key:"analytics", label:"Analytics", desc:"Forecasts & predictions",   emoji:"🔮", bg:"#f5f3ff", border:"#e9d5ff" },
    { key:"finance",   label:"Finance",   desc:"ROI & savings",             emoji:"💰", bg:"#f0fdf4", border:"#bbf7d0" },
  ];

  return (
    <div style={{ padding:"24px 16px 16px", display:"flex", flexDirection:"column", gap:14 }}>

      {/* Date Range */}
      <div className="card fade-in">
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <div className="icon-box" style={{ background:"#ede9fe" }}><Calendar size={18} color="#8b5cf6" /></div>
          <div>
            <div className="card-title">Date Range</div>
            <div style={{ fontSize:12, color:"#94a3b8" }}>Select period</div>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
          {[["Start",start,setStart],["End",end,setEnd]].map(([label, val, fn]) => (
            <div key={label as string}>
              <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>{label as string}</label>
              <input className="input-field no-icon violet" type="date" value={val as string} onChange={e => (fn as any)(e.target.value)} style={{ padding:"10px 12px", fontSize:13 }} />
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {PRESETS.map(p => (
            <button key={p.label} onClick={p.fn} style={{ background:"#f5f3ff", border:"1px solid #e9d5ff", borderRadius:9, padding:"7px 14px", cursor:"pointer", fontSize:12, fontWeight:500, color:"#7c3aed", fontFamily:"'DM Sans',sans-serif" }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Include sections */}
      <div className="card fade-in-2">
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <div className="icon-box" style={{ background:"#d1fae5" }}><CheckSquare size={18} color="#10b981" /></div>
          <div>
            <div className="card-title">Include Sections</div>
            <div style={{ fontSize:12, color:"#94a3b8" }}>Select content</div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {SECTION_CARDS.map(({ key, label, desc, emoji, bg, border }) => (
            <div key={key} onClick={() => toggle(key as any)} style={{ background:sections[key as keyof typeof sections] ? bg : "#f8fafc", border:`2px solid ${sections[key as keyof typeof sections] ? border : "#e2e8f0"}`, borderRadius:14, padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12, transition:"all .2s" }}>
              <input type="checkbox" checked={sections[key as keyof typeof sections]} readOnly style={{ accentColor:"#8b5cf6", width:18, height:18 }} />
              <div>
                <div style={{ fontSize:14, fontWeight:500, color:"#0f172a" }}>{emoji} {label}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="fade-in-3" style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <button className="btn btn-violet" onClick={() => setPreview(true)}>
          <FileText size={18} /> Generate Preview
        </button>
        {preview && (
          <>
            <button className="btn" style={{ background:"#059669", color:"white" }}>
              <Download size={18} /> Download PDF
            </button>
            <button className="btn btn-outline">
              <Share2 size={18} /> Share
            </button>
          </>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="card fade-in" style={{ border:"2px solid #e9d5ff" }}>
          <div className="card-title" style={{ marginBottom:14 }}>Report Preview</div>
          <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
            <div style={{ fontSize:11, color:"#94a3b8", fontWeight:500 }}>Period</div>
            <div style={{ fontSize:13, color:"#0f172a", fontWeight:500 }}>{start} to {end}</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {sections.monitor   && <div style={{ background:"#eff6ff", borderRadius:10, padding:"10px 14px", fontSize:13, fontWeight:500, color:"#1d4ed8" }}>📊 Monitor Section</div>}
            {sections.analytics && <div style={{ background:"#f5f3ff", borderRadius:10, padding:"10px 14px", fontSize:13, fontWeight:500, color:"#6d28d9" }}>🔮 Analytics Section</div>}
            {sections.finance   && <div style={{ background:"#f0fdf4", borderRadius:10, padding:"10px 14px", fontSize:13, fontWeight:500, color:"#065f46" }}>💰 Finance Section</div>}
          </div>
          <div style={{ fontSize:12, color:"#94a3b8", marginTop:12, textAlign:"center" }}>PDF generation requires backend integration</div>
        </div>
      )}
    </div>
  );
}
