import { Link, Routes, Route } from "react-router-dom";
import Introduction from "./pages/Introduction.jsx";
import EDA from "./pages/EDA.jsx";
import HypothesisTesting from "./pages/HypothesisTesting.jsx";
import Modeling from "./pages/Modeling.jsx";
import Missingness from "./pages/Missingness.jsx";

function App() {
  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem",
        backgroundColor: "#f9fafb",
        minHeight: "100vh"
      }}
    >
      {/* Site Header */}
      <header style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1 style={{
          fontSize: "3rem",
          fontWeight: "bold",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem"
        }}>
          Bot or Top?
        </h1>
        <h2 style={{ fontSize: "1.5rem", color: "#6b7280", fontWeight: "normal" }}>
          Quantifying the Value of Jungle Gank Priority
        </h2>
        <p style={{ color: "#9ca3af", marginTop: "0.5rem" }}>
          DSC 80 Final Project – Analyzing cross-map trade value in professional League of Legends
        </p>
      </header>

      {/* Navigation */}
      <nav style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "2rem",
        justifyContent: "center",
        flexWrap: "wrap"
      }}>
        {[
          { to: "/", label: "Introduction" },
          { to: "/eda", label: "Cleaning & EDA" },
          { to: "/missingness", label: "Assessment of Missingness" },
          { to: "/hypothesis", label: "Hypothesis Testing" },
          { to: "/modeling", label: "Modeling & Fairness" }
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              color: "#374151",
              fontWeight: "500",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => {
              e.target.style.boxShadow = "0 4px 6px rgba(0,0,0,0.15)";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
              e.target.style.transform = "translateY(0)";
            }}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Page Content */}
      <main style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "2rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <Routes>
          <Route path="/" element={<Introduction />} />
          <Route path="/eda" element={<EDA />} />
          <Route path="/missingness" element={<Missingness />} />
          <Route path="/hypothesis" element={<HypothesisTesting />} />
          <Route path="/modeling" element={<Modeling />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
