"""
Data Processing for Bot vs Top Jungle Gank Analysis
Loads Oracle's Elixir data and identifies "cross-map trade" games.
"""
import pandas as pd
import numpy as np
import json
from pathlib import Path

# Constants
DATA_PATH = Path(__file__).parent.parent.parent / "2025_LoL_esports_match_data_from_OraclesElixir.csv"
OUTPUT_DIR = Path(__file__).parent.parent / "frontend" / "public" / "data"

# Time window for "early game" ganks (minutes)
EARLY_WINDOW_MIN = 10


def load_and_clean_data():
    """Load the Oracle's Elixir dataset and perform initial cleaning."""
    print("Loading data...")
    df = pd.read_csv(DATA_PATH)
    
    # Standardize position names
    position_mapping = {
        'top': 'TOP',
        'jng': 'JNG',
        'jungle': 'JNG',
        'mid': 'MID',
        'bot': 'ADC',
        'adc': 'ADC',
        'sup': 'SUP',
        'support': 'SUP'
    }
    df['position'] = df['position'].str.lower().map(position_mapping).fillna(df['position'])
    
    # Filter to player-level rows (position is not null)
    df = df[df['position'].notna()].copy()
    
    print(f"Loaded {len(df)} player-game rows")
    print(f"Unique games: {df['gameid'].nunique()}")
    
    return df


def identify_gank_trades(df):
    """
    Identify games where there's a cross-map gank trade:
    - One team's jungler gets kills/assists in bot lane early
    - The other team's jungler gets kills/assists in top lane early
    
    We approximate this using killsat10 and assistsat10 for junglers.
    """
    # Focus on junglers only
    junglers = df[df['position'] == 'JNG'].copy()
    
    # For each game, we need to track which lanes got jungler attention
    # We'll use a heuristic: if the bot lane (ADC/SUP) on a team got kills/assists early,
    # AND the jungler also got kills/assists, we infer a bot gank
    # Similarly for top
    
    # Create a game-team level summary
    game_team_gank = []
    
    for (gameid, teamid), team_data in df.groupby(['gameid', 'teamid']):
        jng_row = team_data[team_data['position'] == 'JNG']
        top_row = team_data[team_data['position'] == 'TOP']
        adc_row = team_data[team_data['position'] == 'ADC']
        
        if jng_row.empty:
            continue
            
        jng_row = jng_row.iloc[0]
        
        # Heuristic: if jungler has killsat10 or assistsat10 > 0, they were active early
        jng_ka10 = (jng_row.get('killsat10', 0) or 0) + (jng_row.get('assistsat10', 0) or 0)
        
        # Check if bot lane was involved (ADC got kills/deaths early)
        bot_ka10 = 0
        top_ka10 = 0
        
        if not adc_row.empty:
            adc = adc_row.iloc[0]
            bot_ka10 = (adc.get('killsat10', 0) or 0) + (adc.get('assistsat10', 0) or 0)
        
        if not top_row.empty:
            top = top_row.iloc[0]
            top_ka10 = (top.get('killsat10', 0) or 0) + (top.get('assistsat10', 0) or 0)
        
        # Determine gank focus: where did the jungler apply pressure?
        # If bot lane has more early activity than top, we say "bot focus"
        gank_focus = None
        if jng_ka10 > 0:
            if bot_ka10 > top_ka10:
                gank_focus = 'bot'
            elif top_ka10 > bot_ka10:
                gank_focus = 'top'
            # If equal or both 0, leave as None
        
        game_team_gank.append({
            'gameid': gameid,
            'teamid': teamid,
            'side': jng_row.get('side'),
            'gank_focus': gank_focus,
            'result': jng_row.get('result'),
            'jng_ka10': jng_ka10,
            'bot_ka10': bot_ka10,
            'top_ka10': top_ka10,
        })
    
    gank_df = pd.DataFrame(game_team_gank)
    
    # Now find "trade games": games where one team focused bot and the other focused top
    trade_games = []
    for gameid, game_data in gank_df.groupby('gameid'):
        if len(game_data) != 2:
            continue
        
        focuses = game_data['gank_focus'].values
        if set(focuses) == {'bot', 'top'}:
            trade_games.append(gameid)
    
    print(f"Found {len(trade_games)} cross-map trade games")
    
    # Filter to only trade games
    trade_df = gank_df[gank_df['gameid'].isin(trade_games)].copy()
    
    return trade_df


def engineer_features(trade_df, full_df):
    """
    Add engineered features for analysis and modeling.
    """
    # Merge with full player data to get objectives and lane stats
    # For each game-team, collect:
    # - Objective conversion (got dragon or herald within 4 mins of gank)
    # - Lane impact index (LII)
    
    enriched = []
    
    for idx, row in trade_df.iterrows():
        gameid = row['gameid']
        teamid = row['teamid']
        
        team_players = full_df[(full_df['gameid'] == gameid) & (full_df['teamid'] == teamid)]
        
        # Get objectives (use any player row, objectives are team-level)
        if not team_players.empty:
            # Objectives - take max across rows as it's usually on the 'team' row or backfilled
            dragons = team_players['dragons'].max()
            if np.isnan(dragons): dragons = 0
            
            heralds = team_players['heralds'].max()
            if np.isnan(heralds): heralds = 0
            
            # Simplified: did they get dragon OR herald? (obj_conversion proxy)
            obj_conversion = 1 if (dragons > 0 or heralds > 0) else 0
            
            # Lane stats
            top_player = team_players[team_players['position'] == 'TOP']
            bot_player = team_players[team_players['position'] == 'ADC']
            
            top_xpdiff10 = top_player.iloc[0].get('xpdiffat10', 0) if not top_player.empty else 0
            bot_xpdiff10 = bot_player.iloc[0].get('xpdiffat10', 0) if not bot_player.empty else 0
            
            top_csdiff10 = top_player.iloc[0].get('csdiffat10', 0) if not top_player.empty else 0
            bot_csdiff10 = bot_player.iloc[0].get('csdiffat10', 0) if not bot_player.empty else 0
            
            # Lane Impact Index (simple version: just the diff)
            # More complex: weight XP and CS
            lii_top = (top_xpdiff10 or 0) * 0.5 + (top_csdiff10 or 0) * 0.5
            lii_bot = (bot_xpdiff10 or 0) * 0.5 + (bot_csdiff10 or 0) * 0.5
            
            row['dragons'] = dragons
            row['heralds'] = heralds
            row['obj_conversion'] = obj_conversion
            row['top_xpdiff10'] = top_xpdiff10
            row['bot_xpdiff10'] = bot_xpdiff10
            row['top_csdiff10'] = top_csdiff10
            row['bot_csdiff10'] = bot_csdiff10
            row['lii_top'] = lii_top
            row['lii_bot'] = lii_bot
            row['lii_diff'] = lii_bot - lii_top
        
        enriched.append(row)
    
    enriched_df = pd.DataFrame(enriched)
    
    return enriched_df


def export_for_frontend(df):
    """Export processed data as JSON for the React frontend."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Export full processed data
    output_path = OUTPUT_DIR / "processed_data.json"
    df.to_json(output_path, orient='records', indent=2)
    print(f"Exported processed data to {output_path}")
    
    # Export summary stats
    summary = {
        'total_trade_games': len(df) // 2,  # Each game has 2 rows (teams)
        'bot_focus_count': len(df[df['gank_focus'] == 'bot']),
        'top_focus_count': len(df[df['gank_focus'] == 'top']),
        'bot_focus_winrate': df[df['gank_focus'] == 'bot']['result'].mean(),
        'top_focus_winrate': df[df['gank_focus'] == 'top']['result'].mean(),
        'bot_focus_obj_rate': df[df['gank_focus'] == 'bot']['obj_conversion'].mean(),
        'top_focus_obj_rate': df[df['gank_focus'] == 'top']['obj_conversion'].mean(),
    }
    
    summary_path = OUTPUT_DIR / "summary_stats.json"
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)
    print(f"Exported summary stats to {summary_path}")
    
    return df


def main():
    """Main data processing pipeline."""
    # Load and clean
    df = load_and_clean_data()
    
    # Identify gank trades
    trade_df = identify_gank_trades(df)
    
    # Engineer features
    enriched_df = engineer_features(trade_df, df)
    
    # Export for frontend
    export_for_frontend(enriched_df)
    
    print("\nData processing complete!")
    print(f"Final dataset: {len(enriched_df)} team-game rows")
    print(f"Bot focus: {len(enriched_df[enriched_df['gank_focus'] == 'bot'])}")
    print(f"Top focus: {len(enriched_df[enriched_df['gank_focus'] == 'top'])}")
    
    return enriched_df


if __name__ == "__main__":
    main()
