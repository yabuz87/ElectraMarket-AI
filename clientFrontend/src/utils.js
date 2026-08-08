import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:4500",
  withCredentials: true,
  timeout: 8_000,
});

export const dateFormatter = (dateString) => {
  const publishedDate = new Date(dateString);
  if (Number.isNaN(publishedDate.getTime())) return "Unknown";

  const diffInSeconds = Math.max(
    Math.floor((Date.now() - publishedDate.getTime()) / 1000),
    0
  );
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
};
