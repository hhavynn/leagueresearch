import { useState, useEffect } from "react";
import Plotly from "react-plotly.js";

// Handle Vite/Rollup default export interop
const Plot = Plotly.default || Plotly;

export default function EDA() {
  const [stats, setStats] = useState(null);
  const [plots, setPlots] = useState({});
  const [headData, setHeadData] = useState([]);
  const [pivotData, setPivotData] = useState([]);

  useEffect(() => {
    // Load summary stats
    fetch("/data/summary_stats.json")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Error loading stats:", err));

    // Load extra data
    fetch("/data/head_data.json")
      .then(res => res.json())
      .then(data => setHeadData(data))
      .catch(err => console.error("Error loading head data:", err));

    fetch("/data/pivot_table.json")
      .then(res => res.json())
      .then(data => setPivotData(data))
      .catch(err => console.error("Error loading pivot data:", err));

    // Load plots
    ["plot_obj_conversion.json", "plot_winrate.json", "plot_lii_scatter.json", "plot_univariate.json"].forEach(filename => {
      fetch(`/data/${filename}`)
        .then(res => res.json())
        .then(data => setPlots(prev => ({ ...prev, [filename]: data })))
        .catch(err => console.error(`Error loading ${filename}:`, err));
    });
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem", fontSize: "2rem" }}>Cleaning & Exploratory Data Analysis</h2>

      {/* Step 2: Data Cleaning */}
      <section style={{ marginBottom: "3rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>Data Cleaning</h3>
        <div style={{ backgroundColor: "#f9fafb", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem", lineHeight: "1.7" }}>
          <p style={{ marginBottom: "1rem" }}>We performed the following cleaning steps on the Oracle's Elixir dataset:</p>
          <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
            <li>Standardized position names (e.g., converted 'top', 'TOP' to 'TOP', 'bot', 'adc' to 'ADC').</li>
            <li>Filtered dataset to relevant rows (player-level vs team-level) depending on analysis needs.</li>
            <li>Handled missing values for objective columns (dragons, heralds) by aggregating max values from team-level rows.</li>
            <li>Engineered the `gank_focus` feature by analyzing jungle proximity kills/assists and identifying symmetric cross-map trade games.</li>
          </ul>
        </div>
        <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
          <h4 style={{ padding: "0.75rem", backgroundColor: "#f3f4f6", margin: 0, borderBottom: "1px solid #e5e7eb" }}>Cleaned Data (First 5 Rows)</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                {headData.length > 0 && Object.keys(headData[0]).map(key => (
                  <th key={key} style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e5e7eb", fontWeight: "600" }}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {headData.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < headData.length - 1 ? "1px solid #e5e7eb" : "none" }}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} style={{ padding: "0.75rem" }}>{val !== null ? val.toString() : "null"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Step 2: Univariate Analysis */}
      <section style={{ marginBottom: "3rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>Univariate Analysis</h3>
        <p style={{ marginBottom: "1rem", color: "#4b5563" }}>
          Distribution of the Lane Impact Index Difference (Bot - Top). Most games cluster near zero, indicating generally balanced lane states,
          but outliers exist where one lane dominated significantly.
        </p>
        {plots["plot_univariate.json"] && (
          <div style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "1rem" }}>
            <Plot data={plots["plot_univariate.json"].data} layout={{ ...plots["plot_univariate.json"].layout, autosize: true }} useResizeHandler={true} style={{ width: "100%" }} />
          </div>
        )}
      </section>

      {/* Step 2: Bivariate Analysis */}
      <section style={{ marginBottom: "3rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>Bivariate Analysis</h3>

        <div style={{ marginBottom: "2rem" }}>
          <h4 style={{ marginBottom: "0.5rem" }}>Objective Conversion by Gank Focus</h4>
          {plots["plot_obj_conversion.json"] && (
            <div style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "1rem" }}>
              <Plot data={plots["plot_obj_conversion.json"].data} layout={{ ...plots["plot_obj_conversion.json"].layout, autosize: true }} useResizeHandler={true} style={{ width: "100%" }} />
            </div>
          )}
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#6b7280" }}>
            This bar chart shows the average objective conversion rate for Bot vs Top focused ganks, grouped by whether the team won or lost.
          </p>
        </div>

        <div>
          <h4 style={{ marginBottom: "0.5rem" }}>Win Probability vs Lane Impact Index</h4>
          {plots["plot_lii_scatter.json"] && (
            <div style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "1rem" }}>
              <Plot data={plots["plot_lii_scatter.json"].data} layout={{ ...plots["plot_lii_scatter.json"].layout, autosize: true }} useResizeHandler={true} style={{ width: "100%" }} />
            </div>
          )}
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#6b7280" }}>
            Shows the relationship between lane advantage (LII Difference) and win probability (binned).
          </p>
        </div>
      </section>

      {/* Step 2: Interesting Aggregates */}
      <section style={{ marginBottom: "3rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>Interesting Aggregates</h3>
        <p style={{ marginBottom: "1rem", color: "#4b5563" }}>
          Pivot Table: Win Rate grouped by Side (Blue/Red) and Gank Focus.
        </p>
        <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Side</th>
                <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Gank Focus</th>
                <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {pivotData.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < pivotData.length - 1 ? "1px solid #e5e7eb" : "none" }}>
                  <td style={{ padding: "0.75rem" }}>{row.side}</td>
                  <td style={{ padding: "0.75rem" }}>{row.gank_focus}</td>
                  <td style={{ padding: "0.75rem" }}>{(row.result * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Key Stats Summary */}
      <section style={{ marginBottom: "2rem", padding: "1.5rem", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
        <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>Overall Dataset Stats</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <StatCard title="Total Trade Games" value={stats.total_trade_games} />
          <StatCard title="Bot Focus Count" value={stats.bot_focus_count} />
          <StatCard title="Top Focus Count" value={stats.top_focus_count} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={{ padding: "1rem", backgroundColor: "#fff", borderRadius: "8px", textAlign: "center", border: "1px solid #e5e7eb" }}>
      <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937" }}>{value}</div>
    </div>
  );
}

function MetricCard({ title, value, color }) {
  return (
    <div style={{
      padding: "1.5rem",
      backgroundColor: "#fff",
      borderRadius: "8px",
      border: `2px solid ${color}`,
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    }}>
      <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: color }}>{value}</div>
    </div>
  );
}
