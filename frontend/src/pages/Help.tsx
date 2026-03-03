import { useState } from "react";
import { HelpCircle, Book, Mail, ChevronRight } from "lucide-react";

const FAQS = [
  { q:"How do I read my energy dashboard?", a:"The dashboard shows real-time solar production, household usage, and grid interaction. The top card shows today's savings, followed by current kW readings for solar, usage, and grid. The charts below show 7-day trends." },
  { q:"What is self-consumption rate?", a:"Self-consumption rate is the percentage of solar energy you use directly in your home vs. exporting to the grid. A higher rate (70%+) means more savings since you're replacing expensive grid electricity with free solar power." },
  { q:"How is ROI calculated?", a:"ROI (Return on Investment) is calculated over 20 years, factoring in installation cost, annual savings from self-consumed solar, export revenue, electricity tariff escalation (default 2.5%/year), and panel degradation (default 0.5%/year)." },
  { q:"What does break-even mean?", a:"Break-even (payback period) is the number of years until your cumulative savings equal your initial investment. For example, a 7.7-year payback means your system pays for itself in under 8 years, then generates pure savings." },
];

const GUIDES = ["Getting Started", "Understanding Your Data", "Financial Calculations"];

export default function Help() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ padding:"24px 16px 16px", display:"flex", flexDirection:"column", gap:14 }}>

      {/* FAQs */}
      <div className="card fade-in">
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <div className="icon-box" style={{ background:"#ccfbf1" }}><HelpCircle size={18} color="#0d9488" /></div>
          <div>
            <div className="card-title">Frequently Asked Questions</div>
            <div style={{ fontSize:12, color:"#94a3b8" }}>Common questions</div>
          </div>
        </div>
        {FAQS.map((faq, i) => (
          <div key={i} className="faq-item">
            <button className="faq-trigger" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <span>{faq.q}</span>
              <ChevronRight size={16} color="#94a3b8" style={{ transform: openFaq === i ? "rotate(90deg)" : "none", transition:"transform .2s", flexShrink:0 }} />
            </button>
            {openFaq === i && <div className="faq-answer">{faq.a}</div>}
          </div>
        ))}
      </div>

      {/* User Guide */}
      <div className="card fade-in-2">
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <div className="icon-box" style={{ background:"#dbeafe" }}><Book size={18} color="#3b82f6" /></div>
          <div>
            <div className="card-title">User Guide</div>
            <div style={{ fontSize:12, color:"#94a3b8" }}>Learn how to use the app</div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {GUIDES.map(guide => (
            <div key={guide} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background="#f1f5f9")}
              onMouseLeave={e => (e.currentTarget.style.background="#f8fafc")}>
              <span style={{ fontSize:13, fontWeight:500, color:"#0f172a" }}>{guide}</span>
              <ChevronRight size={16} color="#94a3b8" />
            </div>
          ))}
        </div>
      </div>

      {/* Contact support */}
      <div className="card fade-in-3">
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <div className="icon-box" style={{ background:"#ede9fe" }}><Mail size={18} color="#8b5cf6" /></div>
          <div>
            <div className="card-title">Contact Support</div>
            <div style={{ fontSize:12, color:"#94a3b8" }}>Get personalized help</div>
          </div>
        </div>
        <div style={{ marginBottom:12 }}>
          <textarea style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #e2e8f0", borderRadius:12, fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#0f172a", resize:"vertical", outline:"none", minHeight:90 }} placeholder="Describe your issue or question..." />
        </div>
        <button className="btn btn-teal"><Mail size={17} /> Send Message</button>
      </div>

      {/* Version */}
      <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:4 }}>
        <span style={{ fontSize:12, color:"#94a3b8" }}>SolarVIZ</span>
        <span style={{ fontSize:12, color:"#cbd5e1" }}>·</span>
        <span style={{ fontSize:12, color:"#94a3b8" }}>v1.0.0</span>
        <span style={{ fontSize:12, color:"#cbd5e1" }}>·</span>
        <span style={{ fontSize:12, color:"#94a3b8" }}>© 2026</span>
      </div>

      {/* Resources */}
      <div className="fade-in-4" style={{ background:"#f0fdfa", border:"1px solid #99f6e4", borderRadius:20, padding:20 }}>
        <div style={{ fontSize:14, fontWeight:600, color:"#0f172a", fontFamily:"'Syne',sans-serif", marginBottom:8 }}>📚 Additional Resources</div>
        <div style={{ fontSize:13, color:"#475569", lineHeight:1.6 }}>
          Visit our website for video tutorials, detailed documentation, and community forums where you can share tips with other SolarVIZ users.
        </div>
      </div>
    </div>
  );
}
