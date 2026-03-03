import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Mail, Lock, Sun, User, ArrowLeft, Home, Users } from "lucide-react";
import { api } from "../services/api";

export default function Register() {
  const nav = useNavigate();
  const [f, setF] = useState({ firstName:"", lastName:"", email:"", password:"", confirm:"", members:"4", houseType:"Detached House" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string) => (e: any) => setF(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!f.firstName || !f.email || !f.password) { setError("Please fill required fields"); return; }
    if (f.password !== f.confirm) { setError("Passwords do not match"); return; }
    if (f.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError("");
    try {
      const d = await api.post<any>("/auth/register", { email: f.email, full_name: `${f.firstName} ${f.lastName}`.trim(), password: f.password });
      localStorage.setItem("access_token", d.access_token); localStorage.setItem("refresh_token", d.refresh_token);
      localStorage.setItem("user_email", d.email); localStorage.setItem("user_role", d.role); localStorage.setItem("user_id", String(d.user_id));
      nav("/app");
    } catch (e: any) { setError(e.message?.includes("already") ? "Email already registered" : "Registration failed"); }
    finally { setLoading(false); }
  };

  const IS = { width:"100%", padding:"11px 14px 11px 38px", border:"1.5px solid #e2e8f0", borderRadius:12, fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#0f172a", background:"white", outline:"none" };
  const Ico = ({ icon: Icon, style }: any) => <Icon size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", ...style }} />;

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(145deg,#ecfdf5,#f0fdfa,#eff6ff)", padding:"24px", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ maxWidth:400, margin:"0 auto" }}>
        <button onClick={() => nav("/login")} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"#475569", fontSize:14, marginBottom:20, fontFamily:"'DM Sans',sans-serif" }}>
          <ArrowLeft size={18} /> Back to login
        </button>

        <div className="fade-in" style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ width:60, height:60, background:"linear-gradient(135deg,#10b981,#0d9488)", borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", boxShadow:"0 6px 20px rgba(16,185,129,.3)" }}>
            <Sun size={28} color="white" />
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, color:"#0f172a" }}>Create Account</h1>
          <p style={{ fontSize:13, color:"#64748b" }}>Join SolarVIZ Energy Intelligence</p>
        </div>

        <div className="fade-in-2" style={{ background:"white", borderRadius:24, padding:"24px", boxShadow:"0 4px 20px rgba(0,0,0,0.06)", border:"1px solid #e2e8f0" }}>
          {error && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#dc2626" }}>{error}</div>}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            {[["firstName","First Name","John"],["lastName","Last Name","Doe"]].map(([k,label,ph]) => (
              <div key={k}>
                <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>{label}</label>
                <div style={{ position:"relative" }}><Ico icon={User} /><input style={IS} placeholder={ph} value={(f as any)[k]} onChange={set(k)} /></div>
              </div>
            ))}
          </div>

          {[["email","Email Address","your.email@example.com","email",Mail],["password","Password","Min. 8 characters","password",Lock],["confirm","Confirm Password","Re-enter password","password",Lock]].map(([k,label,ph,type,Icon]) => (
            <div key={k} style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>{label as string}</label>
              <div style={{ position:"relative" }}><Ico icon={Icon} /><input style={IS} type={type as string} placeholder={ph as string} value={(f as any)[k]} onChange={set(k)} /></div>
            </div>
          ))}

          <div style={{ display:"flex", alignItems:"center", gap:12, margin:"4px 0 16px" }}>
            <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
            <span style={{ fontSize:11, color:"#94a3b8", fontWeight:500, whiteSpace:"nowrap" }}>Household Information</span>
            <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>Household Members</label>
            <div style={{ position:"relative" }}><Ico icon={Users} /><input style={IS} type="number" min={1} max={20} value={f.members} onChange={set("members")} /></div>
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>House Type</label>
            <div style={{ position:"relative" }}><Ico icon={Home} />
              <select style={{ ...IS, appearance:"none", cursor:"pointer" }} value={f.houseType} onChange={set("houseType")}>
                <option>Detached House</option><option>Townhome</option><option>Condominium</option>
              </select>
            </div>
          </div>

          <button className="btn btn-green" onClick={submit} disabled={loading}>{loading ? "Creating account..." : "Create Account"}</button>
          <p style={{ textAlign:"center", marginTop:16, fontSize:13, color:"#64748b" }}>
            Already have an account? <Link to="/login" style={{ color:"#10b981", fontWeight:600, textDecoration:"none" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
