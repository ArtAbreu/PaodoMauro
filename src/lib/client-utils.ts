export function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/pm_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
