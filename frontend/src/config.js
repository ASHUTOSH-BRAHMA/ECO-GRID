const DEFAULT_BACKEND_ORIGIN = "http://localhost:8080";
const DEFAULT_LSTM_CITY_ORIGIN = "http://localhost:5000";
const DEFAULT_FORECAST_ORIGIN = "http://localhost:5001";
const DEFAULT_ECOGRID_ORIGIN = "http://localhost:8000";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || `${DEFAULT_BACKEND_ORIGIN}/api`;

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  DEFAULT_BACKEND_ORIGIN;

export const LSTM_CITY_API_URL =
  import.meta.env.VITE_LSTM_CITY_API_URL || DEFAULT_LSTM_CITY_ORIGIN;

export const FORECAST_API_URL =
  import.meta.env.VITE_FORECAST_API_URL || DEFAULT_FORECAST_ORIGIN;

export const ML_ECOGRID_API_URL =
  import.meta.env.VITE_ML_ECOGRID_API_URL || DEFAULT_ECOGRID_ORIGIN;

export const apiUrl = (path = "") =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
