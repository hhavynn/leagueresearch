import { useState, useEffect } from "react";
import Plotly from "react-plotly.js";

// Handle Vite/Rollup default export interop
const Plot = Plotly.default || Plotly;

export default function Missingness() {
  const [results, setResults] = useState(null);
  const [plot1, setPlot1] = useState(null);
  const [plot2, setPlot2] = useState(null);

  useEffect(() => {
    // Load results
    fetch(import.meta.env.BASE_URL + "data/missingness_results.json")
      .then(res => res.json())
      .then(data => setResults(data))
      .catch(err => console.error("Error loading missingness results:", err));

    // Load plot 1
    fetch(import.meta.env.BASE_URL + "data/missingness_test_1.json")
      .then(res => res.json())
      .then(data => setPlot1(data))
      .catch(err => console.error("Error loading missingness plot 1:", err));

    // Load plot 2
    fetch(import.meta.env.BASE_URL + "data/missingness_test_2.json")
      .then(res => res.json())
      .then(data => setPlot2(data))
      .catch(err => console.error("Error loading missingness plot 2:", err));
  }, []);

  if (!results) return <div>Loading analysis...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem", fontSize: "2rem" }}>Assessment of Missingness</h2>

      {/* NMAR Analysis */}
      <section style={{ marginBottom: "3rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>NMAR Analysis</h3>
        <div style={{ padding: "1.5rem", backgroundColor: "#f9fafb", borderRadius: "8px", lineHeight: "1.7" }}>
          <p style={{ marginBottom: "1rem" }}>
            We analyzed the <strong>{results.missing_col}</strong> column, which has {results.missing_count} missing values.
          </p>
          <p>
            <strong>Is it NMAR?</strong><br />
            We believe the missingness in `ban` columns (like `ban1`) could be <strong>NMAR (Not Missing At Random)</strong>.
            In professional play, a missing ban often indicates a team intentionally chose not to ban a champion (a "null ban"),
            or ran out of time. If they chose not to ban because "no champion was worth banning", the missingness depends on the
            value of the unobserved variable (the "worthiness" of a ban).
          </p>
          <p style={{ marginTop: "1rem" }}>
            However, it could also be <strong>MAR</strong> if it depends on observable factors like game version (patches with fewer OP champs)
            or game length (remakes?). To test this, we check dependencies on other columns.
          </p>
        </div>
      </section>

      {/* Test 1: Dependent */}
      <section style={{ marginBottom: "3rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>Test 1: Check for Dependency (MAR)</h3>
        <p style={{ marginBottom: "1rem" }}>
          We performed a permutation test to see if missingness depends on <strong>{results.test1.dependent_col}</strong>.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <Card title="P-Value" value={results.test1.p_value.toFixed(4)} color={results.test1.p_value < 0.05 ? "#F44336" : "#4CAF50"} />
          <Card title="Result" value={results.test1.interpretation} color="#2196F3" />
        </div>

        {plot1 && (
          <div style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "1rem" }}>
            <Plot
              data={plot1.data}
              layout={{ ...plot1.layout, autosize: true }}
              useResizeHandler={true}
              style={{ width: "100%" }}
            />
          </div>
        )}
      </section>

      {/* Test 2: Independent */}
      <section style={{ marginBottom: "3rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>Test 2: Check for Independence (MCAR)</h3>
        <p style={{ marginBottom: "1rem" }}>
          We also checked if missingness depends on <strong>{results.test2.dependent_col}</strong> (Blue vs Red side). We expect this to be independent.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <Card title="P-Value" value={results.test2.p_value.toFixed(4)} color={results.test2.p_value < 0.05 ? "#F44336" : "#4CAF50"} />
          <Card title="Result" value={results.test2.interpretation} color="#FF9800" />
        </div>

        {plot2 && (
          <div style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "1rem" }}>
            <Plot
              data={plot2.data}
              layout={{ ...plot2.layout, autosize: true }}
              useResizeHandler={true}
              style={{ width: "100%" }}
            />
          </div>
        )}
        <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#e8f5e9", borderRadius: "8px", border: "1px solid #4CAF50" }}>
          <strong>Conclusion:</strong> Since the p-value is large (&gt; 0.05), we <strong>fail to reject the null hypothesis</strong>.
          The missingness of bans does NOT appear to depend on the side selection, supporting that it is not universally dependent on all variables.
        </div>
      </section>
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div style={{
      padding: "1.5rem",
      backgroundColor: "#fff",
      borderRadius: "8px",
      border: `2px solid ${color}`,
      textAlign: "center"
    }}>
      <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: color }}>{value}</div>
    </div>
  );
}
