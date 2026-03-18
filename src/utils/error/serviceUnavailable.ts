import { ErrorCode } from '@types';
import { BaseError } from './base';

export class ServiceUnavailableError extends BaseError {
  constructor(message = 'Service unavailable', options?: { requestId?: string; path?: string }) {
    super(ErrorCode.SERVICE_UNAVAILABLE, message, {
      status: 503,
      requestId: options?.requestId,
      path: options?.path,
    });
    this.name = 'ServiceUnavailableError';
  }
}
