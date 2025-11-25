import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./Home";
import Level0 from "./pages/Level0";
import Level1 from "./pages/Level1";
import Level2 from "./pages/Level2";
import Level3 from "./pages/Level3";
import Level4 from "./pages/Level4";
import Level5 from "./pages/Level5";
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/level0" element={<Level0 />} />
        <Route path="/level1" element={<Level1 />} />
        <Route path="/level2" element={<Level2 />} />
        <Route path="/level3" element={<Level3 />} />
        <Route path="/level4" element={<Level4 />} />
        <Route path="/level5" element={<Level5 />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;
