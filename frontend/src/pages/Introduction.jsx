export default function Introduction() {
  return (
    <div>
      <h2 style={{ marginBottom: "1rem", fontSize: "2rem" }}>Introduction</h2>

      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "0.75rem" }}>Research Question</h3>
        <blockquote style={{
          borderLeft: "4px solid #667eea",
          paddingLeft: "1rem",
          fontStyle: "italic",
          color: "#374151",
          fontSize: "1.125rem",
          margin: "1rem 0"
        }}>
          Given early cross-map ganks, is it better to invest jungle pressure bot or top?
        </blockquote>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "0.75rem" }}>What are Cross-Map Trades?</h3>
        <p style={{ lineHeight: "1.75", color: "#4b5563" }}>
          In professional League of Legends, "cross-map trades" occur when both junglers apply pressure on opposite sides of the map simultaneously.
          For example, one jungler ganks bot lane while the enemy jungler ganks top lane. This creates a strategic dilemma:
          <strong> which lane focus provides more value?</strong>
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "0.75rem" }}>Why This Matters</h3>
        <ul style={{ lineHeight: "1.75", color: "#4b5563" }}>
          <li><strong>For Teams & Analysts:</strong> Helps quantify the value of bot-centric vs top-centric early-game plans</li>
          <li><strong>For Fans:</strong> Answers the classic debate: "Was that cross-map trade worth?"</li>
          <li><strong>For Organizations:</strong> Informs jungle pathing priorities and resource allocation strategies</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "0.75rem" }}>Dataset</h3>
        <p style={{ lineHeight: "1.75", color: "#4b5563" }}>
          We analyzed <strong>888 cross-map trade games</strong> (1,776 team-game observations) from Oracle's Elixir's
          professional League of Legends dataset, spanning multiple regions and years. Each game was identified by detecting
          early jungler involvement in opposing lanes during the first 10 minutes.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "0.75rem" }}>Relevant Columns</h3>
        <p style={{ lineHeight: "1.75", color: "#4b5563", marginBottom: "1rem" }}>
          The key features used in our analysis include:
        </p>
        <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "0.75rem", fontWeight: "bold", width: "150px" }}>result</td>
                <td style={{ padding: "0.75rem", color: "#4b5563" }}>Binary indicator of game outcome (1 = Win, 0 = Loss).</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "0.75rem", fontWeight: "bold" }}>gank_focus</td>
                <td style={{ padding: "0.75rem", color: "#4b5563" }}>The primary lane (Bot or Top) targeted by the jungler in the early game.</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "0.75rem", fontWeight: "bold" }}>obj_conversion</td>
                <td style={{ padding: "0.75rem", color: "#4b5563" }}>Whether the team secured a Drag or Herald shortly after the gank phase.</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "0.75rem", fontWeight: "bold" }}>lii_diff</td>
                <td style={{ padding: "0.75rem", color: "#4b5563" }}>Lane Impact Index Difference: Measures the relative performance gap between bot and top lanes properly weighted.</td>
              </tr>
              <tr>
                <td style={{ padding: "0.75rem", fontWeight: "bold" }}>xp_diff, gold_diff</td>
                <td style={{ padding: "0.75rem", color: "#4b5563" }}>Experience and Gold differences at 10 and 15 minutes.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 style={{ color: "#667eea", marginBottom: "0.75rem" }}>Our Approach</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
          {[
            { title: "1. Data Processing", desc: "Identified cross-map trades using early-game stats" },
            { title: "2. EDA", desc: "Explored objective conversion and win rates by lane focus" },
            { title: "3. Hypothesis Tests", desc: "Compared bot vs top gank value statistically" },
            { title: "4. Prediction Models", desc: "Built models to predict wins from early gank patterns" }
          ].map(({ title, desc }) => (
            <div key={title} style={{
              padding: "1rem",
              backgroundColor: "#f3f4f6",
              borderRadius: "8px",
              border: "1px solid #e5e7eb"
            }}>
              <h4 style={{ marginBottom: "0.5rem", color: "#1f2937" }}>{title}</h4>
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
