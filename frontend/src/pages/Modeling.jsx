import { useState, useEffect } from "react";
import Plotly from "react-plotly.js";

// Handle Vite/Rollup default export interop
const Plot = Plotly.default || Plotly;

export default function Modeling() {
    const [modelResults, setModelResults] = useState(null);

    useEffect(() => {
        fetch(import.meta.env.BASE_URL + "data/model_results.json")
            .then(res => res.json())
            .then(data => setModelResults(data))
            .catch(err => console.error("Error loading model results:", err));
    }, []);

    if (!modelResults) return <div>Loading model results...</div>;

    const { baseline, final, fairness, feature_importance } = modelResults;

    const Divider = () => <div style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "3rem 0" }} />;

    return (
        <div>
            {/* Step 5: Framing */}
            <section>
                <h2 style={{ marginBottom: "1.5rem", fontSize: "2rem" }}>Framing a Prediction Problem</h2>
                <div style={{ padding: "1.5rem", backgroundColor: "#f9fafb", borderRadius: "8px", lineHeight: "1.7" }}>
                    <p style={{ marginBottom: "1rem" }}>
                        <strong>Prediction Problem:</strong> Predict the final match result (Win/Loss) based on early-game interactions (first 10 minutes).
                    </p>
                    <p style={{ marginBottom: "1rem" }}>
                        <strong>Type:</strong> Binary Classification.
                    </p>
                    <p style={{ marginBottom: "1rem" }}>
                        <strong>Response Variable:</strong> <code>result</code> (1 for Win, 0 for Loss). We chose this because the ultimate goal of any gank strategy is to win the game.
                    </p>
                    <p>
                        <strong>Evaluation Metric:</strong> We use <strong>Accuracy</strong> and <strong>ROC-AUC</strong>.
                        Accuracy gives a straightforward success rate, while ROC-AUC is robust to class imbalance (though our trade dataset is fairly balanced).
                        Features are strictly from the early game (pre-15m) to ensure no data leakage from the future outcome.
                    </p>
                </div>
            </section>

            <Divider />

            {/* Step 6: Baseline Model */}
            <section>
                <h2 style={{ marginBottom: "1.5rem", fontSize: "2rem" }}>Baseline Model</h2>
                <div style={{ marginBottom: "1.5rem", lineHeight: "1.7" }}>
                    <p>
                        Our baseline model uses <strong>Logistic Regression</strong>. We used a standard <strong>80/20 train/test split</strong> to evaluate performance on unseen data.
                    </p>
                    <ul style={{ marginLeft: "1.5rem", marginTop: "1rem" }}>
                        <li><strong>gank_focus (Nominal):</strong> One-hot encoded (Bot vs Top).</li>
                        <li><strong>obj_conversion (Quantitative):</strong> Used as-is (0 or 1).</li>
                    </ul>
                    <p style={{ marginTop: "1rem" }}>
                        This simple model tests if knowing <em>where</em> the jungler ganked and if they <em>got an objective</em> is enough to predict the win.
                    </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                    <MetricCard title="Baseline Accuracy" value={(baseline.accuracy * 100).toFixed(1) + "%"} color="#607d8b" />
                    <MetricCard title="Baseline ROC-AUC" value={baseline.auc ? baseline.auc.toFixed(3) : "N/A"} color="#607d8b" />
                </div>
            </section>

            <Divider />

            {/* Step 7: Final Model */}
            <section>
                <h2 style={{ marginBottom: "1.5rem", fontSize: "2rem" }}>Final Model</h2>
                <div style={{ marginBottom: "1.5rem", lineHeight: "1.7" }}>
                    <p>
                        Our final model uses a <strong>Random Forest Classifier</strong>, tuned via GridSearchCV (optimizing <code>max_depth</code> and <code>n_estimators</code>).
                        We maintained the same <strong>80/20 train/test split</strong> as the baseline for a fair comparison.
                    </p>
                    <p style={{ marginTop: "1rem" }}><strong>New Features Added:</strong></p>
                    <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
                        <li><strong>lii_diff (Quantitative):</strong> Standardized. Measures lane impact/dominance. A higher LII diff implies our bot/top laners are outperforming their opponents early.</li>
                        <li><strong>dragons, heralds (Quantitative):</strong> Counts of early objectives secured.</li>
                        <li><strong>gold_diff10, xp_diff10 (Quantitative):</strong> Standardized. Early economic leads are strong predictors of snowballing to a win.</li>
                    </ul>
                    <p style={{ marginTop: "1rem" }}>
                        The Random Forest captures non-linear interactions between these lane stats and the gank focus strategy.
                        The improvement in accuracy confirms that early lane state context is crucial beyond just the gank event itself.
                    </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                    <MetricCard title="Final Accuracy" value={(final.accuracy * 100).toFixed(1) + "%"} color="#4CAF50" />
                    <MetricCard title="Final ROC-AUC" value={final.auc ? final.auc.toFixed(3) : "N/A"} color="#4CAF50" />
                </div>

                {/* Feature Importance Table */}
                <div style={{ marginTop: "2rem" }}>
                    <h3 style={{ fontSize: "1.25rem", color: "#4b5563", marginBottom: "1rem" }}>Top Features</h3>
                    <div style={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                                {feature_importance && Object.entries(feature_importance)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([name, imp], i) => (
                                        <tr key={name} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                            <td style={{ padding: "0.75rem", fontWeight: "600" }}>{name}</td>
                                            <td style={{ padding: "0.75rem", textAlign: "right", color: "#6b7280" }}>{imp.toFixed(3)}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <Divider />

            {/* Step 8: Fairness Analysis */}
            <section>
                <h2 style={{ marginBottom: "1.5rem", fontSize: "2rem" }}>Fairness Analysis</h2>
                <div style={{ padding: "1.5rem", backgroundColor: "#f9fafb", borderRadius: "8px", lineHeight: "1.7", marginBottom: "1.5rem" }}>
                    <p style={{ marginBottom: "1rem" }}>
                        <strong>Question:</strong> Does our model perform equally well for games with <strong>Bot Focus</strong> vs <strong>Top Focus</strong> strategies?
                    </p>
                    <ul style={{ marginBottom: "1rem", marginLeft: "1.5rem" }}>
                        <li><strong>Group X:</strong> Bot Focus Games</li>
                        <li><strong>Group Y:</strong> Top Focus Games</li>
                        <li><strong>Evaluation Metric:</strong> Accuracy (Parity)</li>
                    </ul>
                    <p style={{ marginBottom: "1rem" }}>
                        <strong>Null Hypothesis (H₀):</strong> The accuracy is the same for both groups (any difference is due to chance).<br />
                        <strong>Alternative Hypothesis (H₁):</strong> The accuracy is significantly different between groups.
                    </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                    <MetricCard title="Bot Focus Accuracy" value={fairness.bot_accuracy ? (fairness.bot_accuracy * 100).toFixed(1) + "%" : "N/A"} color="#2196F3" />
                    <MetricCard title="Top Focus Accuracy" value={fairness.top_accuracy ? (fairness.top_accuracy * 100).toFixed(1) + "%" : "N/A"} color="#FF9800" />
                    <MetricCard title="P-Value" value={fairness.p_value ? fairness.p_value.toFixed(4) : "N/A"} color={fairness.p_value < 0.05 ? "#F44336" : "#4CAF50"} />
                </div>

                {/* Fairness Visualization */}
                <div style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
                    <h4 style={{ marginBottom: "0.5rem", color: "#667eea" }}>Accuracy by Gank Focus Group</h4>
                    <Plot
                        data={[{
                            x: ['Bot Focus', 'Top Focus'],
                            y: [fairness.bot_accuracy, fairness.top_accuracy],
                            type: 'bar',
                            marker: { color: ['#2196F3', '#FF9800'] }
                        }]}
                        layout={{
                            title: 'Model Accuracy by Group',
                            yaxis: { title: 'Accuracy', range: [0, 1] },
                            autosize: true,
                            margin: { l: 40, r: 20, t: 40, b: 30 }
                        }}
                        useResizeHandler={true}
                        style={{ width: "100%", height: "300px" }}
                    />
                </div>

                <div style={{ padding: "1rem", backgroundColor: "#e8f5e9", borderRadius: "8px", border: "1px solid #4CAF50" }}>
                    <strong>Conclusion:</strong> {fairness.p_value > 0.05
                        ? `With a p-value of ${fairness.p_value.toFixed(3)}, we fail to reject the null hypothesis. The model appears to be fair across both gank strategies.`
                        : `The p-value is ${fairness.p_value.toFixed(3)}, suggesting a significant difference in model performance between groups.`}
                </div>
            </section>
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
            textAlign: "center"
        }}>
            <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>{title}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: color }}>{value}</div>
        </div>
    );
}
