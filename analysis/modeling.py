"""
Machine Learning Models for Win Prediction
Baseline: Logistic Regression
Final: Random Forest with advanced features
Includes fairness analysis
"""
import pandas as pd
import numpy as np
import json
from pathlib import Path

from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, accuracy_score, confusion_matrix, classification_report
import warnings
warnings.filterwarnings('ignore')

# Paths
DATA_DIR = Path(__file__).parent.parent / "frontend" / "public" / "data"
PROCESSED_DATA = DATA_DIR / "processed_data.json"
OUTPUT_DIR = DATA_DIR


def load_data():
    """Load processed data."""
    df = pd.read_json(PROCESSED_DATA)
    return df


def prepare_features(df, feature_set='baseline'):
    """
    Prepare features for modeling.
    
    Args:
        df: DataFrame
        feature_set: 'baseline' or 'advanced'
    
    Returns:
        X, y, feature_names
    """
    if feature_set == 'baseline':
        # Simple features: gank_focus and obj_conversion
        features = ['gank_focus', 'obj_conversion']
        X = df[features].copy()
        
        # Encode gank_focus
        X['gank_focus_encoded'] = (X['gank_focus'] == 'bot').astype(int)
        X = X[['gank_focus_encoded', 'obj_conversion']]
        feature_names = ['gank_focus_encoded', 'obj_conversion']
        
    elif feature_set == 'advanced':
        # Advanced features: LII, objectives, lane stats
        X = df[[
            'gank_focus',
            'obj_conversion',
            'lii_top',
            'lii_bot',
            'lii_diff',
            'top_xpdiff10',
            'bot_xpdiff10',
            'dragons',
            'heralds'
        ]].copy()
        
        # Encode categorical
        X['gank_focus_encoded'] = (X['gank_focus'] == 'bot').astype(int)
        X = X.drop('gank_focus', axis=1)
        
        # Fill any NaNs with 0
        X = X.fillna(0)
        
        feature_names = list(X.columns)
    
    y = df['result'].values
    
    return X, y, feature_names


def build_baseline_model(X_train, y_train):
    """
    Baseline Model: Simple Logistic Regression
    Features: gank_focus, obj_conversion
    """
    model = LogisticRegression(random_state=42, max_iter=1000)
    model.fit(X_train, y_train)
    
    return model


def build_final_model(X_train, y_train):
    """
    Final Model: Random Forest with GridSearch
    Features: Advanced (LII, objectives, lane stats)
    """
    # Define parameter grid
    param_grid = {
        'n_estimators': [100, 300],
        'max_depth': [5, 10, None],
        'min_samples_leaf': [1, 5],
        'random_state': [42]
    }
    
    # GridSearch with cross-validation
    rf = RandomForestClassifier()
    grid_search = GridSearchCV(
        rf,
        param_grid,
        cv=5,
        scoring='roc_auc',
        n_jobs=-1,
        verbose=1
    )
    
    grid_search.fit(X_train, y_train)
    
    print(f"Best parameters: {grid_search.best_params_}")
    print(f"Best CV AUC: {grid_search.best_score_:.4f}")
    
    return grid_search.best_estimator_


def evaluate_model(model, X_test, y_test, model_name='Model'):
    """Evaluate model performance."""
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    auc = roc_auc_score(y_test, y_pred_proba)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n{model_name} Performance:")
    print(f"  AUC: {auc:.4f}")
    print(f"  Accuracy: {accuracy:.4f}")
    
    return {
        'model_name': model_name,
        'auc': float(auc),
        'accuracy': float(accuracy)
    }


def fairness_analysis(model, X_test, y_test, df_test):
    """
    Fairness Analysis: Check if model performs equally well
    for bot-focus vs top-focus games.
    """
    # Separate by gank focus
    bot_mask = df_test['gank_focus'] == 'bot'
    top_mask = df_test['gank_focus'] == 'top'
    
    y_pred_bot = model.predict(X_test[bot_mask])
    y_pred_top = model.predict(X_test[top_mask])
    
    y_true_bot = y_test[bot_mask]
    y_true_top = y_test[top_mask]
    
    # Calculate accuracy for each group
    acc_bot = accuracy_score(y_true_bot, y_pred_bot)
    acc_top = accuracy_score(y_true_top, y_pred_top)
    
    print(f"\nFairness Analysis:")
    print(f"  Bot-focus accuracy: {acc_bot:.4f}")
    print(f"  Top-focus accuracy: {acc_top:.4f}")
    print(f"  Difference: {abs(acc_bot - acc_top):.4f}")
    
    # Permutation test for fairness
    observed_diff = acc_bot - acc_top
    
    # Combine predictions and labels
    all_preds = np.concatenate([y_pred_bot, y_pred_top])
    all_true = np.concatenate([y_true_bot, y_true_top])
    
    # Create group labels
    groups = np.array(['bot'] * len(y_pred_bot) + ['top'] * len(y_pred_top))
    
    n_permutations = 1000
    null_diffs = []
    
    for _ in range(n_permutations):
        shuffled_groups = np.random.permutation(groups)
        
        bot_shuffled = shuffled_groups == 'bot'
        top_shuffled = shuffled_groups == 'top'
        
        perm_acc_bot = accuracy_score(all_true[bot_shuffled], all_preds[bot_shuffled])
        perm_acc_top = accuracy_score(all_true[top_shuffled], all_preds[top_shuffled])
        
        null_diffs.append(perm_acc_bot - perm_acc_top)
    
    p_value = np.mean(np.abs(null_diffs) >= np.abs(observed_diff))
    
    print(f"  Permutation test p-value: {p_value:.4f}")
    
    fairness_result = {
        'bot_accuracy': float(acc_bot),
        'top_accuracy': float(acc_top),
        'accuracy_difference': float(observed_diff),
        'p_value': float(p_value),
        'is_fair': bool(p_value > 0.05)
    }
    
    return fairness_result


def main():
    """Main modeling pipeline."""
    print("Loading data...")
    df = load_data()
    
    # Split data (stratified by result)
    train_df, test_df = train_test_split(
        df,
        test_size=0.25,
        random_state=42,
        stratify=df['result']
    )
    
    print(f"Train set: {len(train_df)} | Test set: {len(test_df)}")
    
    # === BASELINE MODEL ===
    print("\n" + "="*50)
    print("BASELINE MODEL: Logistic Regression")
    print("="*50)
    
    X_train_base, y_train, _ = prepare_features(train_df, 'baseline')
    X_test_base, y_test, _ = prepare_features(test_df, 'baseline')
    
    baseline_model = build_baseline_model(X_train_base, y_train)
    baseline_results = evaluate_model(baseline_model, X_test_base, y_test, 'Baseline (Logistic Regression)')
    
    # === FINAL MODEL ===
    print("\n" + "="*50)
    print("FINAL MODEL: Random Forest (with GridSearch)")
    print("="*50)
    
    X_train_adv, y_train, feature_names = prepare_features(train_df, 'advanced')
    X_test_adv, y_test, _ = prepare_features(test_df, 'advanced')
    
    final_model = build_final_model(X_train_adv, y_train)
    final_results = evaluate_model(final_model, X_test_adv, y_test, 'Final (Random Forest)')
    
    # Feature importance
    feature_importance = dict(zip(feature_names, final_model.feature_importances_))
    feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))
    
    print("\nFeature Importances:")
    for feat, imp in feature_importance.items():
        print(f"  {feat}: {imp:.4f}")
    
    # === FAIRNESS ANALYSIS ===
    print("\n" + "="*50)
    print("FAIRNESS ANALYSIS")
    print("="*50)
    
    fairness_results = fairness_analysis(final_model, X_test_adv.values, y_test, test_df.reset_index(drop=True))
    
    # === EXPORT RESULTS ===
    model_results = {
        'baseline': baseline_results,
        'final': final_results,
        'feature_importance': {k: float(v) for k, v in feature_importance.items()},
        'fairness': fairness_results
    }
    
    output_path = OUTPUT_DIR / "model_results.json"
    with open(output_path, 'w') as f:
        json.dump(model_results, f, indent=2)
    
    print(f"\n✅ Model results exported to {output_path}")
    
    return model_results


if __name__ == "__main__":
    main()
