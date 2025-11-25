// src/pages/Level4.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// Put your media in src/assets or change these imports
import IntroVideo from "../assets/fallout-intro.mp4";
import Song from "../assets/fallout.mp3";
import Geiger from "../assets/geiger_click.mp3";

/**
 * Level4: Fallout — Vault-Tec mainframe
 *
 * Mechanics:
 * - Intro video (optional)
 * - Fullscreen terminal
 * - Contamination score starts at START_SCORE and decays every RAD_INTERVAL_MS by RAD_STEP
 * - Commands: help, status, scan, view vault_logs.bak, grep, brute, reroute, repair, submit, clear, script
 * - Reroute puzzle: players must enter the correct hex sequence shown in pieces
 * - Brute reveals fragments faster but increases contamination (very limited)
 * - After correct reroute + repair, vault_logs.bak becomes searchable and flag can be discovered
 */

const FLAG = "GGCAMP{vaults_keep_their_sins}";
const START_SCORE = 200;
const RAD_STEP = 10; // contamination increase step (affects score decay)
const RAD_INTERVAL_MS = 45_000; // every 45s contamination event (you can tune)
const BRUTE_CONTAMINATION_PENALTY = 15;

const DEFAULT_LOG_LINES = 4000; // simulated line count

// Utility: random int
const rint = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Browser-safe string -> hex
const toHex = (str: string) =>
  Array.from(str)
    .map(c => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");

// Build fake corrupted logs with embedded hex fragments of the flag
const makeCorruptedLogs = (_flag: string) => {
  const users = [
    "vault_op_11",
    "vault_med_07",
    "vault_tech_04",
    "settler_01",
    "engineer_42",
  ];
  const buckets = ["rad_mon", "eco_backup", "compliance", "food_ration"];
  const lines: string[] = [];

  for (let i = 0; i < DEFAULT_LOG_LINES; i++) {
    const id = 100000 + i;
    const u = users[i % users.length];
    const b = buckets[i % buckets.length];

    if (i % 137 === 0) {
      // hex-ish fragment
      const hexfrag = toHex(`${id}-${u}-${b}`).slice(0, 20);
      lines.push(
        `[CORRUPT] id=${id} fragment=0x${hexfrag} note="partial: ${hexfrag.slice(
          0,
          12
        )}..."`
      );
    } else {
      lines.push(
        `[AUDIT] vault_del id=${id} user=${u} bucket=${b} file="bin_${id}.dat" status=obliterated`
      );
    }
  }

  // Put scrambled pieces of the flag in several "dat" fragments
  const pieces = [
    toHex("GGCAMP{"),
    toHex("vaults_keep"),
    toHex("_their_sins"),
    toHex("}"),
  ];

  const baseIndex = 20 + rint(30, 400);
  lines[baseIndex] =
    `[AUDIT] salvage id=1337 user=vault_curator note="fragA:${pieces[0]}:chunk"`;
  lines[baseIndex + 7] =
    `[AUDIT] salvage id=1344 user=vault_curator note="fragB:${pieces[1]}:chunk"`;
  lines[baseIndex + 21] =
    `[AUDIT] salvage id=1365 user=vault_curator note="fragC:${pieces[2]}:chunk"`;
  lines[baseIndex + 29] =
    `[AUDIT] salvage id=1377 user=vault_curator note="fragD:${pieces[3]}:chunk"`;

  // hint line
  lines[baseIndex + 3] =
    `[HINT] vault_logs.bak contains hex fragments. ASCII -> hex -> glue -> flag. "the world ended, but compliance reports didn’t."`;

  return lines;
};

const Level4: React.FC = () => {
  const navigate = useNavigate();

  // video / stage
  const [introSeen, setIntroSeen] = useState<boolean>(() => {
    try {
      return localStorage.getItem("level4_intro_watched") === "1";
    } catch {
      return false;
    }
  });
  const [showTerminal, setShowTerminal] = useState<boolean>(introSeen);
  const [showSong, setShowSong] = useState(true);

  // terminal state
  const [lines, setLines] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIndex, setHistIndex] = useState<number | null>(null);
  const viewRef = useRef<HTMLDivElement | null>(null);

  // contamination / score
  const [score, setScore] = useState<number>(START_SCORE);
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const [contamination, setContamination] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  // puzzle state
  const [logs] = useState<string[]>(() => makeCorruptedLogs(FLAG));
  const [vaultLogReady, setVaultLogReady] = useState(false);
  const [rerouteState, setRerouteState] = useState<{
    stage: "locked" | "partial" | "open";
    requiredSequence?: string[];
    revealed?: string[];
  }>({ stage: "locked", revealed: [] });

  // salvage / brute usage state
  const [salvageRequired] = useState<number>(() => rint(6, 20)); // random 6–20
  const [salvageActions, setSalvageActions] = useState<number>(0); // scan + brute total
  const [bruteCount, setBruteCount] = useState<number>(0); // brute uses (max 2)

  // audio refs
  const songRef = useRef<HTMLAudioElement | null>(null);
  const geigerRef = useRef<HTMLAudioElement | null>(null);

  const append = (s: string | string[]) =>
    setLines(prev => (Array.isArray(s) ? [...prev, ...s] : [...prev, s]));

  // 🔊 helper: pause background song, play geiger, then resume
  const playGeigerEffect = () => {
    const song = songRef.current;
    const geiger = geigerRef.current;
    if (!geiger) return;

    const wasPlaying = !!song && !song.paused;

    if (song && wasPlaying) {
      song.pause();
    }

    geiger.currentTime = 0;
    geiger
      .play()
      .then(() => {
        geiger.onended = () => {
          geiger.onended = null;
          if (song && wasPlaying && showSong) {
            song.play().catch(() => { });
          }
        };
      })
      .catch(() => {
        if (song && wasPlaying && showSong) {
          song.play().catch(() => { });
        }
      });
  };

  useEffect(() => {
    if (viewRef.current) viewRef.current.scrollTop = viewRef.current.scrollHeight;
  }, [lines]);

  useEffect(() => {
    if (!showTerminal) return;

    append([
      "VAULT-TEC MAINFRAME [Retro-Terminal v1952]",
      "ENV: POST-APOCALYPTIC CORPORATE MELTDOWN",
      "",
      "OBJECTIVE:",
      "  - Recover the hidden vault compliance flag from vault_logs.bak",
      "  - Then submit it using: submit GGCAMP{...}",
      "",
      "SUGGESTED SEQUENCE:",
      "  1) type 'help' to see all commands",
      "  2) run 'reroute' to unlock the power routing puzzle",
      "  3) use 'scan' / limited 'brute' to uncover corrupted hex fragments",
      "  4) power-users: automate salvage with 'script scan 100'",
      "  5) once enough salvage cycles have run, use 'repair' to reconstruct the flag fragments",
      "  6) use 'grep GGCAMP vault_logs.bak' to search for the flag",
      "  7) submit the flag with 'submit GGCAMP{vaults_keep_their_sins}'",
      "",
      'HINT: salvage requires multiple cycles; brute-force is strictly limited.',
      "",
      'HINT: "the world ended, but compliance reports didn’t."',
      "",
      "Type 'help' for commands.",
      "",
    ]);

    if (showSong && songRef.current && songRef.current.paused) {
      songRef.current.loop = true;
      songRef.current
        .play()
        .catch(() => { });
    }

    startContaminationTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTerminal]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const startContaminationTimer = () => {
    if (timerRef.current) return;
    timerRef.current = window.setInterval(() => {
      setContamination(c => {
        const next = c + RAD_STEP;
        setScore(s => Math.max(0, s - RAD_STEP));
        append(`[RAD] contamination rising: +${RAD_STEP} (score -${RAD_STEP})`);
        playGeigerEffect();
        return next;
      });
    }, RAD_INTERVAL_MS);
  };

  const stopContaminationTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleIntroEnded = () => {
    try {
      localStorage.setItem("level4_intro_watched", "1");
    } catch { }
    setIntroSeen(true);
    setShowTerminal(true);
    if (showSong && songRef.current) {
      songRef.current.currentTime = 0;
      songRef.current.loop = true;
      songRef.current.play().catch(() => { });
    }
  };

  const handleCommand = (raw: string) => {
    const line = raw.trim();
    if (!line) return;
    append(`> ${line}`);
    setHistory(h => [...h, line]);
    setHistIndex(null);

    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd === "help") {
      append([
        "Commands:",
        "  help                       show this help",
        "  status                     show score + contamination + fragments",
        "  scan                       scan for corrupted fragments (low reveal)",
        "  brute                      attempt brute-force recovery (fast, raises contamination, VERY limited)",
        "  reroute                    start reroute power puzzle (must solve to stabilize vault)",
        "  repair                     attempt to repair/merge fragments (after enough salvage cycles)",
        "  view vault_logs.bak        print the audit log tail (very large)",
        "  grep <pattern> vault_logs.bak   search logs for pattern (hex or ascii)",
        "  script scan <n>            run 'scan' n times (automation)",
        "  submit <flag>              submit the recovered flag",
        "  clear                      clear console",
      ]);
      return;
    }

    if (cmd === "status") {
      const fragmentsCount = Math.min(
        4,
        rerouteState.revealed ? rerouteState.revealed.length : 0
      );
      append([
        `INTEGRITY: ${scoreRef.current} pts`,
        `CONTAMINATION: ${contamination} units`,
        `FRAGMENTS FOUND: ${fragmentsCount}/4`,
        `SALVAGE CYCLES: ${salvageActions}/${salvageRequired} (scan + brute)`,
        `BRUTE ATTEMPTS: ${bruteCount}/2`,
      ]);
      return;
    }

    // SCRIPT COMMAND: automate multiple scans
    if (cmd === "script") {
      const sub = args[0]?.toLowerCase();
      if (sub !== "scan") {
        append([
          "script: only 'scan' is scriptable in this terminal.",
          "usage: script scan <count>",
        ]);
        return;
      }
      const countRaw = args[1];
      const count = Number(countRaw);
      if (!countRaw || Number.isNaN(count) || count <= 0) {
        append(["script: invalid count. usage: script scan <positive_number>"]);
        return;
      }

      const capped = Math.min(count, 1000); // safety cap
      append([
        `script: running 'scan' ${capped} time(s)...`,
        "script: this may spam the terminal — that's expected.",
        "",
      ]);

      for (let i = 0; i < capped; i++) {
        handleCommand("scan");
      }
      append(["script: completed scripted scans."]);
      return;
    }

    if (cmd === "scan") {
      const revealed = rerouteState.revealed ? [...rerouteState.revealed] : [];

      const nextSalvage = salvageActions + 1;

      if (revealed.length >= 4) {
        setSalvageActions(nextSalvage);
        append([
          "scan: no additional core fragments found.",
          `scan: salvage cycle recorded (${nextSalvage}/${salvageRequired}).`,
        ]);
        return;
      }

      const fragLines = logs.filter(l => /frag[ABCD]:/.test(l));
      const tokens: string[] = [];

      for (const line of fragLines) {
        const m = line.match(/frag[A-D]:(.*?):/);
        if (m && m[1]) tokens.push(m[1]);
      }

      const newlyRevealed: string[] = [];

      for (const token of tokens) {
        if (!revealed.includes(token)) {
          revealed.push(token);
          newlyRevealed.push(token);
          if (newlyRevealed.length >= 2) break;
        }
      }

      if (!newlyRevealed.length) {
        const idx = rint(0, logs.length - 1);
        const logLine = logs[idx];
        const hexMatches = logLine.match(/[0-9a-f]{8,}/i);
        if (hexMatches && !revealed.includes(hexMatches[0])) {
          revealed.push(hexMatches[0]);
          newlyRevealed.push(hexMatches[0]);
        }
      }

      setRerouteState(s => ({ ...s, revealed }));
      setSalvageActions(nextSalvage);

      if (newlyRevealed.length) {
        append([
          `scan: recovered core fragments -> ${newlyRevealed.join(", ")}`,
          `scan: salvage cycle recorded (${nextSalvage}/${salvageRequired}).`,
          "",
        ]);
      } else {
        append([
          "scan: found nothing unusual.",
          `scan: salvage cycle recorded (${nextSalvage}/${salvageRequired}).`,
        ]);
      }

      return;
    }

    if (cmd === "brute") {
      // Enforce brute limit: max 2 times
      if (bruteCount >= 2) {
        append([
          "brute: maximum brute-force attempts reached (2/2).",
          "brute: SYSTEM WARNING — brute interface in lockdown.",
          "brute: further brute attempts disabled. Use 'scan' or 'script scan <n>' to continue salvage.",
        ]);
        return;
      }

      const nextBrute = bruteCount + 1;
      const nextSalvage = salvageActions + 1;

      append([
        "brute: starting brute-force salvage (this will raise contamination) ...",
        `brute: WARNING — brute is strictly limited (${nextBrute}/2 uses).`,
      ]);

      const revealed = rerouteState.revealed ? [...rerouteState.revealed] : [];
      const newFrags: string[] = [];
      for (let i = 0; i < 2; i++) {
        const idx = rint(0, logs.length - 1);
        const hexMatches = logs[idx].match(/[0-9a-f]{8,}/i);
        if (hexMatches && !revealed.includes(hexMatches[0])) {
          revealed.push(hexMatches[0]);
          newFrags.push(hexMatches[0]);
        }
      }
      setRerouteState(s => ({ ...s, revealed }));

      setContamination(c => {
        const next = c + BRUTE_CONTAMINATION_PENALTY;
        setScore(s => Math.max(0, s - BRUTE_CONTAMINATION_PENALTY));
        append([
          `brute: contamination +${BRUTE_CONTAMINATION_PENALTY} (score -${BRUTE_CONTAMINATION_PENALTY})`,
        ]);
        playGeigerEffect();
        return next;
      });

      setBruteCount(nextBrute);
      setSalvageActions(nextSalvage);

      if (newFrags.length) {
        append([
          `brute: recovered fragments -> ${newFrags.join(", ")}`,
          `brute: salvage cycle recorded (${nextSalvage}/${salvageRequired}).`,
        ]);
      } else {
        append([
          "brute: no new fragments recovered.",
          `brute: salvage cycle recorded (${nextSalvage}/${salvageRequired}).`,
        ]);
      }
      return;
    }

    if (cmd === "reroute") {
      if (rerouteState.stage === "open") {
        append(["reroute: power has already been routed. Vault stable."]);
        return;
      }
      const fragLines = logs.filter(l => /frag[ABCD]:/.test(l));
      if (fragLines.length >= 4) {
        const seq = fragLines
          .slice(0, 4)
          .map(l => {
            const m = l.match(/frag[A-D]:(.*?):/);
            return m ? m[1].slice(0, 12) : null;
          })
          .filter(Boolean) as string[];
        setRerouteState({
          stage: "partial",
          requiredSequence: seq,
          revealed: [],
        });
        append([
          "reroute: power distribution panel unlocked (partial).",
          "reroute: a sequence of 4 hex tokens must be entered in order to complete reroute.",
          "reroute: use `scan` / `brute` to recover hex fragments, then `reroute <token1> <token2> <token3> <token4>`.",
        ]);
      } else {
        const fallback: string[] = [];
        for (let i = 0; i < 4; i++) {
          const idx = rint(0, logs.length - 1);
          const m = logs[idx].match(/[0-9a-f]{8,}/i);
          fallback.push(m ? m[0].slice(0, 12) : `deadbeef${i}`);
        }
        setRerouteState({
          stage: "partial",
          requiredSequence: fallback,
          revealed: [],
        });
        append([
          "reroute: power distribution panel unlocked (partial).",
          "reroute: system requires 4 hex tokens. Use `scan` or `brute` to recover fragments, then `reroute t1 t2 t3 t4`.",
        ]);
      }
      return;
    }

    if (cmd === "repair") {
      const salvageCycles = scanCount + bruteCount;
      const ids = ["A", "B", "C", "D"];

      // 1) Optional: still require enough salvage cycles
      if (salvageCycles < coreRevealThreshold) {
        append([
          "repair: system integrity routines incomplete.",
          `repair: additional salvage cycles required (${salvageCycles}/${coreRevealThreshold}).`,
          "repair: keep using 'scan', 'script scan <n>' and limited 'brute' until threshold is reached.",
        ]);
        return;
      }

      // 2) Make sure we actually have all 4 fragments
      const missing = ids.filter(id => !fragmentsFound[id]);
      if (missing.length) {
        append([
          `repair: insufficient core fragments recovered (${ids.length - missing.length}/4).`,
          `repair: missing fragments: ${missing.join(", ")}.`,
          "repair: keep using scan / brute until all 4 core fragments are found.",
        ]);
        return;
      }

      // 3) Build the token list
      // If the user typed: repair <t1> <t2> <t3> <t4>, prefer those.
      // Otherwise use the stored fragments A/B/C/D in order.
      let tokens: string[];
      if (args.length >= 4) {
        tokens = args.slice(0, 4);
      } else {
        tokens = ids.map(id => fragmentsFound[id]);
      }

      const hexAll = tokens.join("");

      try {
        const bytes = hexAll.match(/.{1,2}/g)?.map(h => parseInt(h, 16));
        const ascii = bytes?.map(bv => String.fromCharCode(bv)).join("") ?? "";

        if (ascii.includes("GGCAMP")) {
          append([
            "repair: fragments merged. vault stability increased.",
            `repair: recovered ascii snippet -> ${ascii}`,
          ]);

          setVaultLogReady(true);
          setContamination(c => Math.max(0, c - 20));
          setScore(s => s + 10);
          stopContaminationTimer();

          return;
        } else {
          append([
            "repair: fragments did not reconstruct a valid flag.",
            `repair: reconstructed ascii -> ${ascii || "[empty]"}`,
          ]);
          return;
        }
      } catch {
        append(["repair: error while reconstructing fragments."]);
        return;
      }
    }

    if (cmd === "view") {
      const target = args.join(" ");
      if (!target) {
        append(["view: missing file (try: view vault_logs.bak)"]);
        return;
      }
      if (target !== "vault_logs.bak" && target !== "vault_logs") {
        append([`view: ${target}: no such file`]);
        return;
      }
      append(["--- vault_logs.bak (tail) ---"]);
      const tail = logs.slice(-20);
      append(tail);
      append(["--- end tail ---"]);
      return;
    }

    if (cmd === "grep") {
      const pattern = args[0];
      if (!pattern) {
        append(["grep: missing pattern (try: grep GGCAMP vault_logs.bak)"]);
        return;
      }
      if (!vaultLogReady) {
        append([
          "grep: vault_logs.bak is corrupted / not recovered. Try repair after collecting fragments.",
        ]);
        return;
      }
      const regex = new RegExp(pattern, "i");
      const matches = logs.filter(l => regex.test(l));
      if (!matches.length) {
        append([`grep: no matches for '${pattern}'`]);
      } else {
        append([
          "--- grep results ---",
          ...matches.slice(0, 50),
          "--- end results ---",
        ]);
      }
      return;
    }

    if (cmd === "submit") {
      const candidate = args.join(" ");
      if (!candidate) {
        append(["submit: missing flag. Usage: submit GGCAMP{...}"]);
        return;
      }
      if (candidate === FLAG) {
        stopContaminationTimer();
        append(["", "FLAG ACCEPTED. Vault stabilized... for now."]);
        append([`Final Score: ${scoreRef.current} pts`]);
        try {
          const existing = JSON.parse(
            localStorage.getItem("level_scores") || "[]"
          );
          existing.push({
            level: 4,
            score: scoreRef.current,
            when: new Date().toISOString(),
          });
          localStorage.setItem("level_scores", JSON.stringify(existing));
        } catch {
          // ignore
        }
        append(["You will be transitioned to Level 5 in 20 seconds..."]);
        setTimeout(() => navigate("/level5"), 20_000);
      } else {
        append(["submit: incorrect flag"]);
      }
      return;
    }

    if (cmd === "clear") {
      setLines([]);
      return;
    }

    append([`Unknown command: ${cmd}. Try 'help'.`]);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  // Intro video stage
  if (!showTerminal) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        {IntroVideo ? (
          <video
            src={IntroVideo as unknown as string}
            className="w-full h-full object-cover"
            autoPlay
            onEnded={handleIntroEnded}
            controls={false}
          />
        ) : (
          <div className="text-white p-8 text-center">
            <div className="text-2xl mb-4">VAULT-TEC: INCOMING TRANSMISSION</div>
            <div className="mb-6">(intro video missing — skipping)</div>
            <button
              onClick={() => {
                setIntroSeen(true);
                setShowTerminal(true);
              }}
              className="px-4 py-2 bg-amber-400 text-black rounded"
            >
              Skip Intro
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="w-full h-screen bg-black text-green-200 font-mono flex flex-col">
      {/* hidden audio elements */}
      <audio ref={songRef} src={Song as unknown as string} />
      <audio ref={geigerRef} src={Geiger as unknown as string} />

      {/* top bar */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-green-900">
        <div className="text-xs text-green-300">VAULT-TEC MAINFRAME — Terminal</div>
        <div className="text-xs text-green-300">
          INTEGRITY: {scoreRef.current} pts
        </div>
      </div>

      {/* terminal */}
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

      {/* input */}
      <div className="px-3 pb-3 flex items-center gap-2">
        <span className="text-emerald-400 text-sm">&gt;</span>
        <input
          className="flex-1 bg-black border border-green-900 rounded px-3 py-2 text-xs text-green-200 outline-none"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          autoFocus
          placeholder="Type command (help / scan / script / brute / reroute / repair / view / grep / submit)"
        />
      </div>
    </main>
  );
};

export default Level4;
