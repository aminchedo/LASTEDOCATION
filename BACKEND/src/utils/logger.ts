
export const logger = {
  info: (msg: string) => { try { console.log(msg); } catch {} },
  error: (msg: string) => { try { console.error(msg); } catch {} },
  debug: (msg: string) => { try { console.debug(msg); } catch {} },
  warn: (msg: string) => { try { console.warn(msg); } catch {} },
};
