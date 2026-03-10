import { AppRequest, LambdaApp, NormalizedEvent } from '@types';
import { normalizeEvent } from '@utils';
import { APIGatewayProxyResult, APIGatewayProxyResultV2, Context, Handler } from 'aws-lambda';

export class LambdaAdapter {
  static createHandler(Controller: new (...args: any[]) => LambdaApp): Handler {
    return async (event: any, context: Context) => {
      const instance: any = new Controller();

      if (Object.hasOwn(instance, 'beforeStart')) {
        await instance.beforeStart?.();
      }

      try {
        const eventType = this.getEventType(event);
        const normalizedEvent = normalizeEvent(event, eventType);

        const request = this.toRequest(normalizedEvent, context);

        if (typeof instance.handleRequest !== 'function') {
          throw new Error('Controller must have handleRequest method');
        }

        const response = await instance.handleRequest(request);

        return this.toLambdaResponse(response, request, eventType);
      } catch (error: any) {
        return this.handleError(error, event, context);
      }
    };
  }

  private static getEventType(event: any): 'rest' | 'http' | 'url' {
    if (event.httpMethod && event.resource) {
      return 'rest';
    }
    if (event.version === '2.0' || event.requestContext?.http) {
      return 'http';
    }
    if (event.version && event.rawPath && !event.requestContext?.http) {
      return 'url';
    }
    return 'rest';
  }

  private static toRequest(event: NormalizedEvent, context: Context): AppRequest {
    const query: Record<string, string | string[]> = {};

    if (event.multiValueQueryStringParameters) {
      Object.entries(event.multiValueQueryStringParameters).forEach(([key, value]) => {
        query[key] = value;
      });
    } else {
      Object.entries(event.queryStringParameters).forEach(([key, value]) => {
        query[key] = value;
      });
    }

    const cookies: Record<string, string> = {};
    const cookieHeader = event.headers?.Cookie || event.headers?.cookie || event.headers?.cookies;

    if (cookieHeader) {
      if (Array.isArray(cookieHeader)) {
        cookieHeader.forEach((cookie) => {
          const [name, value] = cookie.split('=');
          if (name && value) cookies[name] = decodeURIComponent(value);
        });
      } else {
        cookieHeader.split(';').forEach((cookie) => {
          const [name, value] = cookie.trim().split('=');
          if (name && value) cookies[name] = decodeURIComponent(value);
        });
      }
    }

    let rawBody = Buffer.from(event.body ?? '', 'base64');
    let body = event.body || {};

    if (event.body && event.isBase64Encoded) {
      body = rawBody.toString('utf-8');
    }

    if (typeof body === 'string' && body.trim().startsWith('{')) {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }

    const xForvarded = Array.isArray(event.headers['x-forwarded-proto'])
      ? event.headers['x-forwarded-proto']?.[0]
      : event.headers['x-forwarded-proto'];

    const xhost = Array.isArray(event.headers['host'])
      ? event.headers['host']?.[0]
      : event.headers['host'];

    const protocol = xForvarded || 'https';
    const host = xhost || 'localhost:3000';
    const fullUrl = `${protocol}://${host}${event.path}`;

    let url = new URL(fullUrl);

    return {
      method: event.httpMethod.toUpperCase() as any,
      url,
      headers: event.headers,
      query,
      body,
      params: event.pathParameters,
      cookies,
      event,
      context,
      rawBody,
      path: event.path,
      isBase64Encoded: event.isBase64Encoded,
      requestId: context.awsRequestId,
      stage: event.requestContext?.stage || '$default',
      sourceIp: this.getSourceIp(event),
      _startTime: Date.now(),
      userAgent:
        typeof event.headers['user-agent'] === 'string'
          ? event.headers['user-agent']
          : event.headers['user-agent']?.[0] || 'unknown',
    };
  }

  private static toLambdaResponse(
    response: any,
    request: AppRequest,
    eventType: string,
  ): APIGatewayProxyResult | APIGatewayProxyResultV2 | any {
    const statusCode = response.status || 200;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-Id': request.requestId,
      ...(response.headers || {}),
    };

    const originHeader = request.headers['origin'] || request.headers['Origin'];
    let origin: string | undefined;

    if (originHeader) {
      if (Array.isArray(originHeader)) {
        origin = originHeader[0];
      } else {
        origin = originHeader;
      }
    }

    if (origin) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
      headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
      headers['Access-Control-Allow-Headers'] =
        'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token';
    }

    const body = JSON.stringify({
      success: statusCode < 400,
      data: response.data,
      timestamp: new Date().toISOString(),
    });

    const commonResponse = {
      statusCode,
      headers,
      body: response.data,
      timestamp: new Date().toISOString(),
    };

    switch (eventType) {
      case 'rest':
        return { ...commonResponse, isBase64Encoded: false };

      case 'http':
        return {
          ...commonResponse,
          cookies: request.cookies
            ? Object.entries(request.cookies).map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            : undefined,
        };

      case 'url':
        return {
          ...commonResponse,
          cookies: request.cookies
            ? Object.entries(request.cookies).map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            : undefined,
        };

      default:
        return {
          statusCode,
          headers,
          body,
        };
    }
  }

  private static handleError(error: any, event: any, context: Context) {
    const eventType = this.getEventType(event);
    const statusCode = error.status || 500;

    const body = JSON.stringify({
      success: false,
      message: error.message || 'Internal Server Error',
      requestId: context.awsRequestId,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-Id': context.awsRequestId,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    };

    switch (eventType) {
      case 'rest':
        return {
          statusCode,
          headers,
          body,
          isBase64Encoded: false,
        };
      default:
        return {
          statusCode,
          headers,
          body,
        };
    }
  }

  private static getSourceIp(event: NormalizedEvent): string {
    const forwardedFor = event.headers['x-forwarded-for'];
    if (forwardedFor) {
      if (Array.isArray(forwardedFor)) {
        return forwardedFor[0].split(',')[0].trim();
      }
      return forwardedFor.split(',')[0].trim();
    }

    if (event.requestContext?.identity?.sourceIp) {
      return event.requestContext.identity.sourceIp;
    }

    if (event.requestContext?.http?.sourceIp) {
      return event.requestContext.http.sourceIp;
    }

    return '0.0.0.0';
  }
}
