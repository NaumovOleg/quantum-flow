// core/RequestFactory.ts
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import * as cookie from 'cookie';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import { Request } from './request';

export class RequestFactory {
  /**
   * Create Request from HTTP IncomingMessage
   */
  static fromHttp(
    req: IncomingMessage,
    options?: {
      body?: any;
      params?: Record<string, string>;
      requestId?: string;
    },
  ): Request {
    const url = parse(req.url || '/', true);
    const cookies = cookie.parse(req.headers.cookie || '');

    // Parse query parameters (handling arrays)
    const query: Record<string, string | string[]> = {};
    for (const [key, value] of Object.entries(url.query)) {
      if (Array.isArray(value)) {
        query[key] = value.map(String);
      } else if (value !== undefined) {
        query[key] = String(value);
      }
    }

    // Get client IP
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    const sourceIp = forwardedFor?.split(',')[0]?.trim() || req.socket.remoteAddress || '0.0.0.0';

    return new Request({
      source: 'http',
      method: req.method || 'GET',
      path: url.pathname || '/',
      headers: req.headers as Record<string, string | string[]>,
      query,
      body: options?.body,
      params: options?.params || {},
      cookies,
      sourceIp,
      userAgent: (req.headers['user-agent'] as string) || 'unknown',
      requestId: options?.requestId || (req as any).id,
      stage: 'http',
      timestamp: new Date(),
      raw: req,
      context: req.socket,
    });
  }

  /**
   * Create Request from Lambda event
   */
  static fromLambda(
    event: APIGatewayProxyEvent,
    context: Context,
    options?: {
      body?: any;
      params?: Record<string, string>;
    },
  ): Request {
    // Parse query parameters
    const query: Record<string, string | string[]> = {};
    if (event.queryStringParameters) {
      Object.entries(event.queryStringParameters).forEach(([key, value]) => {
        if (event.multiValueQueryStringParameters?.[key]) {
          query[key] = event.multiValueQueryStringParameters[key];
        } else {
          query[key] = value || '';
        }
      });
    }

    // Parse cookies
    const cookies: Record<string, string> = {};
    const cookieHeader = event.headers?.Cookie || event.headers?.cookie;
    if (cookieHeader) {
      const parsed = cookie.parse(cookieHeader);
      Object.assign(cookies, parsed);
    }

    // Get client IP
    const sourceIp =
      event.requestContext?.identity?.sourceIp ||
      event.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      '0.0.0.0';

    return new Request({
      source: 'lambda',
      method: event.httpMethod,
      path: event.path,
      headers: event.headers || {},
      query,
      body: options?.body !== undefined ? options.body : event.body,
      params: options?.params || event.pathParameters || {},
      cookies,
      sourceIp,
      userAgent: event.headers?.['user-agent'] || 'unknown',
      requestId: context.awsRequestId,
      stage: event.requestContext?.stage || '$default',
      timestamp: new Date(),
      raw: event,
      context,
    });
  }

  /**
   * Create Request from generic object
   */
  static fromObject(obj: Record<string, any>): Request {
    return new Request({
      source: obj.source || 'unknown',
      method: obj.method || 'GET',
      path: obj.path || '/',
      headers: obj.headers || {},
      query: obj.query || {},
      body: obj.body,
      params: obj.params || {},
      cookies: obj.cookies || {},
      sourceIp: obj.sourceIp || '0.0.0.0',
      userAgent: obj.userAgent || 'unknown',
      requestId: obj.requestId,
      stage: obj.stage || 'dev',
      timestamp: obj.timestamp ? new Date(obj.timestamp) : new Date(),
      raw: obj.raw,
      context: obj.context,
    });
  }
}
