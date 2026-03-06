/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingHttpHeaders } from 'http';

type P_Q = Record<string, string | undefined> | null | unknown;

export type Request<B = unknown, Q extends P_Q = unknown, P extends P_Q = unknown> = {
  method: string;
  url: URL;
  headers: IncomingHttpHeaders;
  query: Q;
  params?: P;
  body: B;
  isBase64Encoded?: boolean;
};
export type Router = (req: Request) => Promise<{ statusCode: number; data: any; message?: string }>;

export type EndpointResponse<T = any> = {
  statusCode: number;
  data?: T;
  error?: any;
};

export type AxiosQuery = {
  data?: { [key: string]: any };
  headers?: { [key: string]: any };
  params?: { [key: string]: any };
  url: string;
  method: 'POST' | 'GET' | 'PATCH' | 'DELETE';
};

export interface IController {
  handleRequest: Router;
}

export type Middleware = (req: Request) => Promise<Request> | Request;
