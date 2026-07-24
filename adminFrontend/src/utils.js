import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:4500",
  withCredentials: true,
  timeout: 8_000,
});

export const dateFormatter = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const intervals = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  for (const [unit, size] of intervals) {
    if (Math.abs(seconds) >= size) {
      return formatter.format(Math.round(seconds / size), unit);
    }
  }
  return formatter.format(seconds, "second");
};
