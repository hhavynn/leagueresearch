import { useState, useEffect } from "react";
import Plotly from "react-plotly.js";

// Handle Vite/Rollup default export interop
const Plot = Plotly.default || Plotly;

export default function HypothesisTesting() {
    const [testResults, setTestResults] = useState(null);
    const [plots, setPlots] = useState({});

    useEffect(() => {
        // Load test results
        fetch("/data/hypothesis_tests.json")
            .then(res => res.json())
            .then(data => setTestResults(data))
            .catch(err => console.error("Error loading test results:", err));

        // Load plots
        ["test1_objectives.json", "test2_winrate.json"].forEach(filename => {
            fetch(`/data/${filename}`)
                .then(res => res.json())
                .then(data => setPlots(prev => ({ ...prev, [filename]: data })))
                .catch(err => console.error(`Error loading ${filename}:`, err));
        });
    }, []);

    if (!testResults) {
        return <div>Loading...</div>;
    }

    const { test1, test2 } = testResults;

    return (
        <div>
            <h2 style={{ marginBottom: "1.5rem", fontSize: "2rem" }}>Hypothesis Testing</h2>

            <section style={{ marginBottom: "2rem" }}>
                <p style={{ lineHeight: "1.75", color: "#4b5563" }}>
                    We conducted two permutation tests to determine if there's a statistically significant difference
                    between bot-focused and top-focused gank strategies.
                </p>
            </section>

            {/* Test 1: Objectives */}
            <section style={{ marginBottom: "3rem" }}>
                <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>Test 1: Objective Conversion Rate</h3>

                <div style={{ padding: "1.5rem", backgroundColor: "#f9fafb", borderRadius: "8px", marginBottom: "1.5rem" }}>
                    <div style={{ marginBottom: "1rem" }}>
                        <strong>Null Hypothesis (H₀):</strong> The average objective conversion rate is the same for bot-focus and top-focus games.
                    </div>
                    <div>
                        <strong>Alternative Hypothesis (H₁):</strong> Bot-focus games have a higher objective conversion rate than top-focus games.
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                    <ResultCard title="Bot Mean" value={(test1.bot_mean * 100).toFixed(1) + "%"} color="#4CAF50" />
                    <ResultCard title="Top Mean" value={(test1.top_mean * 100).toFixed(1) + "%"} color="#FF9800" />
                    <ResultCard title="Observed Difference" value={(test1.observed_stat * 100).toFixed(2) + "%"} color="#2196F3" />
                    <ResultCard
                        title="P-Value"
                        value={test1.p_value.toFixed(4)}
                        color={test1.p_value < 0.05 ? "#F44336" : "#9E9E9E"}
                    />
                </div>

                <div style={{
                    padding: "1rem",
                    backgroundColor: test1.interpretation === "Significant" ? "#e8f5e9" : "#fff3e0",
                    borderRadius: "8px",
                    border: `2px solid ${test1.interpretation === "Significant" ? "#4CAF50" : "#FF9800"}`,
                    marginBottom: "1.5rem"
                }}>
                    <strong>Result:</strong> {test1.interpretation}
                    {test1.p_value < 0.05
                        ? " — We reject the null hypothesis. There is evidence that bot-focus games have different objective conversion rates."
                        : " — We fail to reject the null hypothesis. No significant difference in objective conversion rates."}
                </div>

                {plots["test1_objectives.json"] && (
                    <div style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "1rem" }}>
                        <Plot
                            data={plots["test1_objectives.json"].data}
                            layout={{ ...plots["test1_objectives.json"].layout, autosize: true }}
                            useResizeHandler={true}
                            style={{ width: "100%" }}
                        />
                    </div>
                )}
            </section>

            {/* Test 2: Win Rate */}
            <section>
                <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>Test 2: Win Rate</h3>

                <div style={{ padding: "1.5rem", backgroundColor: "#f9fafb", borderRadius: "8px", marginBottom: "1.5rem" }}>
                    <div style={{ marginBottom: "1rem" }}>
                        <strong>Null Hypothesis (H₀):</strong> The win rate is the same for bot-focus and top-focus games.
                    </div>
                    <div>
                        <strong>Alternative Hypothesis (H₁):</strong> The win rates differ between bot-focus and top-focus games.
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                    <ResultCard title="Bot Win Rate" value={(test2.bot_winrate * 100).toFixed(1) + "%"} color="#4CAF50" />
                    <ResultCard title="Top Win Rate" value={(test2.top_winrate * 100).toFixed(1) + "%"} color="#FF9800" />
                    <ResultCard title="Observed Difference" value={(test2.observed_stat * 100).toFixed(2) + "%"} color="#2196F3" />
                    <ResultCard
                        title="P-Value"
                        value={test2.p_value.toFixed(4)}
                        color={test2.p_value < 0.05 ? "#F44336" : "#9E9E9E"}
                    />
                </div>

                <div style={{
                    padding: "1rem",
                    backgroundColor: test2.interpretation === "Significant" ? "#e8f5e9" : "#fff3e0",
                    borderRadius: "8px",
                    border: `2px solid ${test2.interpretation === "Significant" ? "#4CAF50" : "#FF9800"}`,
                    marginBottom: "1.5rem"
                }}>
                    <strong>Result:</strong> {test2.interpretation}
                    {test2.p_value < 0.05
                        ? " — We reject the null hypothesis. There is evidence that gank focus impacts win rate."
                        : " — We fail to reject the null hypothesis. No significant difference in win rates."}
                </div>

                {plots["test2_winrate.json"] && (
                    <div style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "1rem" }}>
                        <Plot
                            data={plots["test2_winrate.json"].data}
                            layout={{ ...plots["test2_winrate.json"].layout, autosize: true }}
                            useResizeHandler={true}
                            style={{ width: "100%" }}
                        />
                    </div>
                )}
            </section>
        </div>
    );
}

function ResultCard({ title, value, color }) {
    return (
        <div style={{
            padding: "1rem",
            backgroundColor: "#fff",
            borderRadius: "8px",
            textAlign: "center",
            border: `2px solid ${color}`,
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}>
            <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>{title}</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: color }}>{value}</div>
        </div>
    );
}
