// src/Home.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Marquee from "react-fast-marquee";
import Logo from "./assets/gdg_logo.png";

type Popup = {
  id: number;
  title: string;
  body: string;
  severity?: "info" | "warn" | "critical";
  left: number;
  top: number;
  ttl: number;
};

const TEMPLATES = [
  { title: "INTRUSION", body: "Unauthorized token used from 10.42.32.11", severity: "warn" },
  { title: "SECURITY", body: "FLAG LEAK DETECTED: /level3", severity: "critical" },
  { title: "ALERT", body: "SSH auth failed x11 from 10.11.11.11", severity: "warn" },
  { title: "WARNING", body: "CI pipeline pushed secrets to /public", severity: "critical" },
  { title: "NOTICE", body: "Process crash detected: pid 4211", severity: "info" },
  { title: "SPOOF", body: "Suspicious UA: sqlmap/1.6", severity: "warn" },
  { title: "BREACH", body: "Suspicious GET /logs/whisper.log", severity: "warn" },
  { title: "ROOT", body: "Root shell spawned: /bin/???", severity: "critical" },
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const extraStyles = `
@keyframes glitch {
  0% { transform: translate(0,0) skewX(0deg); opacity:1; }
  20% { transform: translate(-2px,1px) skewX(-1deg); opacity:0.9; }
  40% { transform: translate(2px,-1px) skewX(1deg); opacity:0.8; }
  60% { transform: translate(-1px,2px) skewX(-0.5deg); opacity:0.9; }
  80% { transform: translate(1px,-2px) skewX(0.5deg); opacity:0.95; }
  100% { transform: translate(0,0) skewX(0deg); opacity:1; }
}
@keyframes shake {
  0% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
  100% { transform: translateX(0); }
}
`;

/* Live terminal log component (full-width bottom) */
const LiveTerminal: React.FC<{ linesLimit?: number }> = ({ linesLimit = 120 }) => {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    const templates = [
      "auth failed from {ip}",
      "suspicious user-agent: {ua}",
      "404 on {path}",
      "FLAG_LEAK DETECTED: {hint}",
      "process crash: pid {n}",
      "unauthorized token used from {ip}",
      "ci: pushed to /public",
      "watcher: file changed /static/js/bundle.js",
      "root: /bin/sh spawned by 1000",
    ];
    const getIp = () => `10.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`;
    const getUa = () => ["curl/7.68", "Mozilla/5.0", "python-requests/2.31", "sqlmap/1.6"][rand(0, 3)];
    const getPath = () => ["/public/info.txt", "/admin", "/api/debug", "/static/js/bundle.js"][rand(0, 3)];
    const getHint = () => ["maybe /level3", "check bundle", "robots.txt", "look in console"][rand(0, 3)];

    const id = setInterval(() => {
      const tmpl = templates[rand(0, templates.length - 1)];
      const line = tmpl
        .replace("{ip}", getIp())
        .replace("{ua}", getUa())
        .replace("{path}", getPath())
        .replace("{n}", String(rand(100, 9999)))
        .replace("{hint}", getHint());
      setLines(prev => {
        const next = [...prev, `[${new Date().toLocaleTimeString()}] ${line}`];
        return next.length > linesLimit ? next.slice(next.length - linesLimit) : next;
      });
    }, 700 + rand(0, 400));

    return () => clearInterval(id);
  }, [linesLimit]);

  return (
    <div className="w-full bg-black/90 text-green-300 font-mono text-[12px] leading-5 p-3 overflow-y-auto">
      {lines.map((l, i) => (
        <div key={i} className="whitespace-pre">{l}</div>
      ))}
    </div>
  );
};

export default function Home() {
  const [popups, setPopups] = React.useState<Popup[]>([]);
  const popupId = React.useRef(1);
  const [glitch, setGlitch] = React.useState(false);
  const [shake, setShake] = React.useState(false);
  const [firewallShown, setFirewallShown] = React.useState(false);
  const [paidFlowActive, setPaidFlowActive] = React.useState(false);
  const navigate = useNavigate();

  // spawn chaotic popups frequently and toggle glitch/shake randomly
  useEffect(() => {
    const spawnPopup = () => {
      const t = TEMPLATES[rand(0, TEMPLATES.length - 1)];
      const p: Popup = {
        id: popupId.current++,
        title: t.title,
        body: t.body,
        severity: t.severity,
        left: rand(6, 80),
        top: rand(8, 70),
        ttl: 2200 + rand(0, 4200),
      };
      setPopups(prev => [...prev, p]);
      setTimeout(() => setPopups(prev => prev.filter(x => x.id !== p.id)), p.ttl);
    };

    // ramp: start calm then escalate
    const initial = setTimeout(spawnPopup, 600);
    const id = setInterval(spawnPopup, 1200 + rand(0, 1200));

    // glitch / shake randomizer
    const g = setInterval(() => {
      if (Math.random() < 0.28) setGlitch(true);
      if (Math.random() < 0.12) setShake(true);
      // auto clear after short bursts
      setTimeout(() => setGlitch(false), 900 + rand(0, 200));
      setTimeout(() => setShake(false), 700 + rand(0, 200));
    }, 900);
    const firewallTimer = setTimeout(() => setFirewallShown(true), 9000 + rand(0, 6000));

    return () => {
      clearInterval(id);
      clearInterval(g);
      clearTimeout(initial);
      clearTimeout(firewallTimer);
    };
  }, []);

  // console easter egg
  useEffect(() => {
    const id = setInterval(() => {
      const opened = window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 120;
      if (opened) {
        console.log("%cYou opened devtools. We left breadcrumbs. ~", "color: #ff6b6b; font-size:13px;");
      }
    }, 800);
    return () => clearInterval(id);
  }, []);

  // when user "buys" firewall (fake) -> go to /level1
  const handleFakePurchase = () => {
    setPaidFlowActive(true);
    // short faux processing animation, then navigate
    setTimeout(() => {
      navigate("/level0");
    }, 1900);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gray-900 text-gray-100 relative ${glitch ? "animate-[glitch_0.9s_linear_1]" : ""}`}>
      <style>{extraStyles}</style>

      {/* header */}
      <header className="bg-gray-900 border-b border-b-gray-700 z-30">
        <div className="flex items-center justify-center gap-4 py-3">
          <img className="w-12 h-12 object-contain" src={Logo} alt="Logo" />
          <h1 className={`text-2xl font-semibold ${glitch ? "opacity-90" : "opacity-100"}`}>
            Google Developer Groups on Campus
          </h1>
        </div>
      </header>

      <Marquee autoFill speed={70} className="bg-amber-300 text-black p-2 z-10">
        <h1 className="mx-2">&nbsp;GOOGLE DEVELOPER GROUPS ON CAMPUS&nbsp;</h1>
        <h1 className="mx-2 font-extrabold">&nbsp;SYSTEM BREACH&nbsp;</h1>
        <h1 className="mx-2">&nbsp;CAPTURE THE FLAG&nbsp;</h1>
        <h1 className="mx-2 font-black">&nbsp;CAMPUS MELTDOWN&nbsp;</h1>
        <h1 className="mx-2">NOVEMBER 25, 2025&nbsp;</h1>
        <h1 className="mx-2 font-extrabold">&nbsp;PROCEED WITH CAUTION&nbsp;</h1>
      </Marquee>

      {/* central content */}
      <main className={`flex-1 p-6 mt-10 ${shake ? "animate-[shake_0.7s_linear_1]" : ""}`}>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-md p-4 bg-gradient-to-r from-slate-800/60 to-slate-700/30 border border-white/5">
            <p className="text-lg">
              Welcome! Start with <strong>Capture the Flag</strong> to learn basics web security techniques.
            </p>
            {/* Sopranos -> silicon valley -> fallout -> Rick and Morty  */}
            <ul className="mt-4 space-y-2">
              <li>
                <button
                  className={`px-3 py-2 rounded-md w-full text-left ${paidFlowActive ? "bg-amber-400 text-black" : "bg-gray-800/40 text-gray-400 cursor-not-allowed"}`}
                  disabled={!paidFlowActive}
                >
                  Level 1
                </button>
              </li>
              <li>
                <button className="px-3 py-2 rounded-md w-full text-left bg-gray-800/40 text-gray-400 cursor-not-allowed" disabled>
                  Level 2
                </button>
              </li>
              <li>
                <button className="px-3 py-2 rounded-md w-full text-left bg-gray-800/40 text-gray-400 cursor-not-allowed" disabled>
                  Level 3
                </button>
              </li>
              <li>
                <button className="px-3 py-2 rounded-md w-full text-left bg-gray-800/40 text-gray-400 cursor-not-allowed" disabled>
                  Level 4
                </button>
              </li>
              <li>
                <button className="px-3 py-2 rounded-md w-full text-left bg-gray-800/40 text-gray-400 cursor-not-allowed" disabled>
                  Level 5
                </button>
              </li>
            </ul>

            <p className="mt-4 text-sm text-gray-400">
              {!paidFlowActive ? "Ready to play?" : "Hahaha Don't trust anyone!"}
            </p>
          </div>
        </div>
      </main>

      {/* fake 'system alert' banner */}
      <div className="absolute left-1/2 -translate-x-1/2 top-30 z-40 px-3 py-1 rounded-md text-white font-mono font-semibold shadow-lg"
        style={{ background: "linear-gradient(90deg, rgba(180,20,20,0.95), rgba(120,10,10,0.9))", border: "1px solid rgba(255,255,255,0.04)" }}>
        SYSTEM ALERT: INTRUSION DETECTED — PARTIAL SERVICE COMPROMISE
      </div>

      {/* popups */}
      {popups.map(p => (
        <div
          key={p.id}
          className={`absolute z-50 rounded-xl p-3 shadow-2xl border ${p.severity === "critical" ? "bg-red-800 text-white border-red-900" : p.severity === "warn" ? "bg-yellow-400 text-black border-amber-800" : "bg-sky-700 text-white border-sky-900"}`}
          style={{ left: `${p.left}%`, top: `${p.top}%`, transform: "translate(-10%, -10%)", minWidth: 350, maxWidth: 500, cursor: "pointer" }}
          onClick={() => setPopups(prev => prev.filter(x => x.id !== p.id))}
        >
          <div className="flex justify-between items-start">
            <strong className="tracking-wide">{p.title}</strong>
            <small className="opacity-80 text-xs">{new Date().toLocaleTimeString()}</small>
          </div>
          <div className="mt-2 text-sm">{p.body}</div>
          <div className="mt-2 text-right italic text-xs opacity-80">click to dismiss</div>
        </div>
      ))}

      {firewallShown && !paidFlowActive && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative z-70 max-w-xl w-[92%] mx-auto p-6 rounded-xl bg-gradient-to-br from-gray-900 to-slate-800 border border-white/5 shadow-2xl">
            <h2 className="text-2xl font-bold text-amber-300">SET UP PREMIUM FIREWALL</h2>
            <p className="mt-3 text-gray-300">Your system is critically exposed. Install the official campus <strong>Premium Firewall</strong> to secure leaks and proceed to the diagnostic console.</p>

            <div className="mt-4 flex gap-3">
              <button
                className="px-4 py-2 rounded-md bg-amber-400 text-black font-semibold"
                onClick={() => handleFakePurchase()}
              >
                Purchase & Activate
              </button>
              <button className="px-4 py-2 rounded-md bg-gray-800 text-gray-300 border" onClick={() => setFirewallShown(false)}>
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {paidFlowActive && (
        <div className="fixed inset-0 z-70 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative z-80 p-6 rounded-lg bg-linear-to-br from-slate-800 to-gray-900 border border-white/5 text-center">
            <div className="mb-4 text-amber-300 font-mono">PROCESSING...</div>
            <div className="w-60 h-3 bg-gray-700 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-amber-400 animate-[progress_1.8s_linear_1]" style={{ width: "100%" }} />
            </div>
          </div>
        </div>
      )}
      <footer className="fixed left-0 right-0 bottom-0 z-40 border-t border-white/5">
        <LiveTerminal />
      </footer>
    </div>
  );
}
