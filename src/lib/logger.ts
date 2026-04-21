function log(level: string, message: string, meta?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    log('info', message, meta);
  },
  error(message: string, meta?: Record<string, unknown>) {
    log('error', message, meta);
  },
};
