import { NormalizedEvent } from '@types';

const parseQueryString = (queryString: string): Record<string, string> => {
  const params: Record<string, string> = {};
  if (!queryString) return params;

  new URLSearchParams(queryString).forEach((value, key) => {
    params[key] = value;
  });

  return params;
};

export const normalizeEvent = (event: any, type: string): NormalizedEvent => {
  const base = {
    headers: event.headers || {},
    body: event.body || null,
    isBase64Encoded: event.isBase64Encoded || false,
    requestContext: event.requestContext,
  };

  switch (type) {
    case 'rest':
      return {
        ...base,
        httpMethod: event.httpMethod,
        path: event.path,
        queryStringParameters: event.queryStringParameters || {},
        multiValueQueryStringParameters: event.multiValueQueryStringParameters,
        pathParameters: event.pathParameters || {},
        cookies: event.headers?.Cookie ? [event.headers.Cookie] : [],
      };

    case 'http':
      return {
        ...base,
        httpMethod: event.requestContext?.http?.method || 'GET',
        path: event.rawPath,
        queryStringParameters: event.queryStringParameters || {},
        pathParameters: event.pathParameters || {},
        cookies: event.cookies || [],
      };

    case 'url':
      return {
        ...base,
        httpMethod: event.requestContext?.http?.method || 'GET',
        path: event.rawPath,
        queryStringParameters: parseQueryString(event.rawQueryString),
        pathParameters: {},
        cookies: [],
      };

    default:
      throw new Error(`Unsupported event type: ${type}`);
  }
};
