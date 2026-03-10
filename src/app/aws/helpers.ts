import { AppRequest, HTTP_METHODS } from '@types';
import { IncomingHttpHeaders } from 'http';

export class LResponse {
  headers: IncomingHttpHeaders = {};
  constructor() {}

  setHeader(header: string, value: string) {
    this.headers[header] = value;
  }
}
export class LRequest {
  headers: IncomingHttpHeaders;
  url: URL;
  method: HTTP_METHODS;
  path?: string;
  query?: any;
  params?: any;
  body: any;
  cookies: Record<string, string>;
  _startTime: number;

  event?: any;
  context?: any;
  requestId?: string;
  stage?: string;
  sourceIp?: string;
  userAgent?: string;
  constructor(request: AppRequest) {
    this.headers = { ...request.headers };
    this.url = request.url;
    this.method = request.method;
    this.path = request.path;
    this.query = request.query;
    this.params = request.params;
    this.body = request.body;
    this.cookies = request.cookies;
    this._startTime = request._startTime;
    this.event = request.event;
    this.context = request.context;
    this.requestId = request.requestId;
    this.stage = request.stage;
    this.sourceIp = request.sourceIp;
    this.userAgent = request.userAgent;
  }
}
