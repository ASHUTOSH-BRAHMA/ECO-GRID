import pandas as pd
import numpy as np
import os
import json
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, LSTM, Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
import joblib
import warnings
warnings.filterwarnings("ignore")

# ── Config ────────────────────────────────────────────────────────────────────
LOOKBACK      = 24       # use last 24 hours to predict next N hours
FORECAST_STEPS = 72     # predict next 72 hours
BATCH_SIZE    = 64
EPOCHS        = 100      # early stopping will kick in before this
TEST_SPLIT    = 0.2

FEATURE_COLS = [
    # weather
    "windspeed_10m", "winddirection_10m",
    "temperature_2m", "relativehumidity_2m", "precipitation",
    "cloudcover", "shortwave_radiation", "direct_normal_irradiance",
    "diffuse_radiation", "surface_pressure",
    # time
    "hour", "day", "month", "dayofweek", "is_weekend", "is_holiday",
    # location
    "zone_id", "latitude", "longitude", "urban",
    # grid
    "solar_gen_gw", "wind_gen_gw", "hydro_gen_gw", "thermal_gen_gw", "surplus_deficit_gw",
    # lags
    "total_supply_gw_lag1h", "total_supply_gw_lag2h", "total_supply_gw_lag3h",
    "total_supply_gw_lag6h", "total_supply_gw_lag12h", "total_supply_gw_lag24h",
    "demand_gw_lag1h", "demand_gw_lag2h", "demand_gw_lag3h",
    "demand_gw_lag6h", "demand_gw_lag12h", "demand_gw_lag24h",
    "price_inr_kwh_lag1h", "price_inr_kwh_lag2h", "price_inr_kwh_lag3h",
    "price_inr_kwh_lag6h", "price_inr_kwh_lag12h", "price_inr_kwh_lag24h",
    # rolling
    "total_supply_gw_roll6h", "total_supply_gw_roll24h",
    "demand_gw_roll6h", "demand_gw_roll24h",
    "price_inr_kwh_roll6h", "price_inr_kwh_roll24h",
]

TARGET_COLS = ["total_supply_gw", "demand_gw", "price_inr_kwh"]

# ── Load & Prepare Data ───────────────────────────────────────────────────────
def load_data():
    path = "processed/final_dataset.csv"
    if not os.path.exists(path):
        raise FileNotFoundError("Run build_final_dataset.py first!")

    print("Loading dataset...")
    df = pd.read_csv(path, parse_dates=["timestamp"])
    df.sort_values(["zone_name", "timestamp"], inplace=True)
    df.reset_index(drop=True, inplace=True)
    print(f"  {len(df)} rows, {len(df.columns)} columns")
    return df


def scale_data(df):
    print("Scaling features and targets...")
    feature_scaler = MinMaxScaler()
    target_scaler  = MinMaxScaler()

    X_scaled = feature_scaler.fit_transform(df[FEATURE_COLS])
    y_scaled = target_scaler.fit_transform(df[TARGET_COLS])

    os.makedirs("model", exist_ok=True)
    joblib.dump(feature_scaler, "model/feature_scaler.pkl")
    joblib.dump(target_scaler,  "model/target_scaler.pkl")
    print("  Scalers saved to model/")

    return X_scaled, y_scaled, feature_scaler, target_scaler


def create_sequences(X, y, lookback=LOOKBACK):
    """
    Convert flat arrays into LSTM sequences.
    Each sample: last `lookback` hours of features → next hour targets.
    We predict one step ahead, repeated autoregressively for 72hr forecast.
    """
    print(f"Creating sequences (lookback={lookback})...")
    Xs, ys = [], []
    for i in range(lookback, len(X)):
        Xs.append(X[i - lookback:i])
        ys.append(y[i])
    Xs = np.array(Xs)
    ys = np.array(ys)
    print(f"  Sequence shape: X={Xs.shape}, y={ys.shape}")
    return Xs, ys


# ── Build Model ───────────────────────────────────────────────────────────────
def build_model(input_shape, output_size):
    inputs = Input(shape=input_shape)

    x = LSTM(128, return_sequences=True)(inputs)
    x = BatchNormalization()(x)
    x = Dropout(0.2)(x)

    x = LSTM(64, return_sequences=True)(x)
    x = BatchNormalization()(x)
    x = Dropout(0.2)(x)

    x = LSTM(32, return_sequences=False)(x)
    x = BatchNormalization()(x)
    x = Dropout(0.2)(x)

    x = Dense(32, activation="relu")(x)
    outputs = Dense(output_size, activation="linear")(x)  # 3 outputs: supply, demand, price

    model = Model(inputs, outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="mse",
        metrics=["mae"]
    )
    return model


# ── Train ─────────────────────────────────────────────────────────────────────
def train():
    df = load_data()
    X_scaled, y_scaled, feat_scaler, tgt_scaler = scale_data(df)

    X_seq, y_seq = create_sequences(X_scaled, y_scaled)

    split = int(len(X_seq) * (1 - TEST_SPLIT))
    X_train, X_test = X_seq[:split], X_seq[split:]
    y_train, y_test = y_seq[:split], y_seq[split:]

    print(f"\nTrain: {len(X_train)} samples | Test: {len(X_test)} samples")

    model = build_model(
        input_shape=(LOOKBACK, len(FEATURE_COLS)),
        output_size=len(TARGET_COLS)
    )
    model.summary()

    callbacks = [
        EarlyStopping(monitor="val_loss", patience=10, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=5, verbose=1),
        ModelCheckpoint("model/lstm_model.keras", save_best_only=True, verbose=1),
    ]

    print("\nTraining LSTM...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
        verbose=1
    )

    # ── Evaluate ─────────────────────────────────────────────────────────────
    print("\nEvaluating...")
    y_pred_scaled = model.predict(X_test)
    y_pred = tgt_scaler.inverse_transform(y_pred_scaled)
    y_true = tgt_scaler.inverse_transform(y_test)

    metrics = {}
    for i, col in enumerate(TARGET_COLS):
        mae  = mean_absolute_error(y_true[:, i], y_pred[:, i])
        rmse = np.sqrt(mean_squared_error(y_true[:, i], y_pred[:, i]))
        mape = np.mean(np.abs((y_true[:, i] - y_pred[:, i]) / y_true[:, i].clip(0.01))) * 100
        metrics[col] = {"MAE": round(mae, 4), "RMSE": round(rmse, 4), "MAPE": round(mape, 2)}
        print(f"  {col}: MAE={mae:.3f} | RMSE={rmse:.3f} | MAPE={mape:.1f}%")

    # Save metrics and config
    config = {
        "lookback": LOOKBACK,
        "forecast_steps": FORECAST_STEPS,
        "feature_cols": FEATURE_COLS,
        "target_cols": TARGET_COLS,
        "metrics": metrics
    }
    with open("model/config.json", "w") as f:
        json.dump(config, f, indent=2)

    print("\n✅ Training complete!")
    print("   Saved: model/lstm_model.keras")
    print("   Saved: model/feature_scaler.pkl")
    print("   Saved: model/target_scaler.pkl")
    print("   Saved: model/config.json")


if __name__ == "__main__":
    train()