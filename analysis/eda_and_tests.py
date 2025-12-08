"""
Exploratory Data Analysis and Hypothesis Testing
For the Bot vs Top Jungle Gank Priority Analysis
"""
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import json
from pathlib import Path

# Paths
DATA_DIR = Path(__file__).parent.parent / "frontend" / "public" / "data"
PROCESSED_DATA = DATA_DIR / "processed_data.json"
OUTPUT_DIR = DATA_DIR


def load_processed_data():
    """Load the processed data from JSON."""
    df = pd.read_json(PROCESSED_DATA)
    return df


def export_eda_extras(df):
    """Export additional EDA assets for rubric requirements."""
    
    # 1. Head of cleaned dataframe (subset of cols)
    cols_to_show = ['gameid', 'teamid', 'gank_focus', 'result', 'obj_conversion', 'lii_diff']
    head_df = df[cols_to_show].head(5)
    head_json = head_df.to_dict(orient='records')
    with open(OUTPUT_DIR / "head_data.json", 'w') as f:
        json.dump(head_json, f, indent=2)
        
    # 2. Univariate Plot: Distribution of Lane Impact Index Difference
    fig_uni = px.histogram(df, x='lii_diff', nbins=30, title='Distribution of Lane Impact Index Difference')
    fig_uni.update_layout(template='plotly_white', bargap=0.02)
    fig_uni.write_json(OUTPUT_DIR / "plot_univariate.json")
    
    # 3. Aggregate Table (Pivot): Win Rate by Side & Gank Focus
    pivot = df.groupby(['side', 'gank_focus'])['result'].mean().reset_index()
    pivot_json = pivot.to_dict(orient='records')
    with open(OUTPUT_DIR / "pivot_table.json", 'w') as f:
        json.dump(pivot_json, f, indent=2)
    
    print("Exported EDA extras: Head, Univariate Plot, Pivot Table")


def create_bivariate_plot_1(df):
    """
    Bivariate Plot 1: Objective conversion rate vs gank focus
    Shows if bot-focused ganks lead to better objective control than top-focused ganks.
    """
    # Calculate objective conversion rate by gank focus and result
    summary = df.groupby(['gank_focus', 'result']).agg({
        'obj_conversion': 'mean'
    }).reset_index()
    
    summary['result_label'] = summary['result'].map({1: 'Win', 0: 'Loss'})
    
    fig = px.bar(
        summary,
        x='gank_focus',
        y='obj_conversion',
        color='result_label',
        barmode='group',
        title='Objective Conversion Rate by Gank Focus',
        labels={
            'gank_focus': 'Gank Focus (Lane)',
            'obj_conversion': 'Objective Conversion Rate',
            'result_label': 'Game Result'
        },
        color_discrete_map={'Win': '#4CAF50', 'Loss': '#F44336'}
    )
    
    fig.update_layout(
        xaxis_title='Gank Focus',
        yaxis_title='Objective Conversion Rate',
        yaxis_tickformat='.0%',
        template='plotly_white',
        height=500
    )
    
    # Export as JSON for frontend
    fig.write_json(OUTPUT_DIR / "plot_obj_conversion.json")
    print("Created plot: Objective Conversion Rate")
    
    return fig


def create_bivariate_plot_2(df):
    """
    Bivariate Plot 2: Win rate by gank focus
    Shows if bot or top gank focus leads to higher win probability.
    """
    winrate_summary = df.groupby('gank_focus').agg({
        'result': ['mean', 'count', 'sem']
    }).reset_index()
    
    winrate_summary.columns = ['gank_focus', 'winrate', 'count', 'sem']
    
    # Calculate 95% confidence intervals
    winrate_summary['ci_lower'] = winrate_summary['winrate'] - 1.96 * winrate_summary['sem']
    winrate_summary['ci_upper'] = winrate_summary['winrate'] + 1.96 * winrate_summary['sem']
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=winrate_summary['gank_focus'],
        y=winrate_summary['winrate'],
        error_y=dict(
            type='data',
            symmetric=False,
            array=winrate_summary['ci_upper'] - winrate_summary['winrate'],
            arrayminus=winrate_summary['winrate'] - winrate_summary['ci_lower']
        ),
        marker_color=['#2196F3', '#FF9800'],
        text=[f"{wr:.1%}" for wr in winrate_summary['winrate']],
        textposition='outside'
    ))
    
    fig.update_layout(
        title='Win Rate by Gank Focus (with 95% CI)',
        xaxis_title='Gank Focus',
        yaxis_title='Win Rate',
        yaxis_tickformat='.0%',
        template='plotly_white',
        height=500
    )
    
    fig.write_json(OUTPUT_DIR / "plot_winrate.json")
    print("Created plot: Win Rate by Gank Focus")
    
    return fig


def create_lii_scatter(df):
    """
    Additional plot: Lane Impact Index difference vs Win Probability
    Shows how lane advantage (bot vs top) correlates with winning.
    """
    # Bin LII diff for smoothing
    # Create binned scatter plot for better readability
    # Bin LII diff into 10 quantiles
    df_copy = df.copy()
    df_copy['lii_bin'] = pd.qcut(df_copy['lii_diff'], q=10, labels=False, duplicates='drop')
    
    # Calculate mean win rate and mean LII for each bin, split by gank focus
    binned = df_copy.groupby(['gank_focus', 'lii_bin']).agg({
        'result': 'mean',
        'lii_diff': 'mean',
        'gameid': 'count'
    }).reset_index()
    
    binned = binned.rename(columns={'result': 'win_rate', 'gameid': 'count'})
    
    fig = px.scatter(
        binned,
        x='lii_diff',
        y='win_rate',
        color='gank_focus',
        size='count',
        title='Win Probability vs Lane Impact Index (Binned)',
        labels={
            'lii_diff': 'Lane Impact Index Difference (Bot - Top)',
            'win_rate': 'Win Probability',
            'gank_focus': 'Gank Focus'
        },
        trendline=None # No trendline needed as points themselves show the trend
    )
    
    # Add lines connecting the dots
    for focus in binned['gank_focus'].unique():
        subset = binned[binned['gank_focus'] == focus].sort_values('lii_diff')
        fig.add_trace(go.Scatter(
            x=subset['lii_diff'],
            y=subset['win_rate'],
            mode='lines',
            name=f'{focus} trend',
            line=dict(width=2, dash='dot'),
            showlegend=False,
            marker_color=fig.data[0].marker.color if focus == fig.data[0].name else fig.data[1].marker.color
        ))

    fig.update_layout(
        template='plotly_white',
        height=500,
        yaxis_tickformat='.0%'
    )
    
    fig.write_json(OUTPUT_DIR / "plot_lii_scatter.json")
    print("Created plot: LII Scatter")
    
    return fig


def permutation_test(group1, group2, test_stat_func, n_permutations=10000):
    """
    Generic permutation test.
    
    Args:
        group1: Data for group 1
        group2: Data for group 2
        test_stat_func: Function to calculate test statistic (takes two groups)
        n_permutations: Number of permutations
    
    Returns:
        observed_stat, p_value, null_distribution
    """
    observed_stat = test_stat_func(group1, group2)
    combined = np.concatenate([group1, group2])
    n1 = len(group1)
    
    null_distribution = []
    for _ in range(n_permutations):
        shuffled = np.random.permutation(combined)
        perm_group1 = shuffled[:n1]
        perm_group2 = shuffled[n1:]
        null_stat = test_stat_func(perm_group1, perm_group2)
        null_distribution.append(null_stat)
    
    null_distribution = np.array(null_distribution)
    
    # Two-tailed p-value
    p_value = np.mean(np.abs(null_distribution) >= np.abs(observed_stat))
    
    return observed_stat, p_value, null_distribution


def hypothesis_test_1_objectives(df):
    """
    Hypothesis Test #1: Bot vs Top Gank Value (Objectives)
    H0: Average objective conversion rate is the same for bot and top gank focus
    H1: Bot gank focus has higher objective conversion rate
    """
    bot_obj = df[df['gank_focus'] == 'bot']['obj_conversion'].values
    top_obj = df[df['gank_focus'] == 'top']['obj_conversion'].values
    
    def diff_means(g1, g2):
        return np.mean(g1) - np.mean(g2)
    
    observed, p_value, null_dist = permutation_test(bot_obj, top_obj, diff_means)
    
    # Create visualization of null distribution
    fig = go.Figure()
    
    fig.add_trace(go.Histogram(
        x=null_dist,
        name='Null Distribution',
        marker_color='lightblue'
    ))
    
    fig.add_vline(
        x=observed,
        line_dash='dash',
        line_color='red',
        annotation_text=f'Observed: {observed:.4f}',
        annotation_position='top right'
    )
    
    fig.update_layout(
        title=f'Hypothesis Test 1: Objective Conversion Rate Difference<br>p-value = {p_value:.4f}',
        xaxis_title='Difference in Mean Objective Conversion (Bot - Top)',
        yaxis_title='Frequency',
        template='plotly_white',
        height=500,
        bargap=0.02
    )
    
    fig.write_json(OUTPUT_DIR / "test1_objectives.json")
    
    result = {
        'test_name': 'Objective Conversion Rate (Bot vs Top)',
        'observed_stat': float(observed),
        'p_value': float(p_value),
        'bot_mean': float(np.mean(bot_obj)),
        'top_mean': float(np.mean(top_obj)),
        'interpretation': 'Significant' if p_value < 0.05 else 'Not significant'
    }
    
    print(f"Test 1 - Objectives: p-value = {p_value:.4f}, observed = {observed:.4f}")
    
    return result


def hypothesis_test_2_winrate(df):
    """
    Hypothesis Test #2: Bot vs Top Gank Impact on Win Rate
    H0: Win rate is the same for bot and top gank focus
    H1: Win rates differ between bot and top gank focus
    """
    bot_wins = df[df['gank_focus'] == 'bot']['result'].values
    top_wins = df[df['gank_focus'] == 'top']['result'].values
    
    def diff_means(g1, g2):
        return np.mean(g1) - np.mean(g2)
    
    observed, p_value, null_dist = permutation_test(bot_wins, top_wins, diff_means)
    
    # Create visualization
    fig = go.Figure()
    
    fig.add_trace(go.Histogram(
        x=null_dist,
        name='Null Distribution',
        marker_color='lightgreen'
    ))
    
    fig.add_vline(
        x=observed,
        line_dash='dash',
        line_color='red',
        annotation_text=f'Observed: {observed:.4f}',
        annotation_position='top right'
    )
    
    fig.update_layout(
        title=f'Hypothesis Test 2: Win Rate Difference<br>p-value = {p_value:.4f}',
        xaxis_title='Difference in Win Rate (Bot - Top)',
        yaxis_title='Frequency',
        template='plotly_white',
        height=500,
        bargap=0.02
    )
    
    fig.write_json(OUTPUT_DIR / "test2_winrate.json")
    
    result = {
        'test_name': 'Win Rate (Bot vs Top)',
        'observed_stat': float(observed),
        'p_value': float(p_value),
        'bot_winrate': float(np.mean(bot_wins)),
        'top_winrate': float(np.mean(top_wins)),
        'interpretation': 'Significant' if p_value < 0.05 else 'Not significant'
    }
    
    print(f"Test 2 - Win Rate: p-value = {p_value:.4f}, observed = {observed:.4f}")
    
    return result


def main():
    """Run all EDA and hypothesis tests."""
    print("Loading processed data...")
    df = load_processed_data()
    
    print(f"\nDataset: {len(df)} rows")
    print(f"Bot focus: {len(df[df['gank_focus'] == 'bot'])}")
    print(f"Top focus: {len(df[df['gank_focus'] == 'top'])}")
    
    print("\n=== Creating Visualizations ===")
    export_eda_extras(df)
    create_bivariate_plot_1(df)
    create_bivariate_plot_2(df)
    create_lii_scatter(df)
    
    print("\n=== Running Hypothesis Tests ===")
    test1_result = hypothesis_test_1_objectives(df)
    test2_result = hypothesis_test_2_winrate(df)
    
    # Export test results
    test_results = {
        'test1': test1_result,
        'test2': test2_result
    }
    
    with open(OUTPUT_DIR / "hypothesis_tests.json", 'w') as f:
        json.dump(test_results, f, indent=2)
    
    print("\n=== Analysis Complete ===")
    print(f"Results exported to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
