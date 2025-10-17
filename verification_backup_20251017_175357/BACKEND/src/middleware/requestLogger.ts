import morgan from 'morgan';

// JSON-ish line logging for request summaries
export const requestLogger = morgan((tokens: any, req: any, res: any) => {
  const out = {
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    response_time_ms: Number(tokens['response-time'](req, res) || 0),
    content_length: tokens.res(req, res, 'content-length'),
    date: tokens.date(req, res, 'iso'),
  };
  return JSON.stringify(out);
});
