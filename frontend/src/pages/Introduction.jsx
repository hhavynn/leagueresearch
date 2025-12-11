import { useState, useEffect } from "react";

export default function Introduction() {
  return (
    <div>
      <h2 style={{ marginBottom: "1rem", fontSize: "2rem" }}>Introduction</h2>

      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "0.75rem" }}>Research Question</h3>
        <p style={{ lineHeight: "1.75", color: "#4b5563", marginBottom: "1rem" }}>
          This project applies core data science techniques—such as permutation testing, modeling, and fairness analysis—to evaluate whether early game gank strategy influences match outcomes.
        </p>
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
        <ul style={{ lineHeight: "1.75", color: "#4b5563", marginLeft: "1.5rem" }}>
          <li><strong>For Teams & Analysts:</strong> Helps quantify the value of bot-centric vs top-centric early-game plans</li>
          <li><strong>For Fans:</strong> Answers the classic debate: "Was that cross-map trade worth?"</li>
          <li><strong>For Organizations:</strong> Informs jungle pathing priorities and resource allocation strategies</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "0.75rem" }}>Dataset</h3>
        <p style={{ lineHeight: "1.75", color: "#4b5563" }}>
          We analyzed <strong>888 cross-map trade games</strong> (1,776 team-game observations) from Oracle's Elixir's
          professional League of Legends dataset. Each row in our dataset represents a single team's perspective during a match, enabling comparison between bot- and top-focused strategies across symmetric trade games. The dataset was filtered to professional matches containing exactly one symmetric cross-map trade event.
        </p>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "1rem", fontStyle: "italic" }}>
          Data Source: Oracle's Elixir (<a href="https://oracleselixir.com" target="_blank" rel="noopener noreferrer" style={{ color: "#667eea", textDecoration: "underline" }}>https://oracleselixir.com</a>), a widely-used platform for professional League of Legends data.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ color: "#667eea", marginBottom: "0.75rem" }}>Relevant Columns</h3>
        <p style={{ lineHeight: "1.75", color: "#4b5563", marginBottom: "1rem" }}>
          The analysis focuses on the following features:
        </p>
        <ul style={{ lineHeight: "1.75", color: "#4b5563", marginLeft: "1.5rem" }}>
          <li><strong>result</strong>: Final match outcome (1 = Win, 0 = Loss).</li>
          <li><strong>gank_focus</strong>: Whether the team focused Bot or Top lane during the early game trade.</li>
          <li><strong>obj_conversion</strong>: Whether a successful gank led to a neutral or tower objective.</li>
          <li><strong>lii_diff</strong>: Difference in Lane Impact Index (LII) between bot and top laners.</li>
          <li><strong>gold_diff10, xp_diff10</strong>: Gold and XP differences at 10 minutes.</li>
        </ul>
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
