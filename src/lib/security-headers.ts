export function buildCsp(nonce: string) {
  const directives = {
    "default-src": "'self'",
    "style-src": "'self' 'unsafe-inline'",
    "script-src": `'self' 'nonce-${nonce}'`,
    "img-src": "'self' data:",
    "font-src": "'self' data:",
    "connect-src": "'self'",
    "frame-ancestors": "'none'",
  } as const;

  return Object.entries(directives)
    .map(([key, value]) => `${key} ${value}`)
    .join("; ");
}

export const securityHeaders = (nonce: string) => ({
  "Content-Security-Policy": buildCsp(nonce),
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
});
