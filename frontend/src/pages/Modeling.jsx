import { useState, useEffect } from "react";

export default function Modeling() {
    const [modelResults, setModelResults] = useState(null);

    useEffect(() => {
        fetch(import.meta.env.BASE_URL + "data/model_results.json")
            .then(res => res.json())
            .then(data => setModelResults(data))
            .catch(err => console.error("Error loading model results:", err));
    }, []);

    if (!modelResults) {
        return <div>Loading...</div>;
    }

    const { baseline, final: finalModel, feature_importance, fairness } = modelResults;

    return (
        <div>
            <h2 style={{ marginBottom: "1.5rem", fontSize: "2rem" }}>Modeling & Fairness Analysis</h2>

            {/* Step 5: Framing a Prediction Problem */}
            <section style={{ marginBottom: "3rem" }}>
                <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>Framing a Prediction Problem</h3>
                <div style={{ backgroundColor: "#f9fafb", padding: "1.5rem", borderRadius: "8px", lineHeight: "1.75" }}>
                    <p style={{ marginBottom: "1rem" }}>
                        <strong>Prediction Problem:</strong> predict the outcome of a match (Win/Loss) based on early game lane dynamics and jungle pathing decisions.
                    </p>
                    <p style={{ marginBottom: "1rem" }}>
                        <strong>Type:</strong> Binary Classification.
                    </p>
                    <p style={{ marginBottom: "1rem" }}>
                        <strong>Response Variable:</strong> <code>result</code> (1 for Win, 0 for Loss). We chose this because the ultimate goal of any strategy (like ganking bot vs top) is to win the game.
                    </p>
                    <p>
                        <strong>Evaluation Metric:</strong> We use <strong>AUC (Area Under ROC Curve)</strong> and Accuracy. We prioritized AUC because it provides a better measure of the model's ability to distinguish between classes independent of the decision threshold, which is crucial given the complexity of League of Legends game states.
                    </p>
                    <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#6b7280" }}>
                        *Time of Prediction: 10 minutes (using features available at early game).
                    </p>
                </div>
            </section>

            {/* Step 6 & 7: Baseline and Final Models */}
            <section style={{ marginBottom: "3rem" }}>
                <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>Baseline & Final Model</h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                    {/* Baseline Model */}
                    <div style={{
                        padding: "1.5rem",
                        backgroundColor: "#f9fafb",
                        borderRadius: "12px",
                        border: "2px solid #e5e7eb"
                    }}>
                        <h4 style={{ marginBottom: "1rem", color: "#1f2937" }}>Baseline Model (Step 6)</h4>
                        <div style={{ marginBottom: "1rem", color: "#6b7280", fontSize: "0.875rem" }}>
                            <strong>Algorithm:</strong> Logistic Regression<br />
                            <strong>Features:</strong> 2 quantitative features (`gank_focus` encoded, `obj_conversion`).<br />
                            <strong>Encoding:</strong> OneHotEncoding for nominal `gank_focus`.
                        </div>
                        <div style={{ display: "grid", gap: "0.75rem" }}>
                            <MetricRow label="AUC" value={baseline.auc.toFixed(4)} />
                            <MetricRow label="Accuracy" value={(baseline.accuracy * 100).toFixed(2) + "%"} />
                        </div>
                    </div>

                    {/* Final Model */}
                    <div style={{
                        padding: "1.5rem",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        borderRadius: "12px",
                        color: "#fff"
                    }}>
                        <h4 style={{ marginBottom: "1rem" }}>Final Model (Step 7)</h4>
                        <div style={{ marginBottom: "1rem", opacity: 0.9, fontSize: "0.875rem" }}>
                            <strong>Algorithm:</strong> Random Forest Classifier<br />
                            <strong>New Features:</strong> `lii_diff` (Lane Impact Index), `xp_diff`, `gold_diff` at 10 (StandardScaled).<br />
                            <strong>Tuning:</strong> GridSearchCV for `max_depth` and `n_estimators`.
                        </div>
                        <div style={{ display: "grid", gap: "0.75rem" }}>
                            <MetricRow label="AUC" value={finalModel.auc.toFixed(4)} light />
                            <MetricRow label="Accuracy" value={(finalModel.accuracy * 100).toFixed(2) + "%"} light />
                        </div>
                    </div>
                </div>

                <div style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    backgroundColor: "#e8f5e9",
                    borderRadius: "8px",
                    border: "2px solid #4CAF50"
                }}>
                    <strong>Improvement Analysis:</strong> The Final Model achieved a
                    <strong> {((finalModel.auc - baseline.auc) * 100).toFixed(2)}% </strong>
                    improvement in AUC. The addition of granular lane state features (`lii_diff`, `xp_diff`) allowed the Random Forest to capture non-linear interactions better than the simple baseline.
                </div>
            </section>

            {/* Feature Importance */}
            <section style={{ marginBottom: "3rem" }}>
                <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>Feature Importance</h3>
                <p style={{ color: "#6b7280", marginBottom: "1rem", lineHeight: "1.75" }}>
                    The Random Forest model identified these features as most predictive of winning:
                </p>

                <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "1.5rem" }}>
                    {Object.entries(feature_importance)
                        .slice(0, 5)
                        .map(([feature, importance], index) => (
                            <div key={feature} style={{ marginBottom: "0.75rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                    <span style={{ fontSize: "0.875rem", color: "#374151" }}>{index + 1}. {feature}</span>
                                    <span style={{ fontSize: "0.875rem", fontWeight: "bold", color: "#667eea" }}>
                                        {(importance * 100).toFixed(2)}%
                                    </span>
                                </div>
                                <div style={{
                                    height: "8px",
                                    backgroundColor: "#e5e7eb",
                                    borderRadius: "4px",
                                    overflow: "hidden"
                                }}>
                                    <div style={{
                                        height: "100%",
                                        width: `${importance * 100}%`,
                                        background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)"
                                    }} />
                                </div>
                            </div>
                        ))}
                </div>
            </section>

            {/* Step 8: Fairness Analysis */}
            <section>
                <h3 style={{ color: "#667eea", marginBottom: "1rem" }}>Fairness Analysis</h3>
                <div style={{ backgroundColor: "#f9fafb", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem", lineHeight: "1.75" }}>
                    <p style={{ marginBottom: "0.5rem" }}><strong>Group X:</strong> Bot-focus games. <strong>Group Y:</strong> Top-focus games.</p>
                    <p style={{ marginBottom: "0.5rem" }}><strong>Evaluation Metric:</strong> Accuracy.</p>
                    <p style={{ marginBottom: "0.5rem" }}><strong>Null Hypothesis:</strong> The model is fair; accuracy is the same for both groups.</p>
                    <p><strong>Alternative Hypothesis:</strong> The model is unfair; accuracies differ significantly.</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                    <FairnessCard title="Bot-Focus Accuracy" value={(fairness.bot_accuracy * 100).toFixed(2) + "%"} color="#4CAF50" />
                    <FairnessCard title="Top-Focus Accuracy" value={(fairness.top_accuracy * 100).toFixed(2) + "%"} color="#FF9800" />
                    <FairnessCard
                        title="Accuracy Difference"
                        value={(Math.abs(fairness.accuracy_difference) * 100).toFixed(2) + "%"}
                        color="#2196F3"
                    />
                    <FairnessCard
                        title="Fairness P-Value"
                        value={fairness.p_value.toFixed(4)}
                        color={fairness.is_fair ? "#4CAF50" : "#F44336"}
                    />
                </div>

                <div style={{
                    padding: "1.5rem",
                    backgroundColor: fairness.is_fair ? "#e8f5e9" : "#ffebee",
                    borderRadius: "8px",
                    border: `2px solid ${fairness.is_fair ? "#4CAF50" : "#F44336"}`
                }}>
                    <strong>Conclusion:</strong> {fairness.is_fair
                        ? "✅ The model is FAIR — we failed to reject the null hypothesis (p > 0.05)."
                        : "⚠️ The model shows UNFAIRNESS — we reject the null hypothesis (p < 0.05)."}
                </div>
            </section>
        </div>
    );
}

function MetricRow({ label, value, light = false }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem", backgroundColor: light ? "rgba(255,255,255,0.2)" : "#fff", borderRadius: "6px" }}>
            <span style={{ color: light ? "#fff" : "#6b7280" }}>{label}</span>
            <span style={{ fontWeight: "bold", color: light ? "#fff" : "#1f2937" }}>{value}</span>
        </div>
    );
}

function FairnessCard({ title, value, color }) {
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
