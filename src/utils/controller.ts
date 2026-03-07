// Внутри класса, который возвращает @Controller
import { ParamMetadata } from '@types';
import { transformAndValidate } from './transform';

import { ControllerInstance } from '@types';

export const executeControllerMethod = async (
  controller: ControllerInstance,
  propertyName: string,
  payload: any,
) => {
  const fn = controller[propertyName];
  if (typeof fn !== 'function') return null;

  const endpointMeta = Reflect.getMetadata('endpoint', controller, propertyName);
  if (!endpointMeta) return null;

  const paramMetadata: ParamMetadata[] =
    Reflect.getMetadata('design:paramtypes', controller, propertyName) || [];

  if (paramMetadata.length === 0) {
    return fn.call(controller, payload);
  }

  const args: any[] = [];

  for (const param of paramMetadata) {
    let value: any;

    switch (param.type) {
      case 'body':
        value = await transformAndValidate(param.dto, payload.body);
        break;

      case 'params':
        value = param.name ? payload.params?.[param.name] : payload.params;
        break;

      case 'query':
        value = param.name ? payload.query?.[param.name] : payload.query;
        break;

      case 'request':
        value = payload;
        break;

      case 'headers':
        value = param.name ? payload.headers?.[param.name] : payload.headers;
        break;

      case 'cookies':
        value = param.name ? payload.cookies?.[param.name] : payload.cookies;
        break;
    }

    args.push(value);
  }

  return fn.apply(controller, args);
};
