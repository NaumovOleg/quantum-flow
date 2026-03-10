import { ErrorCB, InterceptorCB, MiddlewareCB } from './common';
import { CORSConfig } from './cors';

export interface ServerConfig {
  port?: number;
  host?: string;
  middlewares?: MiddlewareCB[];
  interceptor?: InterceptorCB;
  errorHandler?: ErrorCB;
  controllers?: (new (...args: any[]) => any)[];
  cors?: CORSConfig;
  websocket?: {
    enabled: boolean;
    path?: string;
    lazy?: boolean;
  };
}
