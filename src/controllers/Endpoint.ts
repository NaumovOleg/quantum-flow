/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';

import { matchRoute, ParseBody } from '@utils';

export function Endpoint(method?: string, pathPattern?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    // Store method, path, and options metadata for routing
    if (method && pathPattern) {
      Reflect.defineMetadata('endpoint', [method, pathPattern], target, propertyKey);
    }

    descriptor.value = async function (request: any) {
      try {
        const proto = Object.getPrototypeOf(this);
        const routePrefix: string = Reflect.getMetadata('routePrefix', proto) || '';

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
        request.params = { ...request.params, ...params };

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
