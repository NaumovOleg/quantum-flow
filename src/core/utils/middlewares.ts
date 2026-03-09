import { CATCH, SERVER_CONFIG_KEY } from '@constants';
import { ErrorCB, MiddlewareCB } from '@types';

export function Use(middleware: MiddlewareCB) {
  return function (target: any) {
    const config = Reflect.getMetadata(SERVER_CONFIG_KEY, target) || {};

    const mergedConfig = {
      ...config,
      middlewares: [...(config?.middlewares ?? []), middleware].filter((el) => !!el),
    };

    Reflect.defineMetadata(SERVER_CONFIG_KEY, mergedConfig, target);

    return target;
  };
}

export function Catch(handler: ErrorCB) {
  return function (target: any) {
    Reflect.defineMetadata(CATCH, handler, target);

    return target;
  };
}
