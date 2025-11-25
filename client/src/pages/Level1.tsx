import React, { useEffect, useRef, useState } from "react";
import Windows from "../assets/windows87.png";
import Bin from "../assets/Recycle Bin (full).png";
import Explorer from "../assets/Internet Explorer 6.png";
import paint from "../assets/Paint.png";
import wLogo from "../assets/wXP.png";
import clock from "../assets/Date and Time.png";
import cmd from "../assets/Command Prompt.png";
import TonyVideo from "../assets/tony.mp4";
import { useNavigate } from "react-router-dom";



// SOPRANOS
const encodedPassword = "SGVpc2VuYmVyZw==";

const STICKY_NOTE = `Listen—this damn password thing is a joke. I lost it again, I’m tellin’ ya. 
Who invented this crap? I gotta keep remembering 12 different codes like I’m countin’ inventory.
Technology’s a pain in the ass. If this doesn’t work by lunchtime, somebody’s gonna hear from me.
— Boss`;

const BOSS_TEXT = `You ever notice how this f***ing technology just makes everything worse?
I lost the password. Again. Of all the bulls**t I gotta deal with, this is the one that gets me.
You spend fifty years buildin’ respect, takin’ care of business, and then some machine asks you for characters
and symbols like you’re solving a crossword puzzle from hell.

Look—fix it. Put it somewhere simple. Put it on a sticky, tie it to the friggin’ monitor,
or put it under the keyboard like the old days. I don’t wanna hear “it’s for security” or “use two-factor.”
Security’s fine — until it makes me look like I can’t even log into my own system.

I hate this tech. I hate it with a passion. Sort it out before I lose my patience.
— The Boss`;

type DragState =
  | { window: "sticky"; offsetX: number; offsetY: number }
  | { window: "boss"; offsetX: number; offsetY: number }
  | { window: "video"; offsetX: number; offsetY: number }
  | null;

const Level1: React.FC = () => {
  const navigate = useNavigate();

  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [terminalMode, setTerminalMode] = useState<"user" | "pass" | "done">("user");
  const [input, setInput] = useState("");

  // XP loading overlay state
  const [showLoading, setShowLoading] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100 loading bar

  // popup visibility
  const [showSticky, setShowSticky] = useState(false);
  const [showBossNote, setShowBossNote] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // draggable positions
  const [stickyPos, setStickyPos] = useState({ x: 800, y: 450 });
  const [bossPos, setBossPos] = useState({ x: 280, y: 110 });
  const [videoPos, setVideoPos] = useState({ x: 700, y: 100 });

  const [dragging, setDragging] = useState<DragState>(null);

  // ref to control Tony video
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    console.log(
      "%cWelcome to Windows XP — right click > View Page Source ;)",
      "color: #00AEEF; font-weight:bold;"
    );
    console.log(
      "%cPsst. Some dev left a suspicious base64 string in the bundle: %s",
      "color:#22c55e;",
      encodedPassword
    );
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setShowSticky(true);
      setShowBossNote(true);
      setShowVideo(true);
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  // global drag handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      if (dragging.window === "sticky") {
        setStickyPos({
          x: e.clientX - dragging.offsetX,
          y: e.clientY - dragging.offsetY,
        });
      } else if (dragging.window === "boss") {
        setBossPos({
          x: e.clientX - dragging.offsetX,
          y: e.clientY - dragging.offsetY,
        });
      } else if (dragging.window === "video") {
        setVideoPos({
          x: e.clientX - dragging.offsetX,
          y: e.clientY - dragging.offsetY,
        });
      }
    };

    const handleMouseUp = () => {
      if (dragging) setDragging(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  useEffect(() => {
    if (!showLoading) return;

    setProgress(0);
    const start = Date.now();
    const total = 6000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / total) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [showLoading]);

  const startDrag = (
    windowName: DragState["window"],
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    currentPos: { x: number; y: number }
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDragging({
      window: windowName,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
  };

  const openTerminal = () => {
    setTerminalOpen(true);
    setTerminalMode("user");
    setInput("");
    setTerminalLines([
      "Microsoft Windows XP [Version 5.1.2600]",
      "(C) Copyright 1985-2001 Microsoft Corp.",
      "",
      "secure_login.bat",
      "",
      "login: ",
    ]);
  };

  const handleTerminalSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setTerminalLines(prev => {
      const updated = [...prev];
      if (terminalMode === "user") {
        updated[updated.length - 1] = `login: ${trimmed}`;
        if (trimmed === "Anthony") {
          updated.push("password: ");
          setTerminalMode("pass");
        } else {
          updated.push("login failed: unknown user", "", "login: ");
        }
      } else if (terminalMode === "pass") {
        updated[updated.length - 1] = "password: ********";
        const decoded = atob(encodedPassword);
        if (trimmed === decoded) {
          updated.push(
            "",
            "ACCESS GRANTED.",
            "hint: real secrets are often hiding in plain HTML.",
            "try looking at what the browser actually loaded...",
            ""
          );
          setTerminalMode("done");

          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
          }
          setShowVideo(false);

          setTerminalOpen(false);
          setShowLoading(true);

          setTimeout(() => {
            navigate("/level2");
          }, 6000);
        } else {
          updated.push("ACCESS DENIED.", "", "login: ");
          setTerminalMode("user");
        }
      } else {
        updated.push(`> ${trimmed}`);
      }
      return updated;
    });
    setInput("");
  };

  return (
    <main className="overflow-hidden min-h-screen flex flex-col bg-[#008080] relative">
      <div
        aria-hidden="true"
        dangerouslySetInnerHTML={{
          __html: "<!-- FLAG: Anthony -->",
        }}
      />
      <img
        src={Windows}
        alt="Windows XP Wallpaper"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className="absolute top-6 left-6 flex flex-col gap-6 text-white font-[system-ui] text-xs z-5 drop-shadow-md">
        <div className="flex flex-col items-center">
          <img src={Bin} alt="Recycle Bin" className="w-12 h-12" />
          <p>Recycle Bin</p>
        </div>

        <div className="flex flex-col items-center">
          <img src={Explorer} alt="Explorer" className="w-12 h-12" />
          <p>Explorer</p>
        </div>

        <div className="flex flex-col items-center">
          <img src={paint} alt="Paint" className="w-12 h-12" />
          <p>Paint</p>
        </div>
      </div>

      {/* Terminal */}
      {terminalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto bg-gray-900 border border-gray-300 shadow-2xl w-[90%] max-w-xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-[#0b3b82] to-[#1c5fb3] px-2 py-1">
              <span className="text-xs text-white font-[Tahoma]">
                C:\WINDOWS\system32\cmd.exe
              </span>
              <button
                className="w-5 h-5 bg-gray-200 text-center leading-5 text-black border border-gray-500 text-xs"
                onClick={() => setTerminalOpen(false)}
              >
                X
              </button>
            </div>
            <div className="bg-black text-green-300 font-mono text-sm p-3 h-64 overflow-y-auto">
              {terminalLines.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))}
              {(terminalMode === "user" ||
                terminalMode === "pass" ||
                terminalMode === "done") && (
                  <div className="flex mt-2">
                    {terminalMode !== "done" && (
                      <span className="mr-2 text-green-400">&gt;</span>
                    )}
                    <input
                      className="flex-1 bg-transparent outline-none text-green-300 caret-green-300"
                      autoFocus
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleTerminalSubmit();
                        }
                      }}
                    />
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
      <footer className="mt-auto bg-[#245EDC] border-t-4 border-[#19459B] text-white flex items-center justify-between px-3 z-10 font-[Tahoma]">
        <button className="justify-start flex items-center bg-[#1a9f00] hover:bg-[#1dbf00] px-4 h-10 rounded-2xl shadow-inner text-sm font-semibold border border-[#0a6000]">
          <img src={wLogo} alt="Start" className="w-6 mr-1" />
          Start
        </button>

        <div className="flex gap-2 text-sm justify-start">
          <button
            className="bg-[#3C78D8] hover:bg-[#4A90E2] px-3 py-1 rounded-sm shadow-inner border border-[#1E4BA8] flex flex-row items-center"
            onClick={openTerminal}
          >
            <img src={cmd} className="w-4 mr-2" alt="cmd" />
            C:\Users\Username\...
          </button>
        </div>

        <div className="bg-[#3C78D8] px-2 py-1 rounded-sm shadow-inner border border-[#1E4BA8] text-sm font-mono flex flex-row h-8 items-center">
          <img className="w-4 mr-2" src={clock} alt="clock" />
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </footer>

      {showSticky && (
        <div
          className="fixed z-30 w-64 bg-yellow-200/95 border border-yellow-400 p-3 rounded shadow-xl text-sm text-gray-900 font-sans"
          style={{ left: stickyPos.x, top: stickyPos.y }}
        >
          <div
            className="flex justify-between items-center cursor-move"
            onMouseDown={e => startDrag("sticky", e, stickyPos)}
          >
            <strong className="text-xs">Sticky Note</strong>
            <button
              className="text-xs text-gray-700"
              onClick={() => setShowSticky(false)}
            >
              ✕
            </button>
          </div>
          <div className="mt-2 whitespace-pre-wrap">{STICKY_NOTE}</div>
        </div>
      )}

      {/* Boss note */}
      {showBossNote && (
        <div
          className="fixed z-40 w-[25%] max-w-2xl bg-gray-100 rounded shadow-2xl border border-gray-300"
          style={{ left: bossPos.x, top: bossPos.y }}
        >
          <div
            className="flex items-center justify-between bg-slate-200 px-3 py-1 border-b border-gray-300 cursor-move"
            onMouseDown={e => startDrag("boss", e, bossPos)}
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="w-3 h-3 bg-yellow-400 rounded-full" />
              <span className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="ml-2 text-sm font-semibold">
                BossNote.txt - Notepad
              </span>
            </div>
            <button
              className="px-2 py-0.5 text-xs border rounded bg-white"
              onClick={() => setShowBossNote(false)}
            >
              Close
            </button>
          </div>
          <div className="p-4 bg-white text-sm font-sans text-gray-800 h-[50vh] overflow-y-auto whitespace-pre-wrap">
            {BOSS_TEXT}
          </div>
          <div className="flex justify-end p-2 bg-slate-50 border-t border-gray-200">
            <button
              className="px-3 py-1 rounded bg-blue-600 text-white text-xs"
              onClick={() => {
                navigator.clipboard?.writeText(BOSS_TEXT);
                alert("Copied BossNote to clipboard");
              }}
            >
              Copy
            </button>
          </div>
        </div>
      )}
      {showVideo && (
        <div
          className="fixed z-10 w-[90%] max-w-xl bg-black/90 rounded shadow-2xl border border-gray-700 text-gray-100"
          style={{ left: videoPos.x, top: videoPos.y }}
        >
          <div
            className="flex items-center justify-between px-3 py-1 border-b border-gray-700 cursor-move bg-gray-900"
            onMouseDown={e => startDrag("video", e, videoPos)}
          >
            <span className="text-sm font-semibold">boss_clip.mp4</span>
            <button
              className="px-2 py-0.5 text-xs border rounded bg-gray-800"
              onClick={() => setShowVideo(false)}
            >
              Close
            </button>
          </div>
          <div className="p-3">
            {TonyVideo ? (
              <video
                ref={videoRef}
                src={TonyVideo}
                autoPlay
                loop
                preload="true"
                className="w-full rounded border border-gray-600"
              />
            ) : (
              <p className="text-sm text-gray-300">
                No video file found. Add <code>tony.mp4</code> under{" "}
                <code>src/assets/</code> to enable playback (and only use media you have
                rights to).
              </p>
            )}
          </div>
        </div>
      )}
      {showLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black">
          <div className="flex flex-col items-center">
            <img src={wLogo} alt="Windows logo" className="w-20 mb-4" />
            <p className="text-xl text-blue-400 font-semibold mb-8">
              Microsoft Windows XP
            </p>
            <div className="w-64 h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Loading secure environment...
            </p>
          </div>
        </div>
      )}
    </main>
  );
};

export default Level1;
