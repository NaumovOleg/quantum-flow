import { Controller, GET, Params } from 'quantum-flow/core';

@Controller({ prefix: 'metadata' })
export class UserMetadata {
  @GET('/:name')
  async getUserMetadata(@Params() params: any) {
    return params;
  }
}
