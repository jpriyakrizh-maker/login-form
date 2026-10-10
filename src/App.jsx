import { useState, useRef, useEffect } from "react";
import "./app.css";

const LINE1 = "Good to see you,";
const LINE2 = "let's get started.";

const TOPS = [[70, 200, 45], [190, 185, 55], [310, 195, 48], [480, 190, 60], [600, 180, 80], [720, 185, 70], [880, 205, 125], [1050, 195, 85], [1190, 210, 70]];
const BOTS = [20, 135, 250, 365, 480, 595, 710, 825, 940, 1055, 1170];

// the cloud is cut in two halves: the top half rises, the bottom half drops, the middle grows
function Cloud() {
  return (
    <svg className="cloud" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <g id="cl" fill="#0e1a14">
          <rect x="-20" y="175" width="1240" height="370" />
          {TOPS.map(([cx, cy, r]) => <circle key={cx} cx={cx} cy={cy} r={r} />)}
          {BOTS.map((cx) => <circle key={cx} cx={cx} cy="545" r="62" />)}
        </g>
        <clipPath id="clipT"><rect x="-50" y="-50" width="1300" height="280" /></clipPath>
        <clipPath id="clipB"><rect x="-50" y="510" width="1300" height="300" /></clipPath>
      </defs>
      <rect className="core" x="-20" y="220" width="1240" height="300" fill="#0e1a14" />
      <g className="ct"><g clipPath="url(#clipT)"><use href="#cl" /></g></g>
      <g className="cb"><g clipPath="url(#clipB)"><use href="#cl" /></g></g>
    </svg>
  );
}

function Panda({ cover, look, svgRef }) {
  const dx = look.x, dy = look.y;
  return (
    <svg ref={svgRef} className={"panda" + (cover ? " cover" : "")} viewBox="0 0 140 130" aria-hidden="true">
      <circle cx="28" cy="26" r="16" fill="#2a2d2c" />
      <circle cx="112" cy="26" r="16" fill="#2a2d2c" />
      <ellipse cx="70" cy="68" rx="52" ry="46" fill="#fff" stroke="#24382e" strokeWidth="2" />
      <ellipse cx="46" cy="64" rx="13" ry="16" fill="#2a2d2c" transform="rotate(20 46 64)" />
      <ellipse cx="94" cy="64" rx="13" ry="16" fill="#2a2d2c" transform="rotate(-20 94 64)" />
      <circle cx="46" cy="64" r="8" fill="#fff" />
      <circle cx="94" cy="64" r="8" fill="#fff" />
      <circle className="pupil" cx="46" cy="64" r="3.4" fill="#111" style={{ transform: `translate(${dx}px,${dy}px)` }} />
      <circle className="pupil" cx="94" cy="64" r="3.4" fill="#111" style={{ transform: `translate(${dx}px,${dy}px)` }} />
      <ellipse cx="70" cy="82" rx="6" ry="4.5" fill="#2a2d2c" />
      <path d="M62 90q8 7 16 0" stroke="#2a2d2c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <g className="paw">
        <ellipse cx="46" cy="64" rx="17" ry="14" fill="#2a2d2c" />
        <ellipse cx="94" cy="64" rx="17" ry="14" fill="#2a2d2c" />
      </g>
    </svg>
  );
}

export default function App() {
  const [open, setOpen] = useState(false); // the cloud
  const [on, setOn] = useState(false);       // the lamp
  const [drag, setDrag] = useState(0);
  const startY = useRef(null);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const pandaRef = useRef(null);
  const [toast, setToast] = useState(null); // { type, msg, show }
  const [t1, setT1] = useState("");
  const [t2, setT2] = useState("");
  const card = useRef(null);
  const submitTimer = useRef(null);

  // eyes follow the caret: left/right along the text, down while typing, up when empty
  const aim = (el) => {
    const len = el.value.length;
    const pos = el.selectionStart ?? len;
    const r = len ? pos / len : 0.5;
    setLook({ x: (r - 0.5) * 6.4, y: len ? 3 : -3 });
  };

  // the cloud opens by itself shortly after the page loads
  useEffect(() => { const t = setTimeout(() => setOpen(true), 600); return () => clearTimeout(t); }, []);

  // after the lamp glows, the panda's eyes follow the cursor anywhere on the page
  useEffect(() => {
    if (!on) { setMouse({ x: 0, y: 0 }); return; }
    const h = (e) => {
      const el = pandaRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy) || 1, k = Math.min(1, dist / 180);
      setMouse({ x: (dx / dist) * 4.4 * k, y: (dy / dist) * 4.4 * k });
    };
    window.addEventListener("pointermove", h);
    return () => window.removeEventListener("pointermove", h);
  }, [on]);

  // the card can't be focused or clicked while the lamp is off
  useEffect(() => { if (card.current) card.current.inert = !on; }, [on]);

  // typed text under the lamp: starts after the glow, one letter at a time
  useEffect(() => {
    if (!on) { setT1(""); setT2(""); return; }
    let i = 0, j = 0, iv;
    const start = setTimeout(() => {
      iv = setInterval(() => {
        if (i < LINE1.length) { i++; setT1(LINE1.slice(0, i)); }
        else if (j < LINE2.length) { j++; setT2(LINE2.slice(0, j)); }
        else clearInterval(iv);
      }, 60);
    }, 900);
    return () => { clearTimeout(start); clearInterval(iv); };
  }, [on]);

  // alert message at the top: auto-hides after 3.5s
  const notify = (type, msg) => setToast({ type, msg, show: true });
  const closeToast = () => setToast((t) => t && { ...t, show: false });
  useEffect(() => {
    if (!toast || !toast.show) return;
    const t = setTimeout(closeToast, 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => () => clearTimeout(submitTimer.current), []);

  // drag the cord down (finger or mouse) and let go: the lamp switches
  const down = (e) => { e.currentTarget.setPointerCapture(e.pointerId); startY.current = e.clientY; };
  const move = (e) => {
    if (startY.current == null) return;
    setDrag(Math.max(0, Math.min(46, e.clientY - startY.current)));
  };
  const up = () => {
    if (startY.current == null) return;
    const d = drag;
    startY.current = null;
    setDrag(0);
    if (d > 14) setOn((v) => !v); // only a real pull switches the lamp
  };
  const cancel = () => { startY.current = null; setDrag(0); };
  const key = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOn((v) => !v); } };

  const submit = (e) => {
    e.preventDefault();
    if (!user.trim() || !pass) { setStatus(""); return notify("error", "Enter your username and password."); }
    setBusy(true);
    setStatus("Signing you in…");
    submitTimer.current = setTimeout(() => {
      setBusy(false);
      setStatus("");
      notify("ok", "Login successful. Welcome back, " + user + "!");
    }, 1200);
  };

  const line1Done = t1.length === LINE1.length;

  return (
    <main className={"room" + (open ? " open" : "") + (on ? " is-on" : "")}>
      <Cloud />
      <div className="dim" aria-hidden="true" />

      {toast && (
        <div className={"toast " + toast.type + (toast.show ? " show" : "")} role="alert" aria-live="assertive">
          <span className="toast_icon" aria-hidden="true">{toast.type === "ok" ? "🐼" : "!"}</span>
          <span className="toast_msg">{toast.msg}</span>
          <button type="button" className="toast_x" onClick={closeToast} aria-label="Close message">✕</button>
        </div>
      )}

      <div className="content">
      <div className="lamp">
        <svg viewBox="0 0 220 340">
          <defs>
            <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffb86b" stopOpacity=".6" />
              <stop offset="1" stopColor="#ffb86b" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon className="lamp_light" points="80,150 140,150 215,300 5,300" fill="url(#beam)" />
          <rect x="106" y="150" width="8" height="140" rx="4" fill="#d9c9a3" />
          <ellipse cx="110" cy="292" rx="42" ry="8" fill="#d9c9a3" />
          <g className="lamp_head">
            <polygon className="shade" points="78,60 142,60 162,150 58,150" />
            <text className="shade-txt" x="110" y="94" textAnchor="middle">BAMBOO</text>
            <g className="face-off" stroke="#cbd3cf" strokeWidth="2.5" fill="none" strokeLinecap="round">
              <path d="M88 108q8 6 16 0M116 108q8 6 16 0" />
            </g>
            <g className="face-on" stroke="#4a2a12" strokeWidth="2.5" fill="none" strokeLinecap="round">
              <path d="M88 106q8-8 16 0M116 106q8-8 16 0" />
              <path d="M102 116q8 12 16 0z" fill="#e8576b" stroke="none" />
            </g>
          </g>
          <g className="cord" role="button" tabIndex={0} aria-pressed={on} aria-label="Pull the cord down to switch the lamp"
             onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onKeyDown={key}>
            <rect x="98" y="292" width="56" height={66 + drag} fill="transparent" />
            <path d={"M126 292V" + (315 + drag)} stroke="#d9c9a3" strokeWidth="2.5" />
            <circle cx="126" cy={320 + drag} r="6" fill="#d9c9a3" />
          </g>
        </svg>

        <span className="hint">Pull the cord down</span>

        <div className="under" aria-live="polite">
          <p className="l1">{t1}{on && !line1Done && <i className="caret" />}</p>
          <p className="l2">{t2}{on && line1Done && <i className="caret" />}</p>
        </div>
      </div>

      <section className="card" id="signin" ref={card} aria-hidden={!on}>
        <Panda svgRef={pandaRef} cover={focus === "pass" && !show} look={focus === "user" ? look : focus === "pass" ? (show ? { x: 0, y: 3 } : { x: 0, y: 0 }) : mouse} />
        <h1>Hello!</h1>
        <p className="sub">Sign in to your account</p>
        <form onSubmit={submit} autoComplete="off">
          <label className="field">
            <span>Username</span>
            <input name="login_user_x" value={user} onChange={(e) => { setUser(e.target.value); aim(e.target); }} onKeyUp={(e) => aim(e.target)} onClick={(e) => aim(e.target)} onSelect={(e) => aim(e.target)} onFocus={(e) => { setFocus("user"); aim(e.target); }} onBlur={() => setFocus("")} placeholder="Enter your username" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
          </label>
          <label className="field pw">
            <span>Password</span>
            <input name="login_pass_x" type={show ? "text" : "password"} value={pass} onChange={(e) => setPass(e.target.value)} onFocus={() => setFocus("pass")} onBlur={() => setFocus("")} placeholder="Enter your password" autoComplete="new-password" />
            <button type="button" className="eye" onMouseDown={(e) => e.preventDefault()} onFocus={() => setFocus("pass")} onBlur={() => setFocus("")} onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button>
          </label>
          <div className="row">
            <label className="remember"><input type="checkbox" defaultChecked /> Remember me</label>
            <a href="#signin">Forgot password?</a>
          </div>
          <button className="btn" disabled={busy}>Sign in</button>
          <div className="status" role="status">{status}</div>
        </form>
        <p className="foot">Don't have an account? <a href="#signin">Create</a></p>
      </section>
      </div>
    </main>
  );
}