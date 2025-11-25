import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Adventure from "../assets/adventure_time.mp4";
// TODO: replace with your actual Adventure-Time-style SQL intro video.
// import AdventureSqlIntro from "../assets/adventure-sql-intro.mp4";
// const INTRO_VIDEO = AdventureSqlIntro as unknown as string;


/**
 *
 * Educational goal:
 *  - Demonstrate *how* SQL injection works conceptually in a safe, fictional environment.
 *  - Show the vulnerable query string and how a crafted password can break it.
 *
 * Story:
 *  - Finn & Jake stumbled into the "Vault of Ooo User DB".
 *  - The Database Wizard wrote insecure code ("FinnQL") that looks like SQL.
 *  - The player must craft a malicious password to trick the query and gain "admin" access,
 *    revealing the flag.
 *
 * Notes:
 *  - This is a simulation. All data is fake.
 *  - Do NOT use these techniques on real systems you do not own or have permission to test.
 */

const FLAG = "GGCAMP{finnql_injection_master}";

type UserRecord = {
  username: string;
  password: string;
  role: "hero" | "princess" | "wizard" | "admin";
};

const USERS: UserRecord[] = [
  { username: "finn", password: "sword123", role: "hero" },
  { username: "jake", password: "stretch!", role: "hero" },
  { username: "pb", password: "science4ever", role: "princess" },
  { username: "iceking", password: "crown", role: "wizard" },
  // "admin" exists but is not supposed to be reachable with normal credentials
  { username: "root_ooo", password: "legit_admin_only", role: "admin" },
];

const Level5: React.FC = () => {
  const navigate = useNavigate();

  // intro stage
  const [introSeen, setIntroSeen] = useState<boolean>(() => {
    try {
      return localStorage.getItem("level5_intro_watched") === "1";
    } catch {
      return false;
    }
  });
  const [showTerminal, setShowTerminal] = useState<boolean>(introSeen);

  // terminal state
  const [lines, setLines] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIndex, setHistIndex] = useState<number | null>(null);
  const viewRef = useRef<HTMLDivElement | null>(null);

  // "DB" state
  const [isCompromised, setIsCompromised] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);

  const append = (s: string | string[]) =>
    setLines(prev => (Array.isArray(s) ? [...prev, ...s] : [...prev, s]));

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.scrollTop = viewRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    if (!showTerminal) return;

    append([
      "VAULT OF OOO — FINNQL CONSOLE v1.0",
      "Realm: Land of Ooo / Subsystem: UserAuth_Proto01",
      "",
      "Finn and Jake have stumbled into the Vault of Ooo user database.",
      "The Database Wizard left behind a very insecure login spell.",
      "",
      "This is a SAFE, FICTIONAL training database for learning about SQL injection.",
      "Never use these techniques against systems you don't own or have explicit permission to test.",
      "",
      "Type 'help' for commands.",
      "",
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTerminal]);

  const handleIntroEnded = () => {
    try {
      localStorage.setItem("level5_intro_watched", "1");
    } catch {
      // ignore
    }
    setIntroSeen(true);
    setShowTerminal(true);
  };

  const resetState = () => {
    setIsCompromised(false);
    setCurrentUser(null);
    setLastQuery(null);
    append([
      "system: vault state reset.",
      "system: current user cleared; breach status set to SECURE.",
      "",
    ]);
  };

  // Check if password string looks like an injection attempt
  const isInjectionPayload = (passwordRaw: string): boolean => {
    const p = passwordRaw.toLowerCase();
    // Classic teaching pattern: ' OR 1=1 --
    if (p.includes(" or ") && p.includes("1=1")) return true;
    if (p.includes("--")) return true;
    return false;
  };

  const handleLogin = (username: string, passwordRaw: string) => {
    // Construct vulnerable query (this mimics real SQL injection risk)
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${passwordRaw}';`;
    setLastQuery(query);

    append([
      "finnql> login attempt detected.",
      `finnql> building query:`,
      `  ${query}`,
      "",
    ]);

    // Injection path: we detect "OR 1=1" style payload and treat as full table fetch
    if (isInjectionPayload(passwordRaw)) {
      append([
        "!! ALERT: input appears to have broken out of the password check.",
        "!! finnql: WHERE clause evaluated to TRUE for all rows.",
        "!! system: first admin-like row returned.",
        "",
      ]);
      const admin = USERS.find(u => u.role === "admin");
      if (admin) {
        setCurrentUser(admin);
        setIsCompromised(true);
        append([
          `vault: YOU ARE NOW LOGGED IN AS '${admin.username}' [role=${admin.role}]`,
          "",
          ">>> BREACH COMPLETE: You exploited the vulnerable FinnQL login spell.",
          `>>> FLAG: ${FLAG}`,
          "",
        ]);
        try {
          const existing = JSON.parse(
            localStorage.getItem("level_scores") || "[]"
          );
          existing.push({
            level: 6,
            score: 0,
            when: new Date().toISOString(),
          });
          localStorage.setItem("level_scores", JSON.stringify(existing));
        } catch {
          // ignore
        }

        // Optionally auto-advance
        // setTimeout(() => navigate("/level7"), 20000);
      } else {
        append([
          "system: no admin rows found (this shouldn't happen in this simulation).",
        ]);
      }
      return;
    }

    // Normal, non-injection path: simple username/password check
    const match = USERS.find(
      u => u.username === username && u.password === passwordRaw
    );

    if (match) {
      setCurrentUser(match);
      append([
        `vault: LOGIN SUCCESS for '${match.username}' [role=${match.role}]`,
        "",
        "But you haven't broken the spell yet.",
        "Try thinking like a villainous Database Wizard...",
        "",
      ]);
    } else {
      append(["vault: LOGIN FAILED — invalid username or password.", ""]);
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
        "  help                 show this help",
        "  lore                 explain the story of the Vault of Ooo",
        "  schema               show the FinnQL user table schema",
        "  example              show the insecure login spell (pseudocode)",
        "  show_query           show the last FinnQL query that was 'executed'",
        "  login <u> <p...>     attempt login with username u and password p",
        "  status               show vault status (secure / breached)",
        "  reset                reset vault state (logout & clear breach)",
        "  clear                clear console",
        "",
        "Tip: in real SQL, unsafe string concatenation can allow input like:",
        "  ' OR 1=1 --",
        "to change the meaning of the query. Try something like that as the password.",
        "",
      ]);
      return;
    }

    if (cmd === "lore") {
      append([
        "Lore: Vault of Ooo User DB",
        "------------------------------------",
        "- Finn & Jake chased a glitchy monster into Princess Bubblegum's old lab.",
        "- Deep inside, a dusty terminal labeled 'VAULT_OF_OOO_USER_DB' hums to life.",
        "- A note from the Database Wizard says:",
        '    "I was SURE string-concatenating my queries was FINE."',
        "- Your mission: demonstrate *why* that was a bad idea by breaking the login spell.",
        "",
      ]);
      return;
    }

    if (cmd === "schema") {
      append([
        "FinnQL schema (fictional, but SQL-like):",
        "",
        "  CREATE TABLE users (",
        "    id        INTEGER PRIMARY KEY,",
        "    username  VARCHAR(32) UNIQUE NOT NULL,",
        "    password  VARCHAR(64) NOT NULL,",
        "    role      VARCHAR(16) NOT NULL",
        "  );",
        "",
        "Sample rows:",
        "  ('finn', 'sword123', 'hero')",
        "  ('jake', 'stretch!', 'hero')",
        "  ('pb', 'science4ever', 'princess')",
        "  ('root_ooo', 'legit_admin_only', 'admin')",
        "",
      ]);
      return;
    }

    if (cmd === "example") {
      append([
        "Insecure login spell (pseudocode):",
        "",
        "  function login(username, password) {",
        "    const query = ",
        "      \"SELECT * FROM users \" +",
        "      \"WHERE username = '\" + username + \"' \" +",
        "      \"AND password = '\" + password + \"';\";",
        "    // send `query` to the database",
        "  }",
        "",
        "This is dangerous because untrusted input is spliced directly into the query.",
        "If password is something like:  ' OR 1=1 --",
        "the WHERE clause can become:   username='finn' AND password='' OR 1=1 --'",
        "which may return *all* rows.",
        "",
        "Secure approaches include prepared statements / parameterized queries,",
        "which avoid concatenating raw input into SQL strings.",
        "",
      ]);
      return;
    }

    if (cmd === "show_query") {
      if (!lastQuery) {
        append(["finnql: no query has been run yet.", ""]);
      } else {
        append(["Last finnql query:", `  ${lastQuery}`, ""]);
      }
      return;
    }

    if (cmd === "login") {
      if (args.length < 2) {
        append([
          "usage: login <username> <password...>",
          "example:",
          "  login finn sword123",
          "or try something more... mischievous:",
          "  login finn ' OR 1=1 --",
          "",
        ]);
        return;
      }
      const username = args[0];
      const passwordRaw = args.slice(1).join(" ");
      handleLogin(username, passwordRaw);
      return;
    }

    if (cmd === "status") {
      append([
        `VAULT STATUS: ${isCompromised ? "BREACHED" : "SECURE"}`,
        `CURRENT USER: ${currentUser ? currentUser.username + " [role=" + currentUser.role + "]" : "none"}`,
        "",
        "Reminder: this is a fictional training environment.",
        "",
      ]);
      return;
    }

    if (cmd === "reset") {
      resetState();
      return;
    }

    if (cmd === "clear") {
      setLines([]);
      return;
    }

    if (cmd === "submit") {
      // allow them to submit flag here if they already know it (for consistency with other levels)
      const candidate = args.join(" ");
      if (!candidate) {
        append(["submit: missing flag. Usage: submit GGCAMP{...}", ""]);
        return;
      }
      if (candidate === FLAG) {
        append([
          "submit: FLAG ACCEPTED (manual submission).",
          "You already knew the ending of this tale.",
          "CONSOLE LOG!!!",
          "",
        ]);
        try {
          const existing = JSON.parse(
            localStorage.getItem("level_scores") || "[]"
          );
          existing.push({
            level: 6,
            score: 0,
            when: new Date().toISOString(),
          });
          localStorage.setItem("level_scores", JSON.stringify(existing));
        } catch {
          // ignore
        }
        // setTimeout(() => navigate("/level7"), 20000);
      } else {
        append(["submit: incorrect flag.", ""]);
      }
      console.log("Yell your score and yell Pickle Rick")
      return;
    }

    append([`Unknown command: ${cmd}. Try 'help'.`, ""]);
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

        <video
          src={Adventure}
          className="w-full h-full object-cover"
          autoPlay
          onEnded={handleIntroEnded}
        />
      </div>

    );
  }

  return (
    <main className="w-full h-screen bg-black text-green-200 font-mono flex flex-col">
      {/* top bar */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-green-900 bg-black/80">
        <div className="text-xs text-green-300">
          VAULT OF OOO — FinnQL Injection Training
        </div>
        <div className="text-xs text-green-400">
          Status: {isCompromised ? "BREACHED" : "SECURE"}
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
      <div className="px-3 pb-3 flex items-center gap-2 border-t border-green-900/60 bg-black/80">
        <span className="text-emerald-400 text-sm">&gt;</span>
        <input
          className="flex-1 bg-black border border-green-900 rounded px-3 py-2 text-xs text-green-200 outline-none"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          autoFocus
          placeholder="Type command (help / lore / schema / example / login / status / show_query / reset / submit)"
        />
      </div>
    </main>
  );
};

export default Level5;
