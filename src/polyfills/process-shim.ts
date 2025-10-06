// Minimal, browser-safe shim for `process` to avoid runtime errors in libs that probe it.
// Note: We intentionally do NOT mirror import.meta.env into process.env (avoids stale constants).

declare global {
  // eslint-disable-next-line no-var
  var process: any | undefined;
}

(() => {
  const g = globalThis as any
  if (!g.process) g.process = { env: {} }
})()
export {};
