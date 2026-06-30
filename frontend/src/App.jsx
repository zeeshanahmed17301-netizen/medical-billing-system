import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ─── Theme & Global Styles ────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --navy: #0a1628;
      --navy2: #112240;
      --blue: #1d4ed8;
      --blue-light: #3b82f6;
      --cyan: #06b6d4;
      --emerald: #10b981;
      --amber: #f59e0b;
      --red: #ef4444;
      --slate: #64748b;
      --slate-light: #94a3b8;
      --border: #1e3a5f;
      --card: #0d1f3c;
      --card2: #0f2748;
      --text: #e2e8f0;
      --text-muted: #94a3b8;
      --font-display: 'Syne', sans-serif;
      --font-body: 'DM Sans', sans-serif;
    }
    html { font-family: var(--font-body); background: var(--navy); color: var(--text); }
    body { min-height: 100vh; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--navy); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    input, select, textarea {
      background: var(--navy2); border: 1px solid var(--border);
      color: var(--text); border-radius: 8px; padding: 10px 14px;
      font-family: var(--font-body); font-size: 14px; outline: none; width: 100%;
      transition: border-color 0.2s;
    }
    input:focus, select:focus, textarea:focus { border-color: var(--blue-light); }
    button { cursor: pointer; font-family: var(--font-body); }
    a { text-decoration: none; color: inherit; }
    .card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 16px; padding: 24px;
    }
    .badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 10px; border-radius: 20px; font-size: 11px;
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .badge-green  { background: #064e3b; color: #34d399; }
    .badge-red    { background: #450a0a; color: #f87171; }
    .badge-amber  { background: #451a03; color: #fbbf24; }
    .badge-blue   { background: #1e3a5f; color: #93c5fd; }
    .badge-slate  { background: #1e293b; color: #94a3b8; }
  `}</style>
);

// ─── Auth Context ─────────────────────────────────────────────────────────────
import { createContext, useContext } from "react";
const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);
  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const DEMO_USERS = {
    "admin@billing.com":   { role: "admin",   name: "Admin User",   pass: "admin123" },
    "biller@billing.com":  { role: "biller",  name: "Jane Biller",  pass: "biller123" },
    "coder@billing.com":   { role: "coder",   name: "Bob Coder",    pass: "coder123" },
    "patient@example.com": { role: "patient", name: "John Doe",     pass: "patient123" },
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const u = DEMO_USERS[email];
    if (u && u.pass === pass) {
      login({ email, role: u.role, name: u.name });
      toast.success(`Welcome back, ${u.name}`);
    } else {
      toast.error("Invalid credentials");
    }
    setLoading(false);
  };

  const quickLogin = (e, p) => { setEmail(e); setPass(p); };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--navy)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: "var(--blue-light)", letterSpacing: "-0.02em" }}>
            🏥 MedBill
          </div>
          <div style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 14 }}>AI-Powered Medical Billing System</div>
        </div>
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, marginBottom: 24 }}>Sign In</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Password</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            <Btn onClick={handleLogin} loading={loading} style={{ marginTop: 8 }}>Sign In</Btn>
          </div>
          <div style={{ marginTop: 24, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Demo Accounts</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["admin@billing.com", "admin123", "Admin"],
                ["biller@billing.com", "biller123", "Biller"],
                ["coder@billing.com", "coder123", "Coder"],
                ["patient@example.com", "patient123", "Patient"],
              ].map(([e, p, label]) => (
                <button key={label} onClick={() => quickLogin(e, p)}
                  style={{ padding: "8px 10px", background: "var(--navy2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)", transition: "all 0.2s" }}
                  onMouseOver={ev => ev.target.style.borderColor = "var(--blue-light)"}
                  onMouseOut={ev => ev.target.style.borderColor = "var(--border)"}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable Components ──────────────────────────────────────────────────────
function Btn({ children, onClick, loading, variant = "primary", style = {}, ...props }) {
  const base = {
    padding: "11px 22px", borderRadius: 10, fontWeight: 600, fontSize: 14,
    border: "none", display: "inline-flex", alignItems: "center", gap: 8,
    transition: "all 0.2s", cursor: loading ? "wait" : "pointer",
    ...style,
  };
  const variants = {
    primary: { background: "var(--blue)", color: "#fff" },
    success: { background: "var(--emerald)", color: "#fff" },
    danger:  { background: "var(--red)", color: "#fff" },
    ghost:   { background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" },
    outline: { background: "transparent", color: "var(--blue-light)", border: "1px solid var(--blue)" },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...variants[variant], ...(loading ? { opacity: 0.7 } : {}) }} {...props}>
      {loading ? "⏳" : children}
    </button>
  );
}

function KPICard({ label, value, sub, color = "var(--blue-light)", icon }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, marginBottom: 20, color: "var(--text)" }}>
      {children}
    </h2>
  );
}

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────
function Sidebar({ user, logout }) {
  const loc = useLocation();
  const items = [
    { path: "/dashboard", label: "Dashboard", icon: "📊", roles: ["admin", "biller", "coder", "patient"] },
    { path: "/upload",    label: "Upload Bill", icon: "📤", roles: ["admin", "biller"] },
    { path: "/bills",     label: "Bills",       icon: "🧾", roles: ["admin", "biller", "coder"] },
    { path: "/invoices",  label: "Invoices",    icon: "📋", roles: ["admin", "biller", "patient"] },
    { path: "/claims",    label: "Claims",      icon: "🏥", roles: ["admin", "biller"] },
    { path: "/payments",  label: "Payments",    icon: "💳", roles: ["admin", "biller", "patient"] },
    { path: "/denials",   label: "Denials",     icon: "⚠️", roles: ["admin", "biller", "coder"] },
    { path: "/patients",  label: "Patients",    icon: "👤", roles: ["admin", "biller"] },
  ].filter(i => i.roles.includes(user.role));

  return (
    <div style={{ width: 240, background: "var(--card)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", minHeight: "100vh", flexShrink: 0 }}>
      <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "var(--blue-light)", letterSpacing: "-0.02em" }}>🏥 MedBill</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Billing Automation</div>
      </div>
      <nav style={{ flex: 1, padding: "12px 12px" }}>
        {items.map(item => {
          const active = loc.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <div style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                borderRadius: 10, marginBottom: 2, fontSize: 14, fontWeight: active ? 600 : 400,
                background: active ? "rgba(29,78,216,0.2)" : "transparent",
                color: active ? "var(--blue-light)" : "var(--text-muted)",
                borderLeft: active ? "3px solid var(--blue-light)" : "3px solid transparent",
                transition: "all 0.15s",
              }}>
                <span>{item.icon}</span>
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: 16, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{user.name}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize", marginBottom: 12 }}>{user.role}</div>
        <Btn variant="ghost" onClick={logout} style={{ width: "100%", justifyContent: "center", fontSize: 13 }}>Sign Out</Btn>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  const revenueData = [
    { month: "Jan", revenue: 8200 }, { month: "Feb", revenue: 9100 },
    { month: "Mar", revenue: 7800 }, { month: "Apr", revenue: 10200 },
    { month: "May", revenue: 7550 }, { month: "Jun", revenue: 11300 },
  ];
  const claimsData = [
    { name: "Approved", value: 61, color: "#10b981" },
    { name: "Denied",   value: 8,  color: "#ef4444" },
    { name: "Pending",  value: 9,  color: "#f59e0b" },
  ];
  return (
    <div>
      <SectionTitle>Dashboard Overview</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        <KPICard label="Total Revenue" value="$42,850" sub="This period" icon="💰" color="var(--emerald)" />
        <KPICard label="Bills Uploaded" value="142" sub="3 pending extraction" icon="📤" />
        <KPICard label="Claims Submitted" value="78" sub="61 approved (78%)" icon="🏥" color="var(--cyan)" />
        <KPICard label="Denial Rate" value="10.3%" sub="8 active denials" icon="⚠️" color="var(--amber)" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div className="card">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 16 }}>Monthly Revenue</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="var(--blue)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 16 }}>Claims Status</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={claimsData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {claimsData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {claimsData.map(d => (
              <div key={d.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, display: "inline-block" }} />
                  {d.name}
                </span>
                <span style={{ fontWeight: 600 }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <div className="card">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 16 }}>Recent Activity</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Invoice", "Patient", "Amount", "Status", "Date"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "0 12px 10px 0", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["INV-202406-A1B2C3", "John Doe",    "$150.00", "paid",    "2024-06-01"],
                ["INV-202406-D4E5F6", "Jane Smith",  "$320.00", "overdue", "2024-05-20"],
                ["INV-202406-G7H8I9", "Bob Johnson", "$95.00",  "pending", "2024-06-03"],
                ["INV-202405-J0K1L2", "Alice Brown",  "$210.00", "paid",    "2024-05-28"],
              ].map(([inv, pat, amt, status, date]) => (
                <tr key={inv} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 12px 12px 0", color: "var(--blue-light)", fontFamily: "monospace", fontSize: 12 }}>{inv}</td>
                  <td style={{ padding: "12px 12px 12px 0" }}>{pat}</td>
                  <td style={{ padding: "12px 12px 12px 0", fontWeight: 600 }}>{amt}</td>
                  <td style={{ padding: "12px 12px 12px 0" }}>
                    <span className={`badge badge-${status === "paid" ? "green" : status === "overdue" ? "red" : "amber"}`}>{status}</span>
                  </td>
                  <td style={{ padding: "12px 0", color: "var(--text-muted)", fontSize: 12 }}>{date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Bill Upload ──────────────────────────────────────────────────────────────
function UploadBill() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const mockExtract = async () => {
    setProcessing(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 2500));
    setResult({
      overall_confidence: 0.91,
      patient: { name: "John Doe", dob: "1985-03-15", patient_id: "P-00123", address: "123 Main St, Austin TX 78701", _confidence: 0.95 },
      provider: { name: "Dr. Sarah Smith", facility_name: "City Medical Center", npi: "1234567890", _confidence: 0.98 },
      date_of_service: "2024-06-01",
      date_of_service_confidence: 0.97,
      diagnosis_codes: ["J45.909"],
      line_items: [
        { cpt_code: "99213", icd10_codes: ["J45.909"], description: "Office visit - moderate complexity", quantity: 1, unit_price: 150.00, total: 150.00, _confidence: 0.93 },
        { cpt_code: "94640", icd10_codes: ["J45.909"], description: "Nebulizer treatment", quantity: 1, unit_price: 45.00, total: 45.00, _confidence: 0.88 },
      ],
      subtotal: 195.00, tax: 0.00, total_charged: 195.00,
      code_validation: {
        overall_status: "passed",
        validations: [
          { cpt_code: "99213", icd10_code: "J45.909", status: "passed", issue: "", suggestion: "Valid combination for asthma management visit", drg_code: "204", drg_weight: 0.8 },
          { cpt_code: "94640", icd10_code: "J45.909", status: "passed", issue: "", suggestion: "Appropriate nebulizer treatment for asthma" },
        ]
      }
    });
    setProcessing(false);
    toast.success("AI extraction complete!");
  };

  const ConfBar = ({ score }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "var(--navy2)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${score * 100}%`, height: "100%", background: score > 0.8 ? "var(--emerald)" : score > 0.6 ? "var(--amber)" : "var(--red)", borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, color: "var(--text-muted)", width: 30, textAlign: "right" }}>{Math.round(score * 100)}%</span>
    </div>
  );

  return (
    <div>
      <SectionTitle>Upload Doctor's Bill</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1.4fr" : "1fr", gap: 20 }}>
        <div>
          <div className="card">
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragging ? "var(--blue-light)" : file ? "var(--emerald)" : "var(--border)"}`,
                borderRadius: 12, padding: 40, textAlign: "center",
                background: dragging ? "rgba(59,130,246,0.05)" : "transparent",
                transition: "all 0.2s", cursor: "pointer",
              }}
              onClick={() => document.getElementById("fileInput").click()}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>{file ? "📄" : "☁️"}</div>
              {file ? (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Drop bill here or click to browse</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>PDF, JPG, PNG — up to 20MB</div>
                </div>
              )}
              <input id="fileInput" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
            </div>
            {file && (
              <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                <Btn onClick={mockExtract} loading={processing} style={{ flex: 1, justifyContent: "center" }}>
                  🤖 Extract with AI
                </Btn>
                <Btn variant="ghost" onClick={() => { setFile(null); setResult(null); }}>Clear</Btn>
              </div>
            )}
            {processing && (
              <div className="card" style={{ marginTop: 16, background: "var(--navy2)" }}>
                <div style={{ fontSize: 13, marginBottom: 10, color: "var(--text-muted)" }}>AI Processing Pipeline</div>
                {["Running OCR on document...", "Extracting text with Tesseract...", "Sending to Claude AI...", "Validating CPT/ICD-10 codes...", "Calculating confidence scores..."].map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, fontSize: 13 }}>
                    <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span>
                    {step}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>Extraction Results</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`badge badge-${result.overall_confidence > 0.8 ? "green" : "amber"}`}>
                    Confidence: {Math.round(result.overall_confidence * 100)}%
                  </span>
                  <Btn variant="outline" onClick={() => setEditMode(!editMode)} style={{ padding: "6px 14px", fontSize: 12 }}>
                    {editMode ? "Save" : "Override"}
                  </Btn>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  ["Patient", result.patient.name, result.patient._confidence],
                  ["DOB", result.patient.dob, result.patient._confidence],
                  ["Provider", result.provider.name, result.provider._confidence],
                  ["Date of Service", result.date_of_service, result.date_of_service_confidence],
                ].map(([label, val, conf]) => (
                  <div key={label} style={{ background: "var(--navy2)", borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
                    {editMode ? <input defaultValue={val} style={{ marginBottom: 6 }} /> : <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{val}</div>}
                    <ConfBar score={conf} />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Line Items</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["CPT", "ICD-10", "Description", "Amount", "Conf"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "0 8px 8px 0", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.line_items.map((item, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "8px 8px 8px 0", color: "var(--blue-light)", fontFamily: "monospace" }}>{item.cpt_code}</td>
                        <td style={{ padding: "8px 8px 8px 0", fontFamily: "monospace" }}>{item.icd10_codes[0]}</td>
                        <td style={{ padding: "8px 8px 8px 0", maxWidth: 180 }}>{item.description}</td>
                        <td style={{ padding: "8px 8px 8px 0", fontWeight: 600 }}>${item.total.toFixed(2)}</td>
                        <td style={{ padding: "8px 0" }}>
                          <span style={{ fontSize: 11, color: item._confidence > 0.85 ? "var(--emerald)" : "var(--amber)" }}>
                            {Math.round(item._confidence * 100)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, fontWeight: 700, fontSize: 15 }}>
                  Total: ${result.total_charged.toFixed(2)}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Code Validation</div>
                <span className={`badge badge-${result.code_validation.overall_status === "passed" ? "green" : "red"}`} style={{ marginBottom: 8 }}>
                  {result.code_validation.overall_status.toUpperCase()}
                </span>
                {result.code_validation.validations.map((v, i) => (
                  <div key={i} style={{ background: "var(--navy2)", borderRadius: 8, padding: 10, marginTop: 6, fontSize: 12 }}>
                    <div style={{ fontFamily: "monospace", color: "var(--blue-light)" }}>{v.cpt_code} + {v.icd10_code}</div>
                    <div style={{ color: "var(--text-muted)", marginTop: 2 }}>{v.suggestion}</div>
                    {v.drg_code && <div style={{ color: "var(--cyan)", marginTop: 2 }}>DRG: {v.drg_code} (weight: {v.drg_weight})</div>}
                  </div>
                ))}
              </div>

              <Btn variant="success" style={{ width: "100%", justifyContent: "center" }} onClick={() => toast.success("Invoice generated! Check Invoices tab.")}>
                📋 Generate Invoice
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bills List ───────────────────────────────────────────────────────────────
function Bills() {
  const bills = [
    { id: "B-001", file: "Dr_Smith_bill.pdf", patient: "John Doe", status: "invoiced", confidence: 0.91, date: "2024-06-01", total: "$195.00" },
    { id: "B-002", file: "City_Medical_June.pdf", patient: "Jane Smith", status: "reviewed", confidence: 0.78, date: "2024-06-02", total: "$320.00" },
    { id: "B-003", file: "scan_002.jpg", patient: "Unknown", status: "error", confidence: 0.34, date: "2024-06-03", total: "—" },
    { id: "B-004", file: "ER_visit_bill.pdf", patient: "Bob Johnson", status: "extracted", confidence: 0.88, date: "2024-06-03", total: "$95.00" },
  ];
  const statusBadge = { uploaded: "slate", processing: "blue", extracted: "amber", reviewed: "blue", invoiced: "green", error: "red" };

  return (
    <div>
      <SectionTitle>Uploaded Bills</SectionTitle>
      <div className="card">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["ID", "File", "Patient", "Confidence", "Total", "Status", "Date", "Actions"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "0 12px 12px 0", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bills.map(b => (
              <tr key={b.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 12px 12px 0", fontFamily: "monospace", color: "var(--text-muted)", fontSize: 12 }}>{b.id}</td>
                <td style={{ padding: "12px 12px 12px 0" }}>{b.file}</td>
                <td style={{ padding: "12px 12px 12px 0" }}>{b.patient}</td>
                <td style={{ padding: "12px 12px 12px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 4, background: "var(--navy2)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${b.confidence * 100}%`, height: "100%", background: b.confidence > 0.8 ? "var(--emerald)" : b.confidence > 0.6 ? "var(--amber)" : "var(--red)" }} />
                    </div>
                    <span style={{ fontSize: 12 }}>{Math.round(b.confidence * 100)}%</span>
                  </div>
                </td>
                <td style={{ padding: "12px 12px 12px 0", fontWeight: 600 }}>{b.total}</td>
                <td style={{ padding: "12px 12px 12px 0" }}>
                  <span className={`badge badge-${statusBadge[b.status]}`}>{b.status}</span>
                </td>
                <td style={{ padding: "12px 12px 12px 0", color: "var(--text-muted)", fontSize: 12 }}>{b.date}</td>
                <td style={{ padding: "12px 0" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn variant="ghost" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => toast.success("Viewing bill " + b.id)}>View</Btn>
                    {b.status !== "invoiced" && b.status !== "error" && (
                      <Btn variant="outline" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => toast.success("Invoice generated!")}>Invoice</Btn>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
function Invoices() {
  const invoices = [
    { num: "INV-202406-A1B2C3", patient: "John Doe",    amount: 195.00, paid: 155.00, balance: 40.00,  status: "partial",  due: "2024-06-30" },
    { num: "INV-202406-D4E5F6", patient: "Jane Smith",   amount: 320.00, paid: 0,      balance: 320.00, status: "overdue",  due: "2024-05-20" },
    { num: "INV-202406-G7H8I9", patient: "Bob Johnson",  amount: 95.00,  paid: 95.00,  balance: 0,      status: "paid",     due: "2024-06-15" },
    { num: "INV-202405-J0K1L2", patient: "Alice Brown",  amount: 210.00, paid: 0,      balance: 210.00, status: "draft",    due: "2024-07-01" },
  ];
  const sb = { draft: "slate", sent: "blue", paid: "green", partial: "amber", overdue: "red", collection: "red" };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <SectionTitle>Invoices</SectionTitle>
        <Btn onClick={() => toast.success("Create invoice from a reviewed bill")}>+ New Invoice</Btn>
      </div>
      <div className="card">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Invoice #", "Patient", "Total", "Paid", "Balance", "Status", "Due Date", "Actions"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "0 12px 12px 0", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.num} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 12px 12px 0", color: "var(--blue-light)", fontFamily: "monospace", fontSize: 11 }}>{inv.num}</td>
                <td style={{ padding: "12px 12px 12px 0" }}>{inv.patient}</td>
                <td style={{ padding: "12px 12px 12px 0", fontWeight: 600 }}>${inv.amount.toFixed(2)}</td>
                <td style={{ padding: "12px 12px 12px 0", color: "var(--emerald)" }}>${inv.paid.toFixed(2)}</td>
                <td style={{ padding: "12px 12px 12px 0", fontWeight: 700, color: inv.balance > 0 ? "var(--amber)" : "var(--text-muted)" }}>${inv.balance.toFixed(2)}</td>
                <td style={{ padding: "12px 12px 12px 0" }}><span className={`badge badge-${sb[inv.status]}`}>{inv.status}</span></td>
                <td style={{ padding: "12px 12px 12px 0", fontSize: 12, color: "var(--text-muted)" }}>{inv.due}</td>
                <td style={{ padding: "12px 0" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn variant="ghost" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => toast.success("PDF download started")}>📄 PDF</Btn>
                    {inv.balance > 0 && <Btn variant="success" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => toast.success("Payment link sent to patient")}>💳 Pay</Btn>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Claims ───────────────────────────────────────────────────────────────────
function Claims() {
  const claims = [
    { num: "CLM-20240601-A1B2C3D4", payer: "BlueCross",   billed: 195.00, allowed: 155.00, paid: 155.00, status: "approved",  submitted: "2024-06-01" },
    { num: "CLM-20240520-E5F6G7H8", payer: "Aetna",        billed: 320.00, allowed: 0,      paid: 0,      status: "denied",    submitted: "2024-05-20" },
    { num: "CLM-20240603-I9J0K1L2", payer: "United",       billed: 95.00,  allowed: 80.00,  paid: 80.00,  status: "approved",  submitted: "2024-06-03" },
    { num: "CLM-20240603-M3N4O5P6", payer: "Cigna",        billed: 210.00, allowed: 0,      paid: 0,      status: "pending",   submitted: "2024-06-03" },
  ];
  const cb = { approved: "green", denied: "red", pending: "amber", submitted: "blue", draft: "slate" };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <SectionTitle>Insurance Claims</SectionTitle>
        <Btn onClick={() => toast.success("Select an invoice to generate a claim")}>+ Submit Claim</Btn>
      </div>
      <div className="card">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Claim #", "Payer", "Billed", "Allowed", "Paid", "Status", "Submitted", "Actions"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "0 12px 12px 0", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {claims.map(c => (
              <tr key={c.num} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 12px 12px 0", color: "var(--blue-light)", fontFamily: "monospace", fontSize: 11 }}>{c.num}</td>
                <td style={{ padding: "12px 12px 12px 0" }}>{c.payer}</td>
                <td style={{ padding: "12px 12px 12px 0", fontWeight: 600 }}>${c.billed.toFixed(2)}</td>
                <td style={{ padding: "12px 12px 12px 0" }}>{c.allowed > 0 ? `$${c.allowed.toFixed(2)}` : "—"}</td>
                <td style={{ padding: "12px 12px 12px 0", color: "var(--emerald)" }}>{c.paid > 0 ? `$${c.paid.toFixed(2)}` : "—"}</td>
                <td style={{ padding: "12px 12px 12px 0" }}><span className={`badge badge-${cb[c.status]}`}>{c.status}</span></td>
                <td style={{ padding: "12px 12px 12px 0", fontSize: 12, color: "var(--text-muted)" }}>{c.submitted}</td>
                <td style={{ padding: "12px 0" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn variant="ghost" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => toast.success("Opening claim " + c.num)}>View</Btn>
                    {c.status === "denied" && <Btn variant="danger" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => toast.success("Denial analysis started")}>⚠️ Analyze</Btn>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Denials ─────────────────────────────────────────────────────────────────
function Denials() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const runAnalysis = async () => {
    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 2000));
    setAnalysis({
      category: "coding_error",
      analysis: "The denial was triggered because CPT 99213 was billed with diagnosis J45.909 but the payer requires a prior authorization number for specialist office visits in this plan. Additionally, the modifier -25 was missing for the nebulizer treatment performed on the same day.",
      recommended_action: "corrected_claim",
      action_steps: [
        "Add prior authorization number to Box 23 of CMS-1500",
        "Append modifier -25 to CPT 94640",
        "Resubmit within 90 days of original denial date",
        "Include medical necessity documentation",
      ],
      can_auto_resolve: true,
    });
    setAnalyzing(false);
    toast.success("AI analysis complete");
  };

  const denials = [
    { id: "DEN-001", claim: "CLM-20240520-E5F6G7H8", payer: "Aetna", code: "CO-4", reason: "CPT inconsistent with modifier", category: "coding_error", action: "corrected_claim" },
  ];

  return (
    <div>
      <SectionTitle>Denial Management</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 16 }}>Active Denials</div>
          {denials.map(d => (
            <div key={d.id} style={{ background: "var(--navy2)", borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: "monospace", color: "var(--blue-light)", fontSize: 12 }}>{d.claim}</span>
                <span className="badge badge-red">{d.category.replace("_", " ")}</span>
              </div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>{d.payer}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
                <span style={{ fontFamily: "monospace", color: "var(--amber)" }}>{d.code}</span> — {d.reason}
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <Btn variant="outline" onClick={runAnalysis} loading={analyzing} style={{ padding: "7px 14px", fontSize: 12 }}>
                  🤖 AI Analyze
                </Btn>
                <Btn variant="ghost" style={{ padding: "7px 14px", fontSize: 12 }} onClick={() => toast.success("Escalated to human review")}>
                  Escalate
                </Btn>
              </div>
            </div>
          ))}
        </div>
        <div>
          {analysis && (
            <div className="card">
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 12 }}>🤖 AI Analysis Result</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <span className="badge badge-amber">{analysis.category.replace("_", " ")}</span>
                <span className={`badge badge-${analysis.can_auto_resolve ? "green" : "red"}`}>
                  {analysis.can_auto_resolve ? "Auto-resolvable" : "Needs review"}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>{analysis.analysis}</div>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Recommended Action: <span style={{ color: "var(--cyan)" }}>{analysis.recommended_action.replace("_", " ")}</span></div>
              <div style={{ fontSize: 13, marginBottom: 16 }}>
                {analysis.action_steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, color: "var(--text-muted)" }}>
                    <span style={{ color: "var(--emerald)", fontWeight: 700 }}>{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </div>
              <Btn variant="success" onClick={() => toast.success("Corrected claim submitted automatically!")}>
                ✅ Auto-Rebill
              </Btn>
            </div>
          )}
          {!analysis && (
            <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
              <div>Select a denial and click "AI Analyze" to get AI-powered corrective action suggestions</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Payments ─────────────────────────────────────────────────────────────────
function Payments() {
  const payments = [
    { id: "PAY-001", invoice: "INV-202406-A1B2C3", patient: "John Doe",   amount: 155.00, method: "insurance", status: "completed", date: "2024-06-15" },
    { id: "PAY-002", invoice: "INV-202406-G7H8I9", patient: "Bob Johnson", amount: 95.00,  method: "stripe",    status: "completed", date: "2024-06-10" },
    { id: "PAY-003", invoice: "INV-202405-X1Y2Z3", patient: "Mary Wilson", amount: 40.00,  method: "stripe",    status: "pending",   date: "2024-06-04" },
  ];
  const mb = { stripe: "blue", insurance: "cyan", paypal: "amber", check: "slate", cash: "green" };
  const sb = { completed: "green", pending: "amber", failed: "red", refunded: "slate" };
  return (
    <div>
      <SectionTitle>Payments</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
        <KPICard label="Total Collected" value="$38,420" icon="💰" color="var(--emerald)" />
        <KPICard label="Pending" value="$4,430" icon="⏳" color="var(--amber)" />
        <KPICard label="Failed" value="$0" icon="❌" color="var(--red)" />
      </div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>Payment Log</div>
          <Btn variant="outline" onClick={() => toast.success("Manual payment recording form")}>+ Record Payment</Btn>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Payment ID", "Invoice", "Patient", "Amount", "Method", "Status", "Date"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "0 12px 12px 0", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 12px 12px 0", fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>{p.id}</td>
                <td style={{ padding: "12px 12px 12px 0", color: "var(--blue-light)", fontFamily: "monospace", fontSize: 11 }}>{p.invoice}</td>
                <td style={{ padding: "12px 12px 12px 0" }}>{p.patient}</td>
                <td style={{ padding: "12px 12px 12px 0", fontWeight: 700, color: "var(--emerald)" }}>${p.amount.toFixed(2)}</td>
                <td style={{ padding: "12px 12px 12px 0" }}><span className={`badge badge-${mb[p.method]}`}>{p.method}</span></td>
                <td style={{ padding: "12px 12px 12px 0" }}><span className={`badge badge-${sb[p.status]}`}>{p.status}</span></td>
                <td style={{ padding: "12px 0", fontSize: 12, color: "var(--text-muted)" }}>{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Patients ─────────────────────────────────────────────────────────────────
function Patients() {
  const patients = [
    { id: "P-001", name: "John Doe",    dob: "1985-03-15", insurance: "BlueCross PPO", balance: 40.00,  status: "active" },
    { id: "P-002", name: "Jane Smith",  dob: "1992-07-22", insurance: "Aetna HMO",    balance: 320.00, status: "overdue" },
    { id: "P-003", name: "Bob Johnson", dob: "1978-11-08", insurance: "United Choice", balance: 0,      status: "active" },
    { id: "P-004", name: "Alice Brown", dob: "1968-05-30", insurance: "Cigna PPO",     balance: 210.00, status: "pending" },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <SectionTitle>Patients</SectionTitle>
        <Btn onClick={() => toast.success("Add new patient form")}>+ Add Patient</Btn>
      </div>
      <div className="card">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["ID", "Name", "DOB", "Insurance", "Balance", "Status", "Actions"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "0 12px 12px 0", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 12px 12px 0", fontFamily: "monospace", color: "var(--cyan)", fontSize: 12 }}>{p.id}</td>
                <td style={{ padding: "12px 12px 12px 0", fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: "12px 12px 12px 0", color: "var(--text-muted)", fontSize: 12 }}>{p.dob}</td>
                <td style={{ padding: "12px 12px 12px 0", fontSize: 12 }}>{p.insurance}</td>
                <td style={{ padding: "12px 12px 12px 0", fontWeight: 700, color: p.balance > 0 ? "var(--amber)" : "var(--text-muted)" }}>${p.balance.toFixed(2)}</td>
                <td style={{ padding: "12px 12px 12px 0" }}>
                  <span className={`badge badge-${p.status === "active" ? "green" : p.status === "overdue" ? "red" : "amber"}`}>{p.status}</span>
                </td>
                <td style={{ padding: "12px 0" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn variant="ghost" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => toast.success("Opening patient " + p.name)}>View</Btn>
                    <Btn variant="outline" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => toast.success("Statement sent to " + p.name)}>Statement</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
function Layout({ children }) {
  const { user, logout } = useAuth();
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar user={user} logout={logout} />
      <main style={{ flex: 1, padding: 32, overflowY: "auto", background: "var(--navy)" }}>
        {children}
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <GlobalStyles />
      <Toaster position="top-right" toastOptions={{
        style: { background: "#0d1f3c", color: "#e2e8f0", border: "1px solid #1e3a5f" }
      }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPageWrapper />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/upload"    element={<ProtectedRoute><UploadBill /></ProtectedRoute>} />
          <Route path="/bills"     element={<ProtectedRoute><Bills /></ProtectedRoute>} />
          <Route path="/invoices"  element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
          <Route path="/claims"    element={<ProtectedRoute><Claims /></ProtectedRoute>} />
          <Route path="/payments"  element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/denials"   element={<ProtectedRoute><Denials /></ProtectedRoute>} />
          <Route path="/patients"  element={<ProtectedRoute><Patients /></ProtectedRoute>} />
          <Route path="*"          element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function LoginPageWrapper() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
}
