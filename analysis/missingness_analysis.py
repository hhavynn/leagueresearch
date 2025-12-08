
"""
Missingness Analysis for DSC 80 Project
Step 3: Assessment of Missingness
"""
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import json
from pathlib import Path

# Paths
DATA_PATH = Path(__file__).parent.parent.parent / "2025_LoL_esports_match_data_from_OraclesElixir.csv"
OUTPUT_DIR = Path(__file__).parent.parent / "frontend" / "public" / "data"

def load_data():
    """Load original data to check for missingness."""
    df = pd.read_csv(DATA_PATH)
    return df

def permutation_test_missingness(df, col_missing, col_dependent, n_permutations=1000):
    """
    Perform permutation test to see if missingness of col_missing depends on col_dependent.
    Test statistic: Difference in mean (or proportion) of col_dependent 
    between 'missing' and 'not missing' groups.
    """
    # Create missing indicator
    is_missing = df[col_missing].isna()
    
    # Calculate observed statistic
    # Using Absolute Difference in Means/Proportions
    
    # Check if col_dependent is numeric or categorical
    if pd.api.types.is_numeric_dtype(df[col_dependent]):
        mean_missing = df[df[col_missing].isna()][col_dependent].mean()
        mean_not_missing = df[~df[col_missing].isna()][col_dependent].mean()
        observed_stat = abs(mean_missing - mean_not_missing)
        
        # Permutation
        combined = df[col_dependent].values
        null_stats = []
        for _ in range(n_permutations):
            shuffled = np.random.permutation(combined)
            # Split using observed missing counts
            shuffled_missing = shuffled[is_missing]
            shuffled_not_missing = shuffled[~is_missing]
            stat = abs(shuffled_missing.mean() - shuffled_not_missing.mean())
            null_stats.append(stat)
            
    else:
        # For categorical, use TVD or similar. 
        # Using simple numeric conversion if binary, else specific TVD logic.
        # Let's assume numeric for now as we usually check against numeric cols like 'game length' or 'result'
        # Or if checking against categorical 'side', convert to numeric 0/1 approx or TVD
        pass # To implement if needed
        return None, None, None

    p_value = np.mean(np.array(null_stats) >= observed_stat)
    
    return observed_stat, p_value, null_stats

def analyze_missingness():
    df = load_data()
    print(f"Dataset shape: {df.shape}")
    
    # Check for missing values
    missing_counts = df.isna().sum()
    missing_cols = missing_counts[missing_counts > 0]
    print("Columns with missing values:\n", missing_cols.sort_values(ascending=False).head(10))
    
    # Standard Step 3 Requirements:
    # 1. NMAR Argument (Text in report)
    # 2. Dependency Test (Permutation Test)
    
    # Let's pick a column with missingness.
    # Common candidate: 'ban1', 'ban2'... (might be empty if no ban)
    # Or 'monsterkills' (maybe NaN for players?)
    
    target_col = 'ban1'
    if target_col not in df.columns or df[target_col].isna().sum() == 0:
        # Fallback
        target_col = missing_cols.index[0]
    
    print(f"\nAnalyzing missingness of column: {target_col}")
    print(f"Missing count: {df[target_col].isna().sum()}")
    
    # Test 1: Dependency on 'gamelength' (Likely Dependent)
    dep_col_1 = 'gamelength'
    print(f"Testing dependency on: {dep_col_1}")
    obs1, p_val1, null_dist1 = permutation_test_missingness(df, target_col, dep_col_1)
    
    # Test 2: Dependency on 'side' (Likely Independent)
    # Convert side to numeric for test (Blue=0, Red=1)
    df['side_numeric'] = (df['side'] == 'Red').astype(int)
    dep_col_2 = 'side'
    print(f"Testing dependency on: {dep_col_2}")
    obs2, p_val2, null_dist2 = permutation_test_missingness(df, target_col, 'side_numeric')
    
    # Generate Plots
    def create_plot(null_dist, obs, p_val, col_name):
        fig = go.Figure()
        fig.add_trace(go.Histogram(x=null_dist, name='Null Distribution', marker_color='gray', opacity=0.7))
        fig.add_vline(x=obs, line_color='red', line_dash='dash', annotation_text='Observed')
        fig.update_layout(
            title=f'Missingness Dependency: {target_col} vs {col_name}<br>p-value={p_val:.4f}',
            template='plotly_white',
            bargap=0.02,
            height=400
        )
        return fig

    fig1 = create_plot(null_dist1, obs1, p_val1, dep_col_1)
    fig2 = create_plot(null_dist2, obs2, p_val2, dep_col_2)
    
    # Export
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    fig1.write_json(OUTPUT_DIR / "missingness_test_1.json")
    fig2.write_json(OUTPUT_DIR / "missingness_test_2.json")
    
    results = {
        'missing_col': target_col,
        'test1': {
            'dependent_col': dep_col_1,
            'p_value': float(p_val1),
            'interpretation': 'Dependent (MAR)' if p_val1 < 0.05 else 'Independent (MCAR)'
        },
        'test2': {
            'dependent_col': dep_col_2,
            'p_value': float(p_val2),
            'interpretation': 'Dependent (MAR)' if p_val2 < 0.05 else 'Independent (MCAR)'
        },
        'missing_count': int(df[target_col].isna().sum())
    }
    
    with open(OUTPUT_DIR / "missingness_results.json", 'w') as f:
        json.dump(results, f, indent=2)
        
    print("Analysis complete. Results exported.")

if __name__ == "__main__":
    analyze_missingness()
