import { Link, Routes, Route } from "react-router-dom";
import Introduction from "./pages/Introduction.jsx";
import EDA from "./pages/EDA.jsx";
import Missingness from "./pages/Missingness.jsx";
import Troll from "./pages/Troll.jsx";

function App() {
  return (
    <div
      style={{
        fontFamily: "system-ui",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "2rem",
      }}
    >
      {/* Site Header */}
      <header style={{ marginBottom: "1.5rem" }}>
        <h1>League of Legends Role Impact Analysis</h1>
        <p style={{ color: "#555" }}>
          DSC 80 Final Project – analyzing which role (Mid, Jungle, ADC) has the
          strongest impact on winning.
        </p>
      </header>

      {/* Navigation */}
      <nav style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <Link to="/">Introduction</Link>
        <Link to="/eda">EDA</Link>
        <Link to="/missingness">Missingness</Link>
        <Link to="/troll">Troll Analysis</Link>
      </nav>

      {/* Page Content */}
      <main>
        <Routes>
          <Route path="/" element={<Introduction />} />
          <Route path="/eda" element={<EDA />} />
          <Route path="/missingness" element={<Missingness />} />
          <Route path="/troll" element={<Troll />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
