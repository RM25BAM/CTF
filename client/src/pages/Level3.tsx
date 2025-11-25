import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Level3Video from "../assets/tres_commas.mp4";
import Level3VideoEnd from "../assets/TresCommaEnd.mp4";
const FLAG = "GGCAMP{cancelled_before_midnight}";
const START_SCORE = 200;
const SCORE_STEP = 10;
const SCORE_INTERVAL_MS = 60_000;
//SILICON VALLEY
const DEFAULT_CANCEL_B64 =
  "L2ludGVybmFsL2ludGVyc2l0ZS9jYW5jZWxcP3Rva2VuPXN1cGVyc2VjcmV0";

const DEFAULT_CONFIG = `{
  "purge_enabled": true,
  "cancel_endpoint_b64": "${DEFAULT_CANCEL_B64}",
  "verify_ssl": false,
  "dry_run": false
}`;

const Level3: React.FC = () => {
  const navigate = useNavigate();

  const [videoSeen, setVideoSeen] = useState<boolean>(() => {
    try {
      return localStorage.getItem("level3_intro_watched") === "1";
    } catch {
      return false;
    }
  });
  const [videoSeenExit, setVideoSeenExit] = useState<boolean>(() => {
    try {
      return localStorage.getItem("level3_end_watched") === "1";
    } catch {
      return false;
    }
  });
  const [showTerminal, setShowTerminal] = useState<boolean>(videoSeen);
  const [showEndVideo, setShowEndVideo] = useState<boolean>(false);


  const [lines, setLines] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIndex, setHistIndex] = useState<number | null>(null);


  const [showConfig, setShowConfig] = useState(false);
  const [configText, setConfigText] = useState(DEFAULT_CONFIG);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configApplied, setConfigApplied] = useState(false);
  const [resolvedEndpoint, setResolvedEndpoint] = useState<string | null>(null);

  const [score, setScore] = useState<number>(START_SCORE);
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<number | null>(null);


  const [purgeLog, setPurgeLog] = useState<string[]>([]);
  const [purgeLogReady, setPurgeLogReady] = useState(false);

  const [solved, setSolved] = useState(false);

  const viewRef = useRef<HTMLDivElement | null>(null);

  const addLines = (newLines: string | string[]) => {
    setLines(prev =>
      Array.isArray(newLines) ? [...prev, ...newLines] : [...prev, newLines]
    );
  };

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.scrollTop = viewRef.current.scrollHeight;
    }
  }, [lines]);

  const handleVideoEnd = () => {
    try {
      localStorage.setItem("level3_intro_watched", "1");
    } catch { }
    setVideoSeen(true);
    setTimeout(() => setShowTerminal(true), 250);
  };

  useEffect(() => {
    if (!showTerminal) return;
    addLines([
      "Pied Piper Incident Console [Intersite Purge]",
      "Keyboards: LOCKED by security policy.",
      "",
      "",
      "Type `help` to begin.",
      "",
    ]);
    startTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTerminal]);

  const startTimer = () => {
    if (timerRunning || solved) return;
    setTimerRunning(true);
    timerRef.current = window.setInterval(() => {
      setScore(prev => {
        const next = Math.max(0, prev - SCORE_STEP);
        addLines(`[timer] integrity degraded: ${next} pts`);
        return next;
      });
    }, SCORE_INTERVAL_MS);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerRunning(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const generatePurgeLog = () => {
    const entries: string[] = [];
    const users = ["pp_user_001", "pp_user_023", "premium_1337", "vip_0420", "anon_9999"];
    const cats = ["adult_content", "nsfw_archive", "legacy_backup", "cache_chunk"];
    for (let i = 0; i < 5000; i++) {
      const u = users[i % users.length];
      const c = cats[i % cats.length];
      const id = 1000 + i;
      entries.push(
        `[AUDIT] delete-ok id=${id} user=${u} bucket=${c} file="content_${id}.mp4" status=purged`
      );
    }
    const flagIndex = 10 + Math.floor(Math.random() * 40);
    entries[flagIndex] = `[AUDIT] sanitize-ok id=1337 user=premium_root note="marker:${FLAG}" trace=pp_cluster_7`;

    setPurgeLog(entries);
    setPurgeLogReady(true);

    addLines([
      "",
      "[system] purge job cancelled. generating wipe audit: purge.log",
      "[system] use `view purge.log` or `grep <pattern> purge.log` to analyze.",
      "",
    ]);
    addLines(entries.slice(-10));
  };

  const handleApplyConfig = () => {
    setConfigError(null);
    let parsed: any;
    try {
      parsed = JSON.parse(configText);
    } catch (e: any) {
      setConfigError("Invalid JSON: " + e.message);
      return;
    }

    if (parsed.purge_enabled !== false) {
      setConfigError("purge_enabled must be false to stop live purge.");
      return;
    }
    if (parsed.dry_run !== true) {
      setConfigError("dry_run should be true so any remaining actions are simulated.");
      return;
    }
    if (parsed.verify_ssl !== true) {
      setConfigError("verify_ssl should be true so the cancel request isn't spoofed.");
      return;
    }

    let endpoint: string | null = null;

    if (typeof parsed.cancel_endpoint === "string") {
      endpoint = parsed.cancel_endpoint;
    } else if (typeof parsed.cancel_endpoint_b64 === "string") {
      try {
        endpoint = atob(parsed.cancel_endpoint_b64);
      } catch {
        setConfigError("Failed to base64-decode cancel_endpoint_b64.");
        return;
      }
    }

    if (!endpoint) {
      setConfigError(
        "Config must define a cancel_endpoint or cancel_endpoint_b64 that decodes to a URL."
      );
      return;
    }

    if (!endpoint.startsWith("/internal/intersite/cancel")) {
      setConfigError("Decoded endpoint does not look like the internal cancel URL.");
      return;
    }

    setResolvedEndpoint(endpoint);
    setConfigApplied(true);
    setShowConfig(false);

    addLines([
      "",
      "[config] purge-config.json applied.",
      "[config] keyboard lock partially bypassed.",
      endpoint
        ? `[config] decoded cancel endpoint: ${endpoint}`
        : "[config] no endpoint decoded.",
      "",
      "You can now use: show endpoint, cancel <url>.",
      "",
    ]);
  };

  const runPostFlagFlow = () => {
    addLines(["", "OPEN CONSOLE!"]);
    console.log(`FINAL SCORE: ${scoreRef.current} - Yell it out`);
    console.log(
      "Yell it out  Vault-Tec Corp - run to drink station - you only have 60 seconds :)"
    );

    addLines([
      "",
      "FLAG ACCEPTED.",
      `Final Score: ${scoreRef.current} pts`,
      "Intersite lives. Somehow.",
      "",
      "You have 60 seconds before the next simulation kicks in...",
    ]);

    try {
      const existing = JSON.parse(localStorage.getItem("level_scores") || "[]");
      existing.push({
        level: 3,
        score: scoreRef.current,
        when: new Date().toISOString(),
      });
      localStorage.setItem("level_scores", JSON.stringify(existing));
    } catch {
      // ignore
    }

    setTimeout(() => {
      addLines([
        "",
        "Preparing next simulation environment...",
        "Transitioning to Level 4...",
      ]);
      navigate("/level4");
    }, 60_000);
  };

  const handleEndVideoDone = () => {
    setShowEndVideo(false);
    setVideoSeenExit(true);
    try {
      localStorage.setItem("level3_end_watched", "1");
    } catch { }
    runPostFlagFlow();
  };
  const handleCommand = (raw: string) => {
    const cmdLine = raw.trim();
    if (!cmdLine) return;

    addLines(`> ${cmdLine}`);
    setHistory(prev => [...prev, cmdLine]);
    setHistIndex(null);

    const parts = cmdLine.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd === "help") {
      addLines([
        "Commands:",
        "  help                     show this help",
        "  status                   show current integrity",
        "  config                   open purge-config.json editor",
        "  show endpoint            show decoded cancel endpoint",
        "  cancel <url>             send internal cancel request",
        "  view purge.log           print the purge log",
        "  grep <pattern> [file]    search purge.log for pattern",
        "  submit <flag>            submit recovered flag",
        "  clear                    clear screen",
        "",
        "Flow: fix config -> cancel purge -> analyze purge.log -> grep out the marker -> submit.",
      ]);
      return;
    }

    if (cmd === "status") {
      addLines([
        `INTEGRITY: ${scoreRef.current} pts`,
        `Purge: ${purgeLogReady ? "CANCELLED (audit log available)" : "ACTIVE"}`,
      ]);
      return;
    }

    if (cmd === "config") {
      setShowConfig(true);
      return;
    }

    if (cmd === "show") {
      if (args[0] === "endpoint") {
        if (!resolvedEndpoint) {
          addLines(["[config] no cancel endpoint resolved yet. Open `config` and apply."]);
        } else {
          addLines([`[config] cancel endpoint: ${resolvedEndpoint}`]);
        }
        return;
      }
      addLines(["show: unknown option (try: show endpoint)"]);
      return;
    }

    if (cmd === "cancel") {
      const url = args.join(" ");
      if (!url) {
        addLines(["cancel: missing URL (try: cancel <endpoint>)"]);
        return;
      }
      if (!resolvedEndpoint) {
        addLines([
          "cancel: no resolved endpoint from config.",
          "hint: open `config`, fix it, apply, then `show endpoint`.",
        ]);
        return;
      }
      if (url !== resolvedEndpoint) {
        addLines([
          "Sending request...",
          "Response: 403 Forbidden — wrong token or endpoint.",
          "hint: use the exact URL from `show endpoint`.",
        ]);
        return;
      }


      addLines([
        "Sending authenticated cancel request...",
        "Response: 200 OK — purge job stopped.",
        "Data blocks no longer being scheduled for deletion.",
      ]);

      if (!purgeLogReady) {
        generatePurgeLog();
      }
      return;
    }

    if (cmd === "view") {
      const target = args[0];
      if (!target) {
        addLines(["view: missing file (try: view purge.log)"]);
        return;
      }
      if (target !== "purge.log") {
        addLines([`view: ${target}: no such file in this console`]);
        return;
      }
      if (!purgeLogReady) {
        addLines(["view: purge.log not generated yet. Stop the purge first with `cancel`."]);
        return;
      }
      addLines(["--- purge.log ---", ...purgeLog, "--- end purge.log ---"]);
      return;
    }

    if (cmd === "grep") {
      if (!purgeLogReady) {
        addLines(["grep: purge.log not available. Cancel purge first."]);
        return;
      }
      const pattern = args[0];
      if (!pattern) {
        addLines(["grep: missing pattern (try: grep GGCAMP purge.log)"]);
        return;
      }
      const file = args[1];
      if (file && file !== "purge.log") {
        addLines([`grep: only purge.log is available here.`]);
        return;
      }
      const regexSafe = new RegExp(pattern, "i");
      const matches = purgeLog.filter(line => regexSafe.test(line));
      if (!matches.length) {
        addLines([`grep: no matches for '${pattern}' in purge.log`]);
      } else {
        addLines(["--- grep results ---", ...matches, "--- end results ---"]);
      }
      return;
    }

    if (cmd === "submit") {
      const candidate = args.join(" ");
      if (!candidate) {
        addLines(["submit: missing flag. Usage: submit GGCAMP{...}"]);
        return;
      }
      if (candidate === FLAG) {
        stopTimer();
        setSolved(true);


        if (!videoSeenExit) {
          setShowEndVideo(true);
          try {
            localStorage.setItem("level3_end_watched", "1");
          } catch { }
        } else {
          runPostFlagFlow();
        }
      } else {
        addLines(["submit: incorrect flag"]);
      }
      return;
    }

    if (cmd === "clear") {
      setLines([]);
      return;
    }

    addLines([`Unknown command: ${cmd} (type 'help')`]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const cur = input;
      setInput("");
      handleCommand(cur);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const next =
        histIndex === null ? history.length - 1 : Math.max(0, histIndex - 1);
      setHistIndex(next);
      setInput(history[next]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!history.length) return;
      if (histIndex === null) {
        setInput("");
        return;
      }
      const next = Math.min(history.length - 1, histIndex + 1);
      setHistIndex(next);
      setInput(history[next] ?? "");
      return;
    }
  };

  if (!showTerminal) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        {Level3Video ? (
          <video
            src={Level3Video as unknown as string}
            className="w-full h-full object-cover"
            autoPlay
            onEnded={handleVideoEnd}
          />
        ) : (
          <div className="text-center text-white p-8">
            <p className="text-xl mb-4">
              Missing tres_commas.mp4 in src/assets/.
            </p>
            <button
              onClick={() => {
                setVideoSeen(true);
                setShowTerminal(true);
              }}
              className="px-4 py-2 bg-emerald-400 text-black rounded"
            >
              Skip video
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="w-full h-screen bg-black text-green-200 font-mono flex flex-col relative">
      <div className="px-3 py-1 text-xs text-gray-400 flex justify-between border-b border-green-900 bg-black">
        <span>Pied Piper Incident Intersite Purge</span>
        <span>INTEGRITY: {scoreRef.current} pts</span>
      </div>
      <div className="flex-1 p-3">
        <div
          ref={viewRef}
          className="w-full h-full bg-black border border-green-900 rounded p-3 text-xs overflow-auto whitespace-pre-wrap"
        >
          {lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
      <div className="px-3 pb-3 flex items-center gap-2">
        <span className="text-emerald-400 text-sm">&gt;</span>
        <input
          className="flex-1 bg-black border border-green-900 rounded px-3 py-2 text-xs text-green-200 outline-none"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="Type a command (help / config / status / show endpoint / cancel / view purge.log / grep / submit)"
        />
      </div>
      {showConfig && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="w-[90%] max-w-2xl bg-black border border-green-800 rounded shadow-xl">
            <div className="flex items-center justify-between px-3 py-1 border-b border-green-800 bg-black">
              <span className="text-xs text-green-300">
                C:\pp\config\purge-config.json
              </span>
              <button
                onClick={() => setShowConfig(false)}
                className="text-xs px-2 py-1 border border-green-700 rounded bg-black hover:bg-green-900/30"
              >
                Close
              </button>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-[11px] text-green-400">
                Fix this so Intersite stops happily deleting production data.
              </p>
              <textarea
                value={configText}
                onChange={e => setConfigText(e.target.value)}
                className="w-full h-56 bg-black text-xs text-green-200 font-mono border border-green-800 rounded p-2 resize-none"
              />
              {configError && (
                <div className="text-[11px] text-red-400 whitespace-pre-wrap">
                  {configError}
                </div>
              )}
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-green-500">
                  Hints: Check which value should be true or false? Do I need this ase64 encryption?
                </span>
                <button
                  onClick={handleApplyConfig}
                  className="px-3 py-1 text-xs bg-emerald-400 text-black font-semibold rounded hover:bg-emerald-300"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEndVideo && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-[60]">
          {Level3Video ? (
            <video
              src={Level3VideoEnd as unknown as string}
              className="w-full h-full object-cover"
              autoPlay
              onEnded={handleEndVideoDone}
            />
          ) : (
            <div className="text-center text-white p-8">
              <p className="text-xl mb-4">
                Missing tres_commas.mp4 outro in src/assets/.
              </p>
              <button
                onClick={handleEndVideoDone}
                className="px-4 py-2 bg-emerald-400 text-black rounded"
              >
                Skip outro
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default Level3;
