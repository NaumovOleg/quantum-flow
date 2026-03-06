/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';

import { Middleware } from '@types';
import { matchRoute, ParseBody, Query } from '@utils';

export function Endpoint(method: string, pathPattern?: string, middlewares?: Middleware[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    // Store method, path, and options metadata for routing
    if (method && pathPattern) {
      Reflect.defineMetadata('endpoint', [method, pathPattern], target, propertyKey);
      Reflect.defineMetadata('middlewares', middlewares, target, propertyKey);
    }

    descriptor.value = async function (request: any) {
      try {
        const proto = Object.getPrototypeOf(this);
        const routePrefix: string = Reflect.getMetadata('routePrefix', proto) || '';
        const middlewares: Middleware[] =
          Reflect.getMetadata('middlewares', proto, propertyKey) || [];

        // Combine routePrefix and pathPattern for matching
        const fullPattern = [routePrefix, pathPattern]
          .filter(Boolean)
          .join('/')
          .replace(/\/+/g, '/');

        const params: Record<string, string> = {};
        if (fullPattern && request.path) {
          const path = request.path.replace(/^\/+/, '');
          const pathParams = matchRoute(fullPattern, path);
          if (pathParams) {
            Object.assign(params, pathParams);
          }
        }
        request.body = ParseBody(request);
        request.query = Query(request.url);
        request.params = { ...request.params, ...params };

        for (let index = 0; index < middlewares.length; index++) {
          const middleware = middlewares[index];
          request = await middleware(request);
        }

        const result = await originalMethod.apply(this, [request]);

        return { statusCode: result?.statusCode ?? 200, data: result ?? null };
      } catch (err: any) {
        return {
          statusCode: err?.statusCode || 400,
          message: err.response?.data ?? err.message,
          data: err.errors ?? err.response?.data ?? err.data ?? err.message,
        };
      }
    };

    return descriptor;
  };
}

export const GET = (pathPattern?: string, middelwares?: Middleware[]) => {
  return Endpoint('GET', pathPattern, middelwares);
};
export const POST = (pathPattern?: string, middelwares?: Middleware[]) => {
  return Endpoint('POST', pathPattern, middelwares);
};
export const PUT = (pathPattern?: string, middelwares?: Middleware[]) => {
  return Endpoint('PUT', pathPattern, middelwares);
};
export const PATCH = (pathPattern?: string, middelwares?: Middleware[]) => {
  return Endpoint('PATCH', pathPattern, middelwares);
};
export const DELETE = (pathPattern?: string, middelwares?: Middleware[]) => {
  return Endpoint('DELETE', pathPattern, middelwares);
};
