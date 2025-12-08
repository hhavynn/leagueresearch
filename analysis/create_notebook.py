
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
    # Remove imports (simple heuristic) and main block
    lines = content.split('\n')
    filtered = []
    imports = []
    
    for line in lines:
        if line.startswith("import ") or line.startswith("from "):
            imports.append(line)
        elif line.strip() == 'if __name__ == "__main__":' or 'def main():' in line:
            # logic to skip main block would be complex, let's just keep functions and globals
            # For this simple pass, we'll keep everything but imports, then add imports at top
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
    
    # Header
    cells.append(create_cell("# Project 04: Bot or Top? Quantifying the Value of Jungle Gank Priority\n\n**DSC 80 Final Project**", "markdown"))
    
    # 1. Introduction
    intro_text = """
## Step 1: Introduction

**Research Question:** Given early cross-map ganks, is it better to invest jungle pressure bot or top?

**Dataset:** Oracle's Elixir (Professional League of Legends Matches).
We analyze 888 cross-map trade games.

**Relevant Columns:**
- `result`: Win/Loss (1/0)
- `gank_focus`: Bot or Top
- `obj_conversion`: Secured Dragon/Herald
- `lii_diff`: Lane Impact Index Difference
"""
    cells.append(create_cell(intro_text, "markdown"))
    
    # Imports
    all_imports = set()
    script_contents = {}
    
    for name, path in SCRIPTS.items():
        imps, content = read_script(path)
        all_imports.update(imps.split('\n'))
        script_contents[name] = content

    cells.append(create_cell("\n".join(sorted(list(all_imports))), "code"))
    
    # 2. Data Cleaning
    cells.append(create_cell("## Step 2: Cleaning & Exploratory Data Analysis", "markdown"))
    cells.append(create_cell("### Data Cleaning Code", "markdown"))
    cells.append(create_cell(script_contents["data_processing"], "code"))
    
    cells.append(create_cell("# Execute Cleaning\ndfs = load_and_clean_data()\ntrade_df = identify_gank_trades(dfs)\nfull_df = engineer_features(trade_df, dfs)\nfull_df.head()", "code"))
    
    # EDA
    cells.append(create_cell("### Exploratory Data Analysis", "markdown"))
    cells.append(create_cell(script_contents["eda"], "code"))
    cells.append(create_cell("# Generate Plots\ncreate_bivariate_plot_1(full_df)\ncreate_bivariate_plot_2(full_df)\ncreate_lii_scatter(full_df)", "code"))
    cells.append(create_cell("# Univariate Analysis\nimport plotly.express as px\npx.histogram(full_df, x='lii_diff', title='Distribution of LII Diff').show()", "code"))
    
    # 3. Missingness
    cells.append(create_cell("## Step 3: Assessment of Missingness", "markdown"))
    cells.append(create_cell(script_contents["missingness"], "code"))
    cells.append(create_cell("# Run Missingness Analysis\nanalyze_missingness()", "code"))
    
    # 4. Hypothesis Testing
    cells.append(create_cell("## Step 4: Hypothesis Testing", "markdown"))
    cells.append(create_cell("# Run Hypothesis Tests\nhypothesis_test_1_objectives(full_df)\nhypothesis_test_2_winrate(full_df)", "code"))

    # 5. Framing
    framing_text = """
## Step 5: Framing a Prediction Problem

**Problem:** Predict match outcome (Win/Loss).
**Type:** Binary Classification.
**Metric:** AUC and Accuracy.
**Features:** Early game indicators (gank focus, objective conversion, lane stats at 10m).
"""
    cells.append(create_cell(framing_text, "markdown"))
    
    # 6. Baseline
    cells.append(create_cell("## Step 6: Baseline Model", "markdown"))
    cells.append(create_cell(script_contents["modeling"], "code"))
    cells.append(create_cell("# Run Modeling Pipeline (Baseline & Final)\nmodel_results = main()", "code"))
    
    # 7. Final Model
    cells.append(create_cell("## Step 7: Final Model", "markdown"))
    cells.append(create_cell("See execution above for Final Model results (Random Forest).", "markdown"))
    
    # 8. Fairness
    cells.append(create_cell("## Step 8: Fairness Analysis", "markdown"))
    cells.append(create_cell("See execution above for Fairness Analysis results.", "markdown"))

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
