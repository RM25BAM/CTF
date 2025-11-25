import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import conan from "../assets/conan.mp4";
// TODO: replace this with your real Detective Conan intro video asset
// import ConanIntro from "../assets/conan-intro.mp4";
// const INTRO_VIDEO = ConanIntro as unknown as string;


// CONAN — Level 0
const Level0: React.FC = () => {
  const navigate = useNavigate();

  // Intro / stage
  const [introSeen, setIntroSeen] = useState<boolean>(() => {
    try {
      return localStorage.getItem("level0_intro_watched") === "1";
    } catch {
      return false;
    }
  });
  const [showPuzzle, setShowPuzzle] = useState<boolean>(introSeen);

  // Puzzle state
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  // Correct answer to the tiny coding puzzle
  const CORRECT_ANSWER = "Conan14";

  const handleIntroEnded = () => {
    try {
      localStorage.setItem("level0_intro_watched", "1");
    } catch {
      // ignore
    }
    setIntroSeen(true);
    setShowPuzzle(true);
  };

  const handleSubmit = () => {
    const trimmed = answer.trim();

    if (!trimmed) {
      setMessage("Detective, you forgot to write your deduction.");
      return;
    }

    if (trimmed === CORRECT_ANSWER) {
      setSolved(true);
      setMessage("Case closed! Redirecting you to Level 1...");
      // Redirect to level 1 after a short delay
      setTimeout(() => {
        navigate("/level1");
      }, 2500);
    } else {
      setSolved(false);
      setMessage("Not quite, detective. Re-examine the code.");
    }
  };

  // If the intro hasn't been seen yet, show the video stage
  if (!showPuzzle) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        
          <video
            src={conan}
            className="w-full h-full object-cover"
            autoPlay
            onEnded={handleIntroEnded}
          />
      </div> 
    );
  }

  // Puzzle stage
  return (
    <main className="w-full h-screen bg-slate-950 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 bg-black/80 border border-amber-400/60 rounded-xl shadow-lg p-6 text-amber-100 font-mono">
        {/* Header */}
        <div className="mb-4 text-center">
          <div className="text-xs uppercase tracking-widest text-amber-300/80">
            Level 0 — Case: The Beginner&apos;s Code
          </div>
          <div className="text-2xl font-semibold mt-1 text-amber-200">
            Detective Conan Training
          </div>
        </div>

        {/* Story text */}
        <p className="text-xs mb-4 text-amber-100/90">
          Conan Edogawa is staring at a whiteboard in a dimly lit lab. Someone
          left a tiny JavaScript snippet as a warm-up for junior detectives.
          Your job: read the code and figure out what value ends up in{" "}
          <span className="font-bold">mystery</span>.
        </p>

        {/* Code snippet */}
        <div className="bg-slate-900/90 border border-amber-400/40 rounded-md p-3 text-xs mb-4">
          <div className="text-[10px] text-amber-300/80 mb-1">
            // Simple JavaScript puzzle
          </div>
          <pre className="whitespace-pre-wrap">
            {`const name = "Conan";\nconst code = 7 * 2;\nconst mystery = name + code;`}
          </pre>
        </div>

        <p className="text-xs mb-3 text-amber-200">
          Question: <span className="font-semibold">What is the exact value of <code>mystery</code>?</span>
        </p>

        {/* Input + button */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="text"
            className="flex-1 bg-slate-950 border border-amber-400/50 rounded px-3 py-2 text-xs text-amber-100 outline-none"
            placeholder='Type your answer, e.g. Conan14'
            value={answer}
            onChange={e => setAnswer(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-amber-400 text-black text-xs font-semibold rounded hover:bg-amber-300 transition-colors"
          >
            Submit deduction
          </button>
        </div>

        {/* Feedback */}
        {message && (
          <div
            className={`text-xs mt-1 ${
              solved ? "text-emerald-300" : "text-amber-300"
            }`}
          >
            {message}
          </div>
        )}

        {/* Tiny hint */}
        <div className="mt-4 text-[11px] text-amber-300/80">
          Hint: In JavaScript, using <code>+</code> with a string and a number
          concatenates them into a longer string.
        </div>
      </div>
    </main>
  );
};

export default Level0;
