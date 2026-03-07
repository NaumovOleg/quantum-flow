import { SERVER_CONFIG_KEY, SERVER_MODULES_KEY, STOPPED } from '@constants';
import { ParseBody, ParseQuery } from '@utils';
import http from 'http';
import url from 'url';

interface ServerConfig {
  port?: number;
  host?: string;
  globalMiddlewares?: any[];
  globalInterceptors?: any[];
  globalErrorHandler?: any;
  controllers?: any[];
}

export class Application {
  private app: http.Server;
  private config: ServerConfig;
  private isRunning: boolean = false;

  constructor(configOrClass?: any) {
    this.config = this.resolveConfig(configOrClass);
    this.app = http.createServer(this.requestHandler.bind(this));

    this.logConfig();
  }

  private resolveConfig(configOrClass?: any): ServerConfig {
    let config: ServerConfig = {};

    if (configOrClass && typeof configOrClass === 'function') {
      const decoratorConfig = Reflect.getMetadata(SERVER_CONFIG_KEY, configOrClass) || {};
      const controllers = Reflect.getMetadata(SERVER_MODULES_KEY, configOrClass) || [];

      config = {
        port: 3000,
        host: 'localhost',
        ...decoratorConfig,
        controllers: [...controllers, ...(decoratorConfig.controllers || [])],
      };
    } else if (configOrClass && typeof configOrClass === 'object') {
      config = { port: 3000, host: 'localhost', ...configOrClass };
    }
    // Если ничего не передано
    else {
      config = {
        port: 3000,
        host: 'localhost',
        globalMiddlewares: [],
        globalInterceptors: [],
        controllers: [],
      };
      console.log('⚙️ Using default configuration');
    }

    return config;
  }

  private logConfig() {
    console.log(`
╔════════════════════════════════════════╗
║  🚀 Server Configuration               ║
╠════════════════════════════════════════╣
║  📍 Host: ${this.config.host}                       ║
║  🔌 Port: ${this.config.port}                         ║
║  🔧 Middlewares: ${this.config.globalMiddlewares?.length || 0}                   ║
║  🎯 Interceptors: ${this.config.globalInterceptors?.length || 0}                   ║
║  📦 Controllers: ${this.config.controllers?.length || 0}                   ║
╚════════════════════════════════════════╝
    `);
  }

  public async listen(port?: number, host?: string): Promise<http.Server> {
    if (this.isRunning) {
      console.log('⚠️ Server is already running');
      return this.app;
    }

    const listenPort = port || this.config.port || 3000;
    const listenHost = host || this.config.host || 'localhost';

    return new Promise((resolve, reject) => {
      try {
        this.app.listen(listenPort, listenHost, () => {
          this.isRunning = true;
          console.log(`
╔════════════════════════════════════════╗
║  🎉 Server started successfully!       ║
║  📍 http://${listenHost}:${listenPort}        ║
║  📊 Status: RUNNING                     ║
╚════════════════════════════════════════╝
          `);
          resolve(this.app);
        });

        this.app.on('error', (error) => {
          console.error('❌ Server error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isRunning) {
        resolve();
        return;
      }

      this.app.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.isRunning = false;
          console.log(STOPPED);
          resolve();
        }
      });
    });
  }

  public status(): { running: boolean; config: ServerConfig } {
    return {
      running: this.isRunning,
      config: this.config,
    };
  }

  private async requestHandler(req: http.IncomingMessage, res: http.ServerResponse) {
    const startTime = Date.now();

    try {
      const parsedUrl = url.parse(req.url || '/', true);
      const request = await this.createRequest(req, parsedUrl);

      let processedRequest = await this.applyMiddlewares(request);
      const response = await this.findController(processedRequest);

      console.log(response);
      const finalResponse = await this.applyInterceptors(response, processedRequest);

      await this.sendResponse(res, finalResponse, startTime);
    } catch (error) {
      await this.handleError(error, req, res, startTime);
    }
  }

  private async createRequest(
    req: http.IncomingMessage,
    parsedUrl: url.UrlWithParsedQuery,
  ): Promise<any> {
    const rawBody = await this.collectRawBody(req);

    const parseRequest = {
      body: rawBody,
      headers: req.headers,
      isBase64Encoded: false,
    };

    const parsedBody = ParseBody(parseRequest);

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost';
    const fullUrl = `${protocol}://${host}${req.url}`;

    console.log('🔧 Creating request with URL:', fullUrl);

    const whatwgUrl = new URL(fullUrl);

    return {
      method: req.method,
      url: whatwgUrl,
      path: whatwgUrl.pathname,
      headers: req.headers,
      body: parsedBody,
      rawBody: rawBody,
      query: ParseQuery(whatwgUrl),
      params: {},
      cookies: this.parseCookies(req),
      isBase64Encoded: false,
      _startTime: Date.now(),
    };
  }

  private collectRawBody(req: http.IncomingMessage): Promise<Buffer> {
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];

      req.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });

      req.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });

      req.on('error', () => {
        resolve(Buffer.from(''));
      });
    });
  }

  private parseCookies(req: http.IncomingMessage): Record<string, string> {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return {};

    return cookieHeader.split(';').reduce(
      (cookies, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = decodeURIComponent(value);
        }
        return cookies;
      },
      {} as Record<string, string>,
    );
  }

  private async applyMiddlewares(request: any): Promise<any> {
    let processed = request;

    for (const middleware of this.config.globalMiddlewares || []) {
      const result = await middleware(processed);
      if (result) {
        processed = { ...processed, ...result };
      }
    }

    return processed;
  }

  private async findController(request: any): Promise<any> {
    for (const ControllerClass of this.config.controllers || []) {
      const instance = new ControllerClass();

      if (typeof instance.handleRequest === 'function') {
        const response = await instance.handleRequest(request);
        if (response && response.status !== 404) {
          return response;
        }
      }
    }

    return {
      status: 404,
      data: { message: `Route ${request.method} ${request.path} not found` },
    };
  }

  private async applyInterceptors(response: any, request: any): Promise<any> {
    let processed = response;

    for (const interceptor of this.config.globalInterceptors || []) {
      processed = await interceptor(processed, request);
    }

    return processed;
  }

  private async sendResponse(
    res: http.ServerResponse,
    response: any,
    startTime: number,
  ): Promise<void> {
    const data = response?.data !== undefined ? response.data : response;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);

    res.statusCode = response.status ?? 200;
    res.end(JSON.stringify(data));
  }

  private async handleError(
    error: any,
    req: http.IncomingMessage,
    res: http.ServerResponse,
    startTime: number,
  ): Promise<void> {
    console.error('❌ Error:', error);

    let errorResponse;

    if (this.config.globalErrorHandler) {
      try {
        errorResponse = await this.config.globalErrorHandler(error, req);
      } catch {
        errorResponse = {
          status: 500,
          data: { message: 'Internal Server Error' },
        };
      }
    } else {
      errorResponse = {
        status: error.status || 500,
        data: {
          message: error.message || 'Internal Server Error',
          errors: error.errors || [],
        },
      };
    }

    await this.sendResponse(res, errorResponse, startTime);
  }
}
