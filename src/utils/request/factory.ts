// core/RequestFactory.ts
import { LambdaEvent } from '@types';
import { Context } from 'aws-lambda';
import { IncomingMessage } from 'http';
import { v4 } from 'uuid';
import { normalizeEvent } from '../lambda.event.normalizers';
import { parseBody, parseRequestCookie } from '../parsers';
import { collectRawBody } from '../server';
import { parseQuesry } from './helpers';
import { Request } from './request';

export class RequestFactory {
  /**
   * Create Request from HTTP IncomingMessage
   */
  static async fromHttp(req: IncomingMessage): Promise<Request> {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost';
    const fullUrl = `${protocol}://${host}${req.url}`;
    const requestUrl = new URL(fullUrl);
    const cookies = parseRequestCookie(req.headers?.cookie);
    const query = parseQuesry(requestUrl);

    const forwardedFor = req.headers['x-forwarded-for'] as string;
    const sourceIp =
      forwardedFor?.split(',')[0]?.trim() ??
      req.socket.remoteAddress ??
      req.socket.remoteAddress ??
      '0.0.0.0';

    const rawBody = await collectRawBody(req);

    const body = parseBody({
      body: rawBody,
      headers: req.headers as Record<string, string | string[]>,
      isBase64Encoded: false,
    });

    Object.assign(req, { body });

    return new Request({
      url: req.url ?? '/',
      requestUrl,
      source: 'http',
      method: req.method || 'GET',
      path: requestUrl.pathname || '/',
      headers: req.headers as Record<string, string | string[]>,
      query,
      body,
      params: {},
      cookies,
      sourceIp,
      userAgent: (req.headers['user-agent'] as string) || 'unknown',
      requestId: v4(),
      stage: 'http',
      timestamp: new Date(),
      raw: req,
      context: req.socket,
      rawBody,
      isBase64Encoded: false,
    });
  }

  static fromLambda(event: LambdaEvent, context: Context): Request {
    // Detect event type
    const normalized = normalizeEvent(event, context);
    return new Request(normalized);
  }

  /**
   * Create Request from generic object
   */
  static fromObject(obj: Record<string, any>): Request {
    return new Request({
      requestUrl: new URL(obj.path),
      url: obj.path,
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
      isBase64Encoded: false,
    });
  }
}
