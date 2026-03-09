import { ErrorCB, InterceptorCB, MiddlewareCB } from './common';

export interface ServerConfig {
  port?: number;
  host?: string;
  middlewares?: MiddlewareCB[];
  interceptor?: InterceptorCB;
  errorHandler?: ErrorCB;
  controllers?: (new (...args: any[]) => any)[];
  websocket?: {
    enabled: boolean;
    path?: string;
    lazy?: boolean;
  };
}
