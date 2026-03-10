import { CORSConfig } from '@types';

export function handleCORS(req: any, res: any, config: CORSConfig): boolean {
  const origin = req.headers.origin;

  if (req.method === 'OPTIONS') {
    if (config.origin === '*') {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (typeof config.origin === 'string') {
      res.setHeader('Access-Control-Allow-Origin', config.origin);
    } else if (Array.isArray(config.origin) && origin && config.origin.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (typeof config.origin === 'function' && config.origin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      return false;
    }

    if (config.methods) {
      res.setHeader('Access-Control-Allow-Methods', config.methods.join(', '));
    }

    if (config.allowedHeaders) {
      res.setHeader('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
    }

    if (config.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (config.maxAge) {
      res.setHeader('Access-Control-Max-Age', config.maxAge.toString());
    }

    res.statusCode = config.optionsSuccessStatus || 204;
    res.end();
    return true; // preflight обработан
  }

  if (origin) {
    if (config.origin === '*') {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (typeof config.origin === 'string') {
      res.setHeader('Access-Control-Allow-Origin', config.origin);
    } else if (Array.isArray(config.origin) && config.origin.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (typeof config.origin === 'function' && config.origin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    if (config.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (config.exposedHeaders) {
      res.setHeader('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
    }
  }

  return false;
}

export function isPreflightRequest(req: any): boolean {
  return (
    req.method === 'OPTIONS' && req.headers['access-control-request-method'] && req.headers.origin
  );
}
