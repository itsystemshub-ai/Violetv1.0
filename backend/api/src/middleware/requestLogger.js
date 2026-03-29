/**
 * Violet ERP - Request Logger Middleware
 */

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === 'development') {
      const color = getStatusColor(res.statusCode);
      console.log(`[${log.timestamp}] ${color(log.method)} ${log.path} - ${log.status} (${log.duration})`);
    }
  });

  next();
};

function getStatusColor(status) {
  if (status >= 500) return (msg) => `\x1b[31m${msg}\x1b[0m`;
  if (status >= 400) return (msg) => `\x1b[33m${msg}\x1b[0m`;
  if (status >= 300) return (msg) => `\x1b[36m${msg}\x1b[0m`;
  if (status >= 200) return (msg) => `\x1b[32m${msg}\x1b[0m`;
  return (msg) => msg;
}
