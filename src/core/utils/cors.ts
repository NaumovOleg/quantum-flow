import { CORS_METADATA_KEY } from '@constants';
import { CORSConfig, HTTP_METHODS } from '@types';

export function CORS(config: CORSConfig = {}) {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    const defaultConfig: CORSConfig = {
      origin: '*',
      methods: Object.keys(HTTP_METHODS),
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: 86400,
    };

    const finalConfig = { ...defaultConfig, ...config };

    if (propertyKey && descriptor) {
      Reflect.defineMetadata(CORS_METADATA_KEY, finalConfig, target, propertyKey);
    } else {
      Reflect.defineMetadata(CORS_METADATA_KEY, finalConfig, target.prototype || target);
    }
  };
}
