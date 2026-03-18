import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { IncomingHttpHeaders } from 'http';
export type RequestSource = 'http' | 'lambda' | 'unknown';

export interface RequestOptions {
  method: string;
  path: string;
  headers: Record<string, string | string[]>;
  query: Record<string, string | string[]>;
  body: any;
  params: Record<string, string>;
  cookies: string | string[];
  sourceIp?: string;
  userAgent?: string;
  requestId?: string;
  stage?: string;
  timestamp: Date;
  raw?: any;
  context?: any;
  rawBody?: any;
}

export interface IRequest {
  readonly id: string;
  readonly method: string;
  readonly path: string;
  readonly url: URL;
  readonly headers: Record<string, string | string[]>;
  readonly query: Record<string, string | string[]>;
  readonly body: any;
  readonly params: Record<string, string>;
  readonly cookies: Record<string, string>;
  readonly sourceIp: string;
  readonly userAgent: string;
  readonly requestId: string;
  readonly stage: string;
  readonly timestamp: Date;
  readonly source: RequestSource;
  readonly raw: any;
  readonly context: any;

  getHeader(name: string): string | string[] | undefined;
  getCookie(name: string): string | undefined;
  getQuery(name: string): string | string[] | undefined;
  getParam(name: string): string | undefined;
  isHttp(): boolean;
  isLambda(): boolean;
  getLambdaEvent(): APIGatewayProxyEvent | undefined;
  getLambdaContext(): Context | undefined;
  getHttpRequest(): IncomingHttpHeaders | undefined;
  setState(key: string, value: any): void;
  getState<T = any>(key: string): T | undefined;
  getAllState(): Map<string, any>;
  isSecure(): boolean;
  getClientIp(): string;
  getHost(): string;
  getFullUrl(): string;
  clone(overrides?: Partial<RequestOptions>): IRequest;
  toJSON(): Record<string, any>;
}
