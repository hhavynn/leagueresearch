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
            We believe the missingness in `ban` columns is <strong>NMAR (Not Missing At Random)</strong>.
            This is because the decision to skip a ban often depends on the unobserved value of "whether there is a champion worth banning"
            (or if the team intentionally strategized to leave a ban slot open). Since the reason for missingness is tied to the value itself
            (or the lack of a value worth recording), it is NMAR.
          </p>
          <p style={{ marginTop: "1rem" }}>
            However, we also investigate if it is MAR (Missing At Random) by checking dependencies on other observed columns.
          </p>
        </div>
      </section>

      {/* Test 1: Dependent */}
      <section style={{ marginBottom: "3rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>Test 1: Check for Dependency (MAR)</h3>
        <p style={{ marginBottom: "1rem" }}>
          We performed a permutation test to see if missingness depends on <strong>{results.test1.dependent_col}</strong>.
        </p>
        <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#fff", borderLeft: "4px solid #2196F3" }}>
          <p><strong>Null Hypothesis (H₀):</strong> The missingness in <code>ban1</code> is independent of <code>gamelength</code>.</p>
          <p><strong>Alternative Hypothesis (H₁):</strong> The missingness in <code>ban1</code> depends on <code>gamelength</code>.</p>
        </div>
        <p style={{ marginBottom: "1.5rem", fontStyle: "italic", color: "#6b7280" }}>
          Note: A low p-value (p &lt; 0.05) suggests the missingness <strong>depends</strong> on gamelength, meaning it is <strong>not MCAR</strong> and potentially MAR.
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
          We also checked if missingness depends on <strong>{results.test2.dependent_col}</strong> (Total Monster Kills).
        </p>
        <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#fff", borderLeft: "4px solid #FF9800" }}>
          <p><strong>Null Hypothesis (H₀):</strong> The missingness in <code>ban1</code> is independent of <code>monsterkills</code>.</p>
          <p><strong>Alternative Hypothesis (H₁):</strong> The missingness in <code>ban1</code> depends on <code>monsterkills</code>.</p>
        </div>

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
          <strong>Conclusion:</strong> {results.test2.p_value > 0.05
            ? "Since the p-value is large (> 0.05), we fail to reject the null hypothesis. The missingness of bans does NOT appear to depend on monster kills, supporting the idea that it is not universally dependent on all gaming metrics."
            : "The p-value is small (< 0.05), suggesting a potential dependency even on this variable."}
        </div>
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>Interpretation & Conclusion</h3>
        <div style={{ padding: "1.5rem", backgroundColor: "#f3f4f6", borderRadius: "8px", border: "1px solid #d1d5db" }}>
          <p>
            In summary, while missingness in <code>ban1</code> could be <strong>NMAR</strong> due to strategic team choices (skipping bans), our statistical testing also supports a <strong>MAR</strong> interpretation—since it is dependent on <code>gamelength</code> but not on <code>monsterkills</code>. This suggests a mixed mechanism, but we can confidently reject MCAR.
          </p>
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
