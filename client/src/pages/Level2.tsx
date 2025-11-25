import React, { useEffect, useRef, useState } from "react";
import LabVideo from "../assets/breakingBad.mp4";
import { useNavigate } from "react-router-dom";

// BREAKING BAD

const FLAG = "GGCAMP{we_break_good}";
const KEY = "labkey";
const ENCODED_HEX =
    "4b7959684b696770467859484e41634c4351414a4e41495741775566";

type FileNode = { name: string; type: "file"; content: string };
type DirNode = { name: string; type: "dir"; children: FsNode[] };
type FsNode = FileNode | DirNode;

const FS_ROOT: DirNode = {
    name: "/",
    type: "dir",
    children: [
        {
            name: "srv",
            type: "dir",
            children: [
                {
                    name: "lab",
                    type: "dir",
                    children: [
                        {
                            name: "reagent.txt",
                            type: "file",
                            content: `# reagent sequence (hex)
${ENCODED_HEX}
# hint: key ends with "key" - dont forget to run python3 filename.py reagent.txt`,
                        },
                        {
                            name: "decode_reagent.py",
                            type: "file",
                            content: `#!/usr/bin/env python3
# helper script to decode reagent.txt
# usage: python3 decode_reagent.py reagent.txt
`,
                        },
                        {
                            name: "notes.txt",
                            type: "file",
                            content: `lab notes:
- keep key short, repeatable
- starts with "lab"
- never commit plain-text flag
`,
                        },
                    ],
                },
            ],
        },
        {
            name: "readme.txt",
            type: "file",
            content:
                "Welcome to the Heisenberg's new lab, the goal is to submit the key package for the next shipment . Use ls, cd, cat, chmod, python3, hint. Flag format: GGCAMP{...}\n",
        },
    ],
};

// ----- FS helpers -----
function partsFromPath(path: string): string[] {
    if (path === "/") return [];
    return path.split("/").filter(Boolean);
}

function resolvePath(cwd: string, target: string): string {
    if (!target) return cwd;
    if (target.startsWith("/")) {
        const parts = target.split("/").filter(Boolean);
        return "/" + parts.join("/");
    }
    const baseParts = cwd === "/" ? [] : cwd.split("/").filter(Boolean);
    const parts = target.split("/").filter(Boolean);
    for (const p of parts) {
        if (p === ".") continue;
        if (p === "..") baseParts.pop();
        else baseParts.push(p);
    }
    return "/" + baseParts.join("/");
}

function findNode(root: FsNode, path: string): FsNode | null {
    const parts = partsFromPath(path);
    let node: FsNode = root;
    for (const p of parts) {
        if (node.type !== "dir") return null;
        const next = node.children.find(c => c.name === p);
        if (!next) return null;
        node = next;
    }
    return node;
}


const Level2: React.FC = () => {
    const navigate = useNavigate();
    const [videoWatched, setVideoWatched] = useState<boolean>(() => {
        try {
            return localStorage.getItem("level2_video_watched") === "1";
        } catch {
            return false;
        }
    });

    const [showTerminal, setShowTerminal] = useState<boolean>(videoWatched);


    const [cwd, setCwd] = useState<string>("/");
    const [lines, setLines] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [history, setHistory] = useState<string[]>([]);
    const [histIndex, setHistIndex] = useState<number | null>(null);
    const [scriptExecutable, setScriptExecutable] = useState(false);
    const [pythonAwaitKey, setPythonAwaitKey] = useState(false);
    const [solved, setSolved] = useState(false);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const viewRef = useRef<HTMLDivElement | null>(null);

    // console hint
    useEffect(() => {
        console.log("%c[LAB] multi-layer encoding detected", "color:#ffb86b;");
        console.log("%cKey hint: starts with 'lab'", "color:#9be15d;");
    }, []);

    useEffect(() => {
        if (showTerminal) {
            pushLines([
                "Booting Heisenberg /srv/lab secure terminal...",
                "Reactor: STABLE (temporary)",
                'Type "help" for commands.',
                "",
                `Current directory: ${cwd}`,
            ]);
            focusInput();
        }
    }, [showTerminal]);

    useEffect(() => {
        if (viewRef.current) {
            viewRef.current.scrollTop = viewRef.current.scrollHeight;
        }
    }, [lines]);

    const pushLines = (newLines: string[] | string) => {
        setLines(prev =>
            Array.isArray(newLines) ? [...prev, ...newLines] : [...prev, newLines]
        );
    };

    const focusInput = () => {
        setTimeout(() => inputRef.current?.focus(), 10);
    };

    const handleVideoEnd = () => {
        try {
            localStorage.setItem("level2_video_watched", "1");
        } catch { }
        setVideoWatched(true);
        setTimeout(() => {
            setShowTerminal(true);
        }, 400);
    };

    const runCommand = (raw: string) => {
        const cmdLine = raw.trim();
        if (!cmdLine) return;

        // show user's input
        pushLines(`> ${cmdLine}`);
        setHistory(h => [...h, cmdLine]);
        setHistIndex(null);

        const parts = cmdLine.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        // core commands
        if (cmd === "help") {
            pushLines([
                "Commands:",
                "  ls [path]             list directory contents",
                "  cd <path>             change directory",
                "  pwd                   print working directory",
                "  cat <file>            print file",
                "  clear                 clear screen",
                "  chmod XXX <file>       mark script as executable",
                "  python3 <file> [arg]  run simulated python helper",
                "  hint                  small hint",
                "",
            ]);
            return;
        }

        if (cmd === "ls") {
            const target = resolvePath(cwd, args[0] || "");
            const node = findNode(FS_ROOT, target);
            if (!node) {
                pushLines(`ls: cannot access '${args[0] || target}': No such file or directory`);
                return;
            }
            if (node.type === "file") {
                pushLines(node.name);
                return;
            }
            const listing = node.children.map(c =>
                c.type === "dir" ? `${c.name}/` : c.name
            );
            pushLines(listing.join("  "));
            return;
        }

        if (cmd === "pwd") {
            pushLines(cwd);
            return;
        }

        if (cmd === "cd") {
            const target = args[0] ? resolvePath(cwd, args[0]) : "/";
            const node = findNode(FS_ROOT, target);
            if (!node) {
                pushLines(`cd: ${args[0] || target}: No such file or directory`);
                return;
            }
            if (node.type === "file") {
                pushLines(`cd: not a directory: ${args[0] || target}`);
                return;
            }
            setCwd(target);
            pushLines(target);
            return;
        }

        if (cmd === "cat") {
            if (!args[0]) {
                pushLines("cat: missing file operand");
                return;
            }
            const target = resolvePath(cwd, args[0]);
            const node = findNode(FS_ROOT, target);
            if (!node) {
                pushLines(`cat: ${args[0]}: No such file`);
                return;
            }
            if (node.type === "dir") {
                pushLines(`cat: ${args[0]}: Is a directory`);
                return;
            }
            pushLines(node.content.split("\n"));
            return;
        }

        if (cmd === "clear") {
            setLines([]);
            return;
        }

        if (cmd === "hint") {
            pushLines(
                "There is a reagent file in this lab. Use ls/cd/cat, then use the helper script with python3."
            );
            return;
        }

        if (cmd === "chmod") {
            if (args.length < 2) {
                pushLines("chmod: missing operand");
                return;
            }
            const mode = args[0];
            const fileArg = args[1];
            const target = resolvePath(cwd, fileArg);
            const node = findNode(FS_ROOT, target);
            if (!node) {
                pushLines(`chmod: cannot access '${fileArg}': No such file`);
                return;
            }
            if (node.type === "dir") {
                pushLines(`chmod: cannot operate on directory '${fileArg}'`);
                return;
            }
            if (node.name !== "decode_reagent.py") {
                pushLines(`chmod: nothing interesting happens to '${fileArg}'`);
                return;
            }
            if (mode === "700" || mode === "100" || mode === "500" || mode === "300") {
                setScriptExecutable(true);
                pushLines(`permissions updated on ${fileArg}`);
            } else {
                pushLines(`chmod: mode '${mode}' applied`);
            }
            return;
        }

        if (cmd === "python3") {
            const script = args[0];
            const param = args[1]; // expected reagent.txt
            if (!script) {
                pushLines("python3: missing script name");
                return;
            }
            if (script !== "decode_reagent.py") {
                pushLines(`python3: can't open file '${script}'`);
                return;
            }
            if (!scriptExecutable) {
                pushLines(
                    "python3: Permission denied: './decode_reagent.py' (I'm the f*cking owner - I need to execute this sh*t (https://www.cs.swarthmore.edu/help/chmod.html)) "
                );
                return;
            }
            if (!param || param !== "reagent.txt") {
                pushLines("decode_reagent.py: expected argument 'reagent.txt'");
                return;
            }

            // Simulate running the helper script
            pushLines([
                "Running decode_reagent.py...",
                "Reading reagent file reagent.txt ...",
                "Found hex blob:",
                `  ${ENCODED_HEX}`,
                "",
                "Interpreting as base64 (hex -> bytes -> base64)...",
                "Decoded reagent payload.",
                "",
                "Enter reagent key (input hidden):",
            ]);
            setPythonAwaitKey(true);
            return;
        }

        if (cmd === "submit") {
            const candidate = parts.slice(1).join(" ");
            if (!candidate) {
                pushLines('submit: missing flag. Try: submit GGCAMP{...}');
                return;
            }
            if (candidate === FLAG) {
                pushLines(["FLAG ACCEPTED — nice work."]);
                setSolved(true);
                setTimeout(() => {
                    pushLines([
                        "",
                        "Preparing next simulation environment...",
                        "Transferring control to Level 3..."
                    ]);
                    navigate("/level3");
                }, 60000);

            } else {
                pushLines("submit: incorrect flag");
            }
            return;
        }

        pushLines(`command not found: ${cmd}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            const current = input;
            setInput("");

            // If python script is waiting for key input, handle here
            if (pythonAwaitKey) {
                // don't echo the key itself, mimic hidden input
                pushLines("> ********");
                setPythonAwaitKey(false);

                const key = current.trim();
                if (!key) {
                    pushLines("decode_reagent.py: empty key, aborting.");
                    return;
                }
                if (key === KEY) {
                    pushLines([
                        "",
                        "--- DECODING RESULT ---",
                        FLAG,
                        "--- end ---",
                        "",
                        "Use 'submit GGCAMP{...}' to send your flag.",
                    ]);
                } else {
                    pushLines([
                        "",
                        "decode_reagent.py: invalid key — decoding failed.",
                        "hint: check notes for a key that starts with 'lab'.",
                    ]);
                }
                return;
            }

            // Regular command mode
            runCommand(current);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (!history.length) return;
            const nextIndex =
                histIndex === null ? history.length - 1 : Math.max(0, histIndex - 1);
            setHistIndex(nextIndex);
            setInput(history[nextIndex]);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!history.length) return;
            if (histIndex === null) {
                setInput("");
                return;
            }
            const nextIndex = Math.min(history.length - 1, histIndex + 1);
            setHistIndex(nextIndex);
            setInput(history[nextIndex] ?? "");
        } else {
            setHistIndex(null);
        }
    };
    if (!showTerminal) {
        return (
            <div className="w-full h-screen bg-black flex items-center justify-center">
                <video
                    src={LabVideo as unknown as string}
                    className="w-full h-full object-cover"
                    autoPlay
                    onEnded={handleVideoEnd}
                />
            </div>
        );
    }


    return (
        <div className="w-full h-screen bg-black text-green-300 font-mono p-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-green-800 pb-2 mb-2">
                <div className="flex items-center gap-3">
                    <div className="px-2 py-1 bg-gray-900 border border-green-800 rounded">
                        {cwd}
                    </div>
                    <div className="text-xs text-gray-400">
                        lab terminal
                    </div>
                </div>
                <div className="text-xs text-gray-500">
                    {scriptExecutable ? "decode_reagent.py: +x" : "decode_reagent.py: -x"}
                </div>
            </div>

            <div
                ref={viewRef}
                className="flex-1 overflow-auto bg-black/70 border border-green-900 rounded p-3 text-[13px] whitespace-pre-wrap"
            >
                {lines.length === 0 && (
                    <div className="text-gray-500">
                        Terminal ready. Type &quot;help&quot;.
                    </div>
                )}
                {lines.map((l, i) => (
                    <div key={i}>{l}</div>
                ))}

                <div className="mt-2 text-sm text-gray-500">
                    {solved
                        ? "Flag recovered. To add you to the scoreboard yell #Aviato#, and take a shot in the drink station"
                        : "Explore the filesystem with ls/cd/cat. Make the helper executable with chmod, then run python3."}
                </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
                <span className="text-emerald-300">&gt;</span>
                <input
                    ref={inputRef}
                    className="flex-1 bg-black border border-green-800 rounded px-3 py-2 outline-none text-green-300"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    placeholder={
                        pythonAwaitKey
                            ? "Enter reagent key (input hidden)"
                            : 'Type a command (ls, cd, cat, chmod +x decode_reagent.py, python3 decode_reagent.py reagent.txt, submit GGCAMP{...})'
                    }
                />
            </div>

            <div className="mt-1 text-xs text-gray-500">
                Up/Down arrows: command history.
            </div>
        </div>
    );
};

export default Level2;
