import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Mail, Lock, Sun, Zap } from "lucide-react";
import { api } from "../services/api";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
console.log("Login component rendered with state:", { email, password, loading, error });
  const submit = async () => {
    console.log("Attempting login with:", { email, password });
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true); setError("");
    try {
      const d = await api.post<any>("/auth/login", { email, password });
      localStorage.setItem("access_token", d.access_token);
      localStorage.setItem("refresh_token", d.refresh_token);
      localStorage.setItem("user_email", d.email);
      localStorage.setItem("user_role", d.role);
      localStorage.setItem("user_id", String(d.user_id));
      console.log("Login successful:", d);
      nav("/app");
    } catch { setError("Invalid email or password"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(145deg,#ecfdf5,#f0fdfa,#eff6ff)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px" }}>
      <div style={{ width:"100%", maxWidth:400 }}>

        {/* Logo */}
        <div className="fade-in" style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:80, height:80, background:"linear-gradient(135deg,#10b981,#0d9488)", borderRadius:22, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", boxShadow:"0 8px 32px rgba(16,185,129,.3)" }}>
            <Sun size={38} color="white" />
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, color:"#0f172a" }}>SolarVIZ</h1>
          <p style={{ fontSize:14, color:"#64748b", marginTop:3 }}>Energy Intelligence System</p>
        </div>

        {/* Illustration card */}
        <div className="fade-in-2" style={{ background:"white", borderRadius:24, padding:"20px 24px", marginBottom:14, boxShadow:"0 4px 20px rgba(0,0,0,0.06)", border:"1px solid #e2e8f0", textAlign:"center" }}>
          <div style={{ width:88, height:88, background:"linear-gradient(135deg,#fde68a,#fbbf24)", borderRadius:"50%", margin:"0 auto 10px", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
            <Sun size={42} color="#d97706" />
            <div style={{ position:"absolute", bottom:-2, right:-2, width:30, height:30, background:"#10b981", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid white" }}>
              <Zap size={15} color="white" />
            </div>
          </div>
          <p style={{ fontSize:13, color:"#64748b" }}>Monitor and optimize your solar energy system</p>
        </div>

        {/* Form */}
        <div className="fade-in-3" style={{ background:"white", borderRadius:24, padding:"24px", boxShadow:"0 4px 20px rgba(0,0,0,0.06)", border:"1px solid #e2e8f0" }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, color:"#0f172a", marginBottom:20 }}>Welcome Back</h2>

          {error && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#dc2626" }}>{error}</div>}

          <div style={{ marginBottom:14 }}>
            <label className="field-label" style={{ fontSize:13 }}>Email Address</label>
            <div className="input-wrap">
              <Mail size={17} className="input-icon" />
              <input className="input-field" type="email" placeholder="your.email@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==="Enter" && submit()} />
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <label className="field-label" style={{ fontSize:13 }}>Password</label>
            <div className="input-wrap">
              <Lock size={17} className="input-icon" />
              <input className="input-field" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && submit()} />
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:"#374151", cursor:"pointer" }}>
              <input type="checkbox" style={{ accentColor:"#10b981" }} /> Remember me
            </label>
            <span style={{ fontSize:13, color:"#10b981", cursor:"pointer" }}>Forgot password?</span>
          </div>

          <button className="btn btn-green" onClick={submit} disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>

          <p style={{ textAlign:"center", marginTop:16, fontSize:13, color:"#64748b" }}>
            Don't have an account? <Link to="/register" style={{ color:"#10b981", fontWeight:600, textDecoration:"none" }}>Create account</Link>
          </p>
        </div>

        <p className="fade-in-4" style={{ textAlign:"center", marginTop:20, fontSize:11, color:"#94a3b8" }}>© 2026 SolarVIZ. All rights reserved.</p>
      </div>
    </div>
  );
}
