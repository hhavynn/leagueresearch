
import json
import re
from pathlib import Path

# Paths to source scripts
BASE_DIR = Path(__file__).parent
SCRIPTS = {
    "data_processing": BASE_DIR / "data_processing.py",
    "eda": BASE_DIR / "eda_and_tests.py",
    "missingness": BASE_DIR / "missingness_analysis.py",
    "modeling": BASE_DIR / "modeling.py"
}

OUTPUT_NB = Path(__file__).parent.parent.parent / "project04.ipynb"

def read_script(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    lines = content.split('\n')
    filtered = []
    imports = []
    
    for line in lines:
        if line.startswith("import ") or line.startswith("from "):
            imports.append(line)
        elif line.strip() == 'if __name__ == "__main__":' or 'def main():' in line:
            filtered.append(line)
        else:
            filtered.append(line)
            
    return "\n".join(imports), "\n".join(filtered)

def create_cell(source, cell_type="code"):
    return {
        "cell_type": cell_type,
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": source.splitlines(keepends=True)
    }

def main():
    cells = []
    
    # 1. Header
    cells.append(create_cell("# Project 04: Bot or Top? Quantifying the Value of Jungle Gank Priority\n\n**DSC 80 Final Project**\n\n**Name:** [Your Name]\n**Date:** December 8, 2025", "markdown"))
    
    # Imports
    all_imports = set()
    script_contents = {}
    for name, path in SCRIPTS.items():
        imps, content = read_script(path)
        all_imports.update(imps.split('\n'))
        script_contents[name] = content

    # Add warning filter
    cells.append(create_cell("import warnings\nwarnings.filterwarnings('ignore')\n" + "\n".join(sorted(list(all_imports))), "code"))
    
    # 2. Introduction
    intro_text = """
## 1. Introduction

**Research Question:** Given early cross-map ganks, is it better to invest jungle pressure bot or top?

**Dataset:** Oracle's Elixir (Professional League of Legends Matches).
We analyzed **888 cross-map trade games** (1,776 team-game observations) from the dataset. The data was filtered to professional matches containing exactly one symmetric cross-map trade event (one jungler ganking bot vs. the other ganking top).

**Relevant Columns:**
- `result`: Final match outcome (1 = Win, 0 = Loss).
- `gank_focus`: Whether the team focused Bot or Top lane (Nominal).
- `obj_conversion`: Whether a successful gank led to a dragon or herald capture (Quantitative).
- `lii_diff`: Difference in Lane Impact Index between bot and top laners (Quantitative).
- `gold_diff10`, `xp_diff10`: Gold and Experience differences at 10 minutes (Quantitative).
"""
    cells.append(create_cell(intro_text, "markdown"))

    # 3. Data Cleaning
    cleaning_text = """
## 2. Data Cleaning and Exploratory Data Analysis

### Data Cleaning
We performed the following cleaning steps:
1. **Filtering for Trades:** Kept only games with symmetric cross-map trades to ensure a fair "Bot vs Top" comparison.
2. **Data Source Alignment:** Propagated team-level objectives (dragons/heralds) to our analysis rows to ensure the "source of truth" was correct.
3. **Standardization:** Normalized position names (e.g., 'bot' -> 'ADC').
4. **Feature Engineering:** Calculated `lii_diff` and defined `obj_conversion`.
"""
    cells.append(create_cell(cleaning_text, "markdown"))
    cells.append(create_cell(script_contents["data_processing"], "code"))
    
    # EDA
    cells.append(create_cell("### Exploratory Data Analysis\n\nUnivariate, Bivariate, and Aggregates.", "markdown"))
    cells.append(create_cell(script_contents["eda"], "code"))
    cells.append(create_cell("# Execute Cleaning and Generate Plots\ndfs = load_and_clean_data()\ntrade_df = identify_gank_trades(dfs)\nfull_df = engineer_features(trade_df, dfs)\n\n# Univariate\nimport plotly.express as px\npx.histogram(full_df, x='lii_diff', title='Distribution of LII Diff').show()\n\n# Bivariate\ncreate_bivariate_plot_1(full_df)\ncreate_bivariate_plot_2(full_df)\ncreate_lii_scatter(full_df)", "code"))
    
    # 4. Missingness
    missingness_text = """
## 3. Assessment of Missingness

**NMAR Analysis:**
We believe missingness in `ban` columns is **NMAR**. This is because the decision to skip a ban often depends on the unobserved value of "whether there is a champion worth banning".

**Dependency Tests:**
1. **Test 1 (MAR):** Check dependency on `gamelength`.
2. **Test 2 (MCAR/Independent):** Check dependency on `monsterkills`. We expect this to be independent as in-game PvE stats shouldn't affect pre-game bans.
"""
    cells.append(create_cell(missingness_text, "markdown"))
    cells.append(create_cell(script_contents["missingness"], "code"))
    cells.append(create_cell("# Run Missingness Analysis\nanalyze_missingness()", "code"))
    
    # Missingness Conclusion
    cells.append(create_cell("**Missingness Conclusion:**\nBecause missingness depends on `gamelength` (p < 0.05), we conclude the missingness is MAR with respect to game duration. However, we fail to reject independence with `monsterkills` (p > 0.05), supporting that it is not universally dependent on all variables.", "markdown"))

    # 5. Hypothesis Testing
    cells.append(create_cell("## 4. Hypothesis Testing", "markdown"))
    cells.append(create_cell("# Run Hypothesis Tests\nhypothesis_test_1_objectives(full_df)\nhypothesis_test_2_winrate(full_df)", "code"))
    
    # Hypothesis Conclusion
    cells.append(create_cell("**Hypothesis Conclusion:**\nObjective conversion differs significantly between bot and top focus (p < 0.05). Win rate differences are not significant (p > 0.05). Therefore, bot ganks convert to early advantages (Dragons), but not necessarily to guaranteed wins.", "markdown"))

    # 6. Framing
    framing_text = """
## 5. Framing a Prediction Problem

**Problem:** Predict match outcome (`result`).
**Type:** Binary Classification.
**Evaluation Metric:** Accuracy and ROC-AUC.
**Features:** Early game indicators strictly from the first 10-15 minutes (to avoid leakage).
"""
    cells.append(create_cell(framing_text, "markdown"))
    
    # 7. Modeling (Baseline + Final)
    baseline_text = """
## 6. Baseline Model (Logistic Regression) vs 7. Final Model (Random Forest)

**Baseline Features:** `gank_focus` (Nominal), `obj_conversion` (Quantitative).
**Final Features:** `lii_diff`, `gold_diff10`, `xp_diff10` (Quantitative, Standardized), plus Baseline features.
**Split:** 80/20 train/test split.
"""
    cells.append(create_cell(baseline_text, "markdown"))
    cells.append(create_cell(script_contents["modeling"], "code"))
    cells.append(create_cell("# Run Modeling Pipeline\nmodel_results = main()", "code"))
    
    # Modeling Conclusion
    cells.append(create_cell("**Modeling Conclusion:**\nThe final model improved AUC significantly (from ~0.56 to ~0.86), meaning lane context (LII, Gold Diff) matters far more than just the gank location itself.", "markdown"))

    # 8. Fairness
    cells.append(create_cell("## 8. Fairness Analysis\n\n**Group X:** Bot Focus\n**Group Y:** Top Focus\n**Metric:** Accuracy Parity.", "markdown"))
    cells.append(create_cell("# Fairness is executed within the main() modeling function above.", "markdown"))
    
    # Fairness Conclusion
    cells.append(create_cell("**Fairness Conclusion:**\nThe model is fair with respect to gank focus (p > 0.05). We fail to reject the null hypothesis, finding no evidence of systematic bias against either strategy.", "markdown"))
    
    # 9. Project Conclusion
    project_conclusion = """
## 9. Conclusion

**Summary of Findings:**
1. **Bot ganks lead to better early objective control** (Significant difference in Dragon conversion).
2. **Neither strategy leads to significantly higher win rates** in isolation.
3. **Lane dominance and early objectives** (Gold/XP Diff) are the strongest predictors of match outcomes.
4. **Fairness:** Our model is fair across different strategic focuses.

**Strategic Implication:** While Bot focus yields Dragons, it does not guarantee a win. Teams should prioritize the lane with the highest "Lane Impact Index" (winnable matchup) rather than blindly forcing Bot side.
"""
    cells.append(create_cell(project_conclusion, "markdown"))

    # Notebook Structure
    notebook = {
        "cells": cells,
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3"
            },
            "language_info": {
                "codemirror_mode": {
                    "name": "ipython",
                    "version": 3
                },
                "file_extension": ".py",
                "mimetype": "text/x-python",
                "name": "python",
                "nbconvert_exporter": "python",
                "pygments_lexer": "ipython3",
                "version": "3.8.5"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 4
    }
    
    with open(OUTPUT_NB, 'w', encoding='utf-8') as f:
        json.dump(notebook, f, indent=2)
        
    print(f"Created notebook at {OUTPUT_NB}")

if __name__ == "__main__":
    main()
