type LogMessage = string | Record<string, any>;

export const logger = {
  info: (msg: LogMessage) => { 
    try { 
      if (typeof msg === 'string') {
        console.log(`[INFO] ${msg}`);
      } else {
        console.log('[INFO]', JSON.stringify(msg, null, 2));
      }
    } catch {} 
  },
  error: (msg: LogMessage) => { 
    try { 
      if (typeof msg === 'string') {
        console.error(`[ERROR] ${msg}`);
      } else {
        console.error('[ERROR]', JSON.stringify(msg, null, 2));
      }
    } catch {} 
  },
  debug: (msg: LogMessage) => { 
    try { 
      if (typeof msg === 'string') {
        console.debug(`[DEBUG] ${msg}`);
      } else {
        console.debug('[DEBUG]', JSON.stringify(msg, null, 2));
      }
    } catch {} 
  },
  warn: (msg: LogMessage) => { 
    try { 
      if (typeof msg === 'string') {
        console.warn(`[WARN] ${msg}`);
      } else {
        console.warn('[WARN]', JSON.stringify(msg, null, 2));
      }
    } catch {} 
  },
};
