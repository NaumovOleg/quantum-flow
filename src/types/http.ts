export interface ServerConfig {
  port?: number;
  host?: string;
  globalMiddlewares?: any[];
  globalInterceptors?: any[];
  globalErrorHandler?: any;
  controllers?: any[];
  websocket?: {
    enabled: boolean;
    path?: string;
    lazy?: boolean;
  };
}

export type Conf = ServerConfig & {
  globalMiddlewares?: any[];
  globalInterceptors?: any[];
  globalErrorHandler?: any;
};
