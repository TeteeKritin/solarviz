import { useState } from "react";
import { User, Mail, Edit2, Check, X, Users, Home, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { api } from "../services/api";

export default function Profile() {
  const nav = useNavigate();
  const email = localStorage.getItem("user_email") ?? "";
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: email.split("@")[0], lastName: "", members:"4", houseType:"Detached House" });
  const [saved, setSaved] = useState(false);
  const set = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = () => { setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const Field = ({ label, value, editKey, type="text", options }: any) => (
    <div style={{ marginBottom:12 }}>
      <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>{label}</label>
      {editing && editKey !== "email"
        ? options
          ? <select className="input-field no-icon" style={{ padding:"10px 14px", appearance:"none" }} value={form[editKey as keyof typeof form]} onChange={set(editKey)}>
              {options.map((o: string) => <option key={o}>{o}</option>)}
            </select>
          : <input className="input-field no-icon" style={{ padding:"10px 14px" }} type={type} value={form[editKey as keyof typeof form]} onChange={set(editKey)} />
        : <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:"10px 14px", fontSize:14, color:"#0f172a", display:"flex", alignItems:"center", gap:8 }}>
            {editKey === "email" && <Mail size={14} color="#94a3b8" />}
            {editKey === "firstName" && <User size={14} color="#94a3b8" />}
            {editKey === "members" && <Users size={14} color="#94a3b8" />}
            {editKey === "houseType" && <Home size={14} color="#94a3b8" />}
            {editKey === "email" ? email : form[editKey as keyof typeof form]}
          </div>
      }
    </div>
  );

  return (
    <div style={{ padding:"24px 16px 16px", display:"flex", flexDirection:"column", gap:14 }}>

      {saved && (
        <div className="fade-in" style={{ background:"#22c55e", borderRadius:16, padding:"12px 16px", display:"flex", alignItems:"center", gap:8, color:"white" }}>
          <Check size={18} /> Settings saved!
        </div>
      )}

      {/* Avatar card */}
      <div className="card fade-in" style={{ textAlign:"center", padding:"24px 20px" }}>
        <div style={{ width:88, height:88, background:"linear-gradient(135deg,#10b981,#0d9488)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", boxShadow:"0 6px 20px rgba(16,185,129,.25)" }}>
          <User size={44} color="white" />
        </div>
        <div style={{ fontSize:18, fontWeight:700, color:"#0f172a", fontFamily:"'Syne',sans-serif" }}>{form.firstName} {form.lastName}</div>
        <div style={{ fontSize:13, color:"#64748b", marginTop:3 }}>{email}</div>
        <div style={{ display:"inline-block", background:"#d1fae5", color:"#065f46", fontSize:11, fontWeight:600, borderRadius:99, padding:"3px 10px", marginTop:8 }}>
          {localStorage.getItem("user_role") ?? "viewer"}
        </div>
      </div>

      {/* Personal info */}
      <div className="card fade-in-2">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <div className="card-title">Personal Information</div>
            <div style={{ fontSize:12, color:"#94a3b8" }}>Manage your details</div>
          </div>
          {editing
            ? <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setEditing(false)} style={{ background:"#f1f5f9", border:"none", borderRadius:9, padding:"7px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:13 }}><X size={15} color="#64748b" /></button>
                <button onClick={save} style={{ background:"#10b981", border:"none", borderRadius:9, padding:"7px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:13, color:"white" }}><Check size={15} /></button>
              </div>
            : <button onClick={() => setEditing(true)} style={{ background:"#d1fae5", border:"none", borderRadius:9, padding:"7px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontSize:13, color:"#059669", fontFamily:"'DM Sans',sans-serif" }}>
                <Edit2 size={14} /> Edit
              </button>
          }
        </div>
        <Field label="First Name" editKey="firstName" />
        <Field label="Last Name"  editKey="lastName" />
        <Field label="Email"      editKey="email" />
      </div>

      {/* Household info */}
      <div className="card fade-in-3">
        <div className="card-title" style={{ marginBottom:14 }}>Household Information</div>
        <Field label="Household Members" editKey="members" type="number" />
        <Field label="House Type" editKey="houseType" options={["Detached House","Townhome","Condominium"]} />
      </div>

      {/* Account stats */}
      <div className="card fade-in-4">
        <div className="card-title" style={{ marginBottom:14 }}>Account</div>
        {[["User ID", localStorage.getItem("user_id") ?? "—"],["Role",localStorage.getItem("user_role") ?? "viewer"],["Status","Active"]].map(([l,v]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #f1f5f9" }}>
            <span style={{ fontSize:13, color:"#64748b" }}>{l}</span>
            <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button className="btn btn-red fade-in-5" onClick={() => { api.logout(); }} style={{ marginBottom:8 }}>
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
}
