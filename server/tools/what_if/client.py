"""
What-If Analysis Client.
Wraps the ML model for transaction feasibility predictions.
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from typing import Dict, Any, Optional


class WhatIfAnalyzer:
    """
    ML-based analyzer for financial transaction feasibility.
    Uses Random Forest to predict if a proposed transaction is viable.
    """

    def __init__(self):
        """Initialize the What-If analyzer with trained model."""
        self.model = None
        self.features = None
        self.df_empresa = None
        self.reserva_minima = -8e6
        self._train_model()

    def _generate_training_data(self) -> pd.DataFrame:
        """Generate synthetic training data for the model."""
        np.random.seed(42)
        num_transacciones = 500
        start_date = pd.to_datetime('2023-01-01')

        data_transaccional = {
            'empresa': np.random.choice([f'E{i:02d}' for i in range(1, 6)], num_transacciones),
            'fecha': pd.to_datetime(start_date + pd.to_timedelta(np.random.randint(0, 800, num_transacciones), unit='D')),
            'tipo': np.random.choice(['ingreso', 'gasto'], num_transacciones, p=[0.4, 0.6]),
            'categoria': np.random.choice(['ventas', 'personal', 'infraestructura', 'costos', 'impuestos'], num_transacciones),
            'monto': np.random.randint(5000, 200000, num_transacciones),
            'moneda': np.random.choice(['MXN', 'USD'], num_transacciones, p=[0.8, 0.2])
        }

        df_transacciones = pd.DataFrame(data_transaccional).sort_values('fecha').reset_index(drop=True)
        df_transacciones['flujo_neto'] = df_transacciones.apply(
            lambda row: row['monto'] if row['tipo'] == 'ingreso' else -row['monto'], axis=1
        )

        # Macro variables
        dates_macro = pd.date_range(start='2023-01-01', periods=27, freq='ME')
        data_macro = {
            'fecha_indice': dates_macro,
            'proyeccion_tasa_cambio': 17 + np.random.randn(len(dates_macro)) * 0.5
        }
        df_macro = pd.DataFrame(data_macro)
        avg_fx = df_macro['proyeccion_tasa_cambio'].mean()

        df_transacciones['flujo_neto_mxn'] = df_transacciones.apply(
            lambda row: row['flujo_neto'] * avg_fx if row['moneda'] == 'USD' else row['flujo_neto'], axis=1
        )

        return df_transacciones[df_transacciones['empresa'] == 'E01'].copy().reset_index(drop=True)

    def _train_model(self):
        """Train the Random Forest model with historical data."""
        self.df_empresa = self._generate_training_data()
        # Feature engineering
        self.df_empresa['saldo_antes'] = self.df_empresa['flujo_neto_mxn'].shift(1).fillna(0).cumsum()
        self.df_empresa['es_factible'] = (
            self.df_empresa['saldo_antes'] + self.df_empresa['flujo_neto_mxn'] >= self.reserva_minima
        ).astype(int)

        self.df_empresa['monto_log'] = np.log1p(self.df_empresa['monto'])
        self.df_empresa['es_gasto'] = (self.df_empresa['tipo'] == 'gasto').astype(int)
        self.df_empresa['mes'] = self.df_empresa['fecha'].dt.month
        self.df_empresa['dia_semana'] = self.df_empresa['fecha'].dt.dayofweek
        self.df_empresa = pd.get_dummies(self.df_empresa, columns=['categoria'], prefix='cat')

        # Define features
        self.features = ['monto_log', 'es_gasto', 'mes', 'dia_semana'] + [
            col for col in self.df_empresa.columns if col.startswith('cat_')
        ]

        X = self.df_empresa[self.features].fillna(0)
        y = self.df_empresa['es_factible']

        # Train model
        self.model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
        self.model.fit(X, y)

    def predict_feasibility(
        self,
        monto: float,
        fecha: str,
        categoria: str,
        empresa: str = "E01"
    ) -> Dict[str, Any]:
        """
        Predict feasibility of a proposed transaction.

        Args:
            monto: Transaction amount in MXN (positive for expenses)
            fecha: Proposed transaction date (YYYY-MM-DD format)
            categoria: Transaction category (ventas, personal, infraestructura, costos, impuestos)
            empresa: Company code (default: E01)

        Returns:
            Dictionary with feasibility prediction and supporting metrics
        """
        fecha_propuesta = pd.to_datetime(fecha)

        # Create simulation data
        sim_data = {
            'monto': [monto],
            'fecha': [fecha_propuesta],
            'tipo': ['gasto'],
            'categoria': [categoria]
        }
        df_sim = pd.DataFrame(sim_data)

        # Apply feature engineering
        df_sim['monto_log'] = np.log1p(df_sim['monto'])
        df_sim['es_gasto'] = 1
        df_sim['mes'] = df_sim['fecha'].dt.month
        df_sim['dia_semana'] = df_sim['fecha'].dt.dayofweek
        df_sim = pd.get_dummies(df_sim, columns=['categoria'], prefix='cat')

        # Create feature vector
        X_sim = pd.DataFrame(0, index=[0], columns=self.features)
        for col in X_sim.columns:
            if col in df_sim.columns:
                X_sim[col] = df_sim[col].iloc[0]

        # Predict
        pred_class = self.model.predict(X_sim)[0]
        # Convert to native Python int immediately
        pred_class = int(pred_class)
        clasificacion = "FACTIBLE" if pred_class == 1 else "NO FACTIBLE"

        # Get probability
        try:
            pred_proba = self.model.predict_proba(X_sim)[0][self.model.classes_.tolist().index(1)]
            # Convert to native Python float immediately
            pred_proba = float(pred_proba)
        except (ValueError, IndexError):
            pred_proba = 1.0 if pred_class == 1 else 0.0

        # Calculate supporting metrics
        flujo_historico_acumulado = self.df_empresa[
            self.df_empresa['fecha'] < fecha_propuesta
        ]['flujo_neto_mxn'].sum()

        # Convert all NumPy/Pandas types to native Python types immediately
        flujo_historico_acumulado = float(flujo_historico_acumulado)*-1
        monto_native = float(monto)
        flujo_proyectado = flujo_historico_acumulado - monto_native
        reserva_minima = int(self.reserva_minima)

        # All calculations now use native Python types, ensuring meets_reserve is native bool
        return {
            "model": "RandomForestClassifier",
            "classification": clasificacion,
            "probability_feasible": round(pred_proba, 4),
            "amount_mxn": round(monto_native, 2),
            "category": categoria,
            "proposed_date": fecha,
            "historical_cash_flow": round(flujo_historico_acumulado, 2),
            "projected_cash_flow": round(flujo_proyectado, 2),
            "minimum_reserve": reserva_minima,
            "meets_reserve": flujo_proyectado >= reserva_minima
        }


# Global analyzer instance
_analyzer = None


def predict_transaction_feasibility(
    monto: float,
    fecha: str,
    categoria: str,
    empresa: str = "E01"
) -> Dict[str, Any]:
    """
    Predict if a proposed transaction is financially feasible.

    Args:
        monto: Transaction amount in MXN
        fecha: Proposed date (YYYY-MM-DD)
        categoria: Category (ventas, personal, infraestructura, costos, impuestos)
        empresa: Company code (default: E01)

    Returns:
        Prediction results with feasibility classification and metrics
    """
    global _analyzer

    if _analyzer is None:
        _analyzer = WhatIfAnalyzer()

    return _analyzer.predict_feasibility(monto, fecha, categoria, empresa)
