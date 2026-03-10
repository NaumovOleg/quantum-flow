import { AppRequest } from '@types';
import { IncomingHttpHeaders } from 'http';

export class Response {
  headers: IncomingHttpHeaders;
  constructor(request: AppRequest) {
    this.headers = { ...request.headers };
  }

  setHeader(header: string, value: string) {
    this.headers[header] = value;
  }
}
