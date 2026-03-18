// core/Request.ts
import { RequestOptions, RequestSource } from '@types';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { IncomingHttpHeaders } from 'http';
import { URL } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { parseRequestCookie } from './helpers';

export class Request {
  public readonly requestId: string;
  public readonly method: string;
  public readonly path: string;
  public readonly url: URL;
  public readonly headers: Record<string, string | string[]>;
  public readonly query: Record<string, string | string[]>;
  public readonly body: any;
  public readonly params: Record<string, string>;
  public readonly cookies: Record<string, string>;
  public readonly sourceIp: string;
  public readonly userAgent: string;
  public readonly stage: string;
  public readonly timestamp: Date;
  public readonly source: RequestSource;
  public readonly raw: any;
  public readonly context: any;
  public readonly rawBody: string;
  private _state: Map<string, any> = new Map();

  constructor(options: RequestOptions & { source: RequestSource }) {
    this.requestId = options.requestId ?? options.requestId ?? uuidv4();
    this.method = options.method.toUpperCase();
    this.path = options.path;
    this.url = new URL(options.path, `http://${options.headers?.host || 'localhost'}`);
    this.headers = options.headers || {};
    this.query = options.query || {};
    this.body = options.body;
    this.params = options.params || {};
    this.cookies = parseRequestCookie(options.cookies, options.source);
    this.sourceIp = options.sourceIp || '0.0.0.0';
    this.userAgent = options.userAgent || 'unknown';
    this.stage = options.stage || 'dev';
    this.timestamp = options.timestamp || new Date();
    this.source = options.source;
    this.raw = options.raw;
    this.context = options.context;
    this.rawBody = options.rawBody;
  }

  /**
   * Get header value (case-insensitive)
   */
  getHeader(name: string): string | string[] | undefined {
    const lowerName = name.toLowerCase();
    const entry = Object.entries(this.headers).find(([key]) => key.toLowerCase() === lowerName);
    return entry ? entry[1] : undefined;
  }

  /**
   * Get cookie value
   */
  getCookie(name: string): string | undefined {
    return this.cookies[name];
  }

  /**
   * Get query parameter
   */
  getQuery(name: string): string | string[] | undefined {
    return this.query[name];
  }

  /**
   * Get path parameter
   */
  getParam(name: string): string | undefined {
    return this.params[name];
  }

  /**
   * Check if request is from HTTP server
   */
  isHttp(): boolean {
    return this.source === 'http';
  }

  /**
   * Check if request is from Lambda
   */
  isLambda(): boolean {
    return this.source === 'lambda';
  }

  /**
   * Get Lambda event (if from Lambda)
   */
  getLambdaEvent(): APIGatewayProxyEvent | undefined {
    return this.isLambda() ? this.raw : undefined;
  }

  /**
   * Get Lambda context (if from Lambda)
   */
  getLambdaContext(): Context | undefined {
    return this.isLambda() ? this.context : undefined;
  }

  /**
   * Get HTTP IncomingMessage (if from HTTP)
   */
  getHttpRequest(): IncomingHttpHeaders | undefined {
    return this.isHttp() ? this.raw : undefined;
  }

  /**
   * Store arbitrary data in request state
   */
  setState(key: string, value: any): void {
    this._state.set(key, value);
  }

  /**
   * Get stored state data
   */
  getState<T = any>(key: string): T | undefined {
    return this._state.get(key);
  }

  /**
   * Get all stored state
   */
  getAllState(): Map<string, any> {
    return new Map(this._state);
  }

  /**
   * Check if request is secure (HTTPS)
   */
  isSecure(): boolean {
    const proto = this.getHeader('x-forwarded-proto') || this.url.protocol.replace(':', '');
    return proto === 'https';
  }

  /**
   * Get client IP (considering proxies)
   */
  getClientIp(): string {
    const forwarded = this.getHeader('x-forwarded-for');
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded : forwarded.split(',');
      return ips[0].trim();
    }
    return this.sourceIp;
  }

  /**
   * Get request host
   */
  getHost(): string {
    return (this.getHeader('host') as string) || 'localhost';
  }

  /**
   * Get full URL
   */
  getFullUrl(): string {
    const protocol = this.isSecure() ? 'https' : 'http';
    return `${protocol}://${this.getHost()}${this.path}`;
  }

  /**
   * Clone request with modifications
   */
  clone(overrides?: Partial<RequestOptions>): Request {
    return new Request({
      method: overrides?.method || this.method,
      path: overrides?.path || this.path,
      headers: overrides?.headers || this.headers,
      query: overrides?.query || this.query,
      body: overrides?.body !== undefined ? overrides.body : this.body,
      params: overrides?.params || this.params,
      cookies: overrides?.cookies || this.cookies,
      sourceIp: overrides?.sourceIp || this.sourceIp,
      userAgent: overrides?.userAgent || this.userAgent,
      requestId: overrides?.requestId || this.requestId,
      stage: overrides?.stage || this.stage,
      timestamp: overrides?.timestamp || this.timestamp,
      source: this.source,
      raw: this.raw,
      context: this.context,
    });
  }

  /**
   * Convert to plain object
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      method: this.method,
      path: this.path,
      url: this.url.toString(),
      headers: this.headers,
      query: this.query,
      body: this.body,
      params: this.params,
      cookies: this.cookies,
      sourceIp: this.sourceIp,
      userAgent: this.userAgent,
      stage: this.stage,
      timestamp: this.timestamp.toISOString(),
      source: this.source,
    };
  }
}
